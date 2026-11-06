// Hugging Face Hub API service.
//
// Design principles:
// - Plain fetch against the public REST API — no SDK wrapper, no token gate.
//   Everything below is public data, so the dashboard works with zero config.
// - An optional VITE_HF_TOKEN (see .env.example) is attached when present to
//   lift rate limits, but is never required.
// - Never throw: on failure return null and let the UI render an honest
//   "unavailable" state. No synthetic or simulated numbers, ever.

import { HF_ORG } from '../config'

const HF_API_BASE = 'https://huggingface.co/api'

const hfHeaders = () => {
  const token = import.meta.env.VITE_HF_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function requestJson(url) {
  try {
    const response = await fetch(url, { headers: hfHeaders() })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.warn(`[huggingface] request failed: ${url}`, error)
    return null
  }
}

function modelUrl(modelId) {
  return `https://huggingface.co/${modelId}`
}

/**
 * Fetch the live stats for one model.
 *
 * Uses the expand[] params so a single request returns downloads (last 30
 * days), all-time downloads, likes, timestamps, derived-works counts
 * (childrenModelCount) and the Spaces building on the model.
 */
export async function fetchModelInfo(modelId) {
  const expand = [
    'downloads',
    'downloadsAllTime',
    'likes',
    'createdAt',
    'lastModified',
    'childrenModelCount',
    'spaces',
  ].map((field) => `expand[]=${field}`).join('&')

  const json = await requestJson(`${HF_API_BASE}/models/${modelId}?${expand}`)
  if (!json) return null

  return {
    id: json.id ?? modelId,
    url: modelUrl(modelId),
    downloads: json.downloads ?? 0,
    downloadsAllTime: json.downloadsAllTime ?? 0,
    likes: json.likes ?? 0,
    createdAt: json.createdAt ?? null,
    lastModified: json.lastModified ?? null,
    childrenModelCount: {
      finetune: json.childrenModelCount?.finetune ?? 0,
      adapter: json.childrenModelCount?.adapter ?? 0,
      quantized: json.childrenModelCount?.quantized ?? 0,
      merge: json.childrenModelCount?.merge ?? 0,
    },
    spaces: Array.isArray(json.spaces) ? json.spaces : [],
  }
}

/**
 * Fetch the open and closed discussion counts and lists for a model.
 *
 * `?status=open` returns { discussions, count, numClosedDiscussions } where
 * count is the open count; `?status=closed` has the same shape with the
 * closed count. We normalise the discussion items to camelCase and link each
 * to its canonical discussion URL.
 */
function normaliseDiscussion(item, modelId) {
  return {
    num: item.num,
    title: item.title,
    createdAt: item.createdAt ?? null,
    isPullRequest: Boolean(item.isPullRequest),
    numComments: item.numComments ?? 0,
    author: {
      name: item.author?.name ?? 'Anonymous',
      fullname: item.author?.fullname ?? null,
    },
    isParticipating: Boolean(item.repoOwner?.isParticipating),
    url: `${modelUrl(modelId)}/discussions/${item.num}`,
  }
}

export async function fetchDiscussionOverview(modelId) {
  const open = await requestJson(`${HF_API_BASE}/models/${modelId}/discussions?status=open&limit=50`)
  const closed = await requestJson(`${HF_API_BASE}/models/${modelId}/discussions?status=closed&limit=50`)
  if (!open || !closed) return null

  return {
    openCount: open.count ?? open.discussions?.length ?? 0,
    closedCount: closed.count ?? closed.discussions?.length ?? 0,
    openDiscussions: (open.discussions ?? []).map((d) => normaliseDiscussion(d, modelId)),
    closedDiscussions: (closed.discussions ?? []).map((d) => normaliseDiscussion(d, modelId)),
  }
}

/**
 * Fetch one discussion's event timeline. The top-level author._id identifies
 * the starter, so the first comment event from any other author gives us the
 * first-response time.
 */
export async function fetchDiscussionDetail(modelId, num) {
  const json = await requestJson(`${HF_API_BASE}/models/${modelId}/discussions/${num}`)
  if (!json) return null

  return {
    num: json.num ?? num,
    title: json.title ?? '',
    createdAt: json.createdAt ?? null,
    starterId: json.author?._id ?? null,
    events: (json.events ?? [])
      .filter((event) => event.createdAt && event.author?._id)
      .map((event) => ({
        type: event.type,
        createdAt: event.createdAt,
        authorId: event.author._id,
      })),
  }
}

/**
 * Compute community-health metrics for a model from public discussion data:
 *
 * - resolution rate (closed / total discussions)
 * - median first-response time across recent open discussions
 * - unanswered discussions (open, no replies yet — for PRs the description
 *   itself counts as the first comment)
 * - participation (distinct community members who commented)
 */
export async function fetchCommunityHealth(modelId) {
  const overview = await fetchDiscussionOverview(modelId)
  if (!overview) return null

  const sampled = overview.openDiscussions.slice(0, 10)
  const details = await Promise.all(
    sampled.map((discussion) => fetchDiscussionDetail(modelId, discussion.num))
  )

  const responseTimes = []
  const participants = new Set()
  details.forEach((detail) => {
    if (!detail) return
    detail.events.forEach((event) => {
      if (event.type !== 'comment' || event.authorId === detail.starterId) return
      participants.add(event.authorId)
      const elapsed = new Date(event.createdAt) - new Date(detail.createdAt)
      if (Number.isFinite(elapsed) && elapsed >= 0) responseTimes.push(elapsed)
    })
  })

  responseTimes.sort((a, b) => a - b)
  const median = responseTimes.length
    ? responseTimes[Math.floor((responseTimes.length - 1) / 2)]
    : null

  const total = overview.openCount + overview.closedCount

  return {
    modelId,
    openCount: overview.openCount,
    closedCount: overview.closedCount,
    resolutionRate: total ? overview.closedCount / total : null,
    medianFirstResponseMs: median,
    sampledDiscussionCount: details.filter(Boolean).length,
    unansweredCount: overview.openDiscussions.filter(
      (d) => (d.isPullRequest ? d.numComments <= 1 : d.numComments === 0)
    ).length,
    participants: participants.size,
    needsReply: overview.openDiscussions
      .filter((d) => (d.isPullRequest ? d.numComments <= 1 : d.numComments === 0))
      .slice(0, 5),
    openDiscussions: overview.openDiscussions,
  }
}

/**
 * Fetch the datasets published by the org, most downloaded first.
 */
export async function fetchOrgDatasets() {
  const json = await requestJson(`${HF_API_BASE}/datasets?author=${HF_ORG}&limit=100`)
  if (!Array.isArray(json)) return null

  return json
    .map((dataset) => ({
      id: dataset.id,
      url: `https://huggingface.co/datasets/${dataset.id}`,
      downloads: dataset.downloads ?? 0,
      likes: dataset.likes ?? 0,
    }))
    .sort((a, b) => b.downloads - a.downloads)
}
