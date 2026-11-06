// GitHub API service for the Apertus community dashboard.
//
// The GitHub REST API allows 60 requests/hour unauthenticated (per IP) and
// 5,000/hour with a token. Everything the dashboard needs is public, so it
// works without any configuration; an optional VITE_GITHUB_TOKEN (see
// .env.example — a fine-grained PAT with no extra scopes is enough) lifts
// the rate limit.
//
// Error convention: ordinary failures return null (the UI shows an honest
// \"unavailable\" state), but hitting the unauthenticated rate limit throws
// GitHubRateLimitError so the app can tell the user exactly how to fix it.

import { GITHUB_ORG, TRACKED_REPOS } from '../config'

const GITHUB_API_BASE = 'https://api.github.com'

// author_association values that indicate a PR came from outside the core
// team (MEMBER/OWNER/COLLABORATOR are insiders).
const EXTERNAL_ASSOCIATIONS = new Set([
  'NONE',
  'CONTRIBUTOR',
  'FIRST_TIME_CONTRIBUTOR',
  'FIRST_TIMER',
])

export class GitHubRateLimitError extends Error {
  constructor(resetSeconds) {
    const resetAt = new Date(Date.now() + Number(resetSeconds ?? 3600) * 1000)
    super(
      `GitHub API rate limit reached. Unauthenticated requests are limited to ` +
        `60/hour. Add a VITE_GITHUB_TOKEN to your .env to lift it — see README. ` +
        `Limits reset at ${resetAt.toLocaleTimeString()}.`
    )
    this.name = 'GitHubRateLimitError'
    this.resetAt = resetAt
  }
}

function authHeaders() {
  const token = import.meta.env.VITE_GITHUB_TOKEN
  const headers = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function githubFetch(path) {
  let response
  try {
    response = await fetch(`${GITHUB_API_BASE}${path}`, { headers: authHeaders() })
  } catch (error) {
    console.warn(`[github] request failed: ${path}`, error)
    return null
  }

  if (response.status === 403 || response.status === 429) {
    const remaining = response.headers.get('x-ratelimit-remaining')
    if (remaining === '0') throw new GitHubRateLimitError(response.headers.get('x-ratelimit-reset'))
    return null
  }
  if (!response.ok) return null
  return response
}

function repoFullNameFromUrl(repositoryUrl) {
  // e.g. \"https://api.github.com/repos/swiss-ai/pretrain-data\" -> \"swiss-ai/pretrain-data\"
  const marker = '/repos/'
  const index = repositoryUrl?.indexOf(marker)
  if (index === -1 || index === undefined) return null
  return repositoryUrl.slice(index + marker.length)
}

/**
 * Fetch the org's public repositories (stars, forks, open issues).
 */
export async function fetchOrgRepositories() {
  const response = await githubFetch(`/orgs/${GITHUB_ORG}/repos?per_page=100&sort=pushed`)
  if (!response) return null

  const repos = await response.json()
  if (!Array.isArray(repos)) return null

  return repos.map((repo) => ({
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    url: repo.html_url,
    stars: repo.stargazers_count ?? 0,
    forks: repo.forks_count ?? 0,
    openIssues: Math.max(0, (repo.open_issues_count ?? 0)),
    pushedAt: repo.pushed_at ?? null,
    tracked: TRACKED_REPOS.includes(repo.name),
  }))
}

/**
 * Fetch a merged-PR / open-issue pulse for the org via the search API.
 *
 * Returns merged PRs (with author_association, so external contributions are
 * identifiable), the external PR share, and the most active contributors.
 */
export async function fetchOrgPulse() {
  const prSearch = await githubFetch(
    `/search/issues?q=org:${GITHUB_ORG}+type:pr+is:merged&sort=created&order=desc&per_page=30`
  )
  if (!prSearch) return null
  const prJson = await prSearch.json()

  const issueSearch = await githubFetch(
    `/search/issues?q=org:${GITHUB_ORG}+type:issue+state:open&sort=created&order=desc&per_page=30`
  )
  const issueJson = issueSearch ? await issueSearch.json() : null

  const mergedPRs = (prJson.items ?? []).map((item) => {
    const fullName = repoFullNameFromUrl(item.repository_url)
    return {
      number: item.number,
      title: item.title,
      repo: fullName,
      url: item.html_url,
      author: item.user?.login ?? 'ghost',
      authorUrl: item.user?.html_url ?? null,
      createdAt: item.created_at ?? null,
      mergedAt: item.pull_request?.merged_at ?? item.closed_at ?? null,
      association: item.author_association ?? 'NONE',
      external: EXTERNAL_ASSOCIATIONS.has(item.author_association ?? 'NONE'),
    }
  })

  const contributors = Object.values(
    mergedPRs.reduce((byAuthor, pr) => {
      byAuthor[pr.author] = byAuthor[pr.author] ?? {
        login: pr.author,
        url: pr.authorUrl,
        count: 0,
        externalCount: 0,
      }
      byAuthor[pr.author].count += 1
      if (pr.external) byAuthor[pr.author].externalCount += 1
      return byAuthor
    }, {})
  ).sort((a, b) => b.count - a.count)

  return {
    totalMerged: prJson.total_count ?? mergedPRs.length,
    mergedPRs,
    externalPRCount: mergedPRs.filter((pr) => pr.external).length,
    externalPRShare: mergedPRs.length
      ? mergedPRs.filter((pr) => pr.external).length / mergedPRs.length
      : 0,
    contributors,
    openIssues: (issueJson?.items ?? []).map((item) => ({
      number: item.number,
      title: item.title,
      repo: repoFullNameFromUrl(item.repository_url),
      url: item.html_url,
      author: item.user?.login ?? 'ghost',
      createdAt: item.created_at ?? null,
      comments: item.comments ?? 0,
    })),
    totalOpenIssues: issueJson?.total_count ?? null,
  }
}
