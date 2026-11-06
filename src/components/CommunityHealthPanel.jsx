import { formatDuration, timeAgo } from '../utils'

const STATS = [
  {
    key: 'resolutionRate',
    label: 'Resolution rate',
    render: (health) =>
      health.resolutionRate == null
        ? '—'
        : `${Math.round(health.resolutionRate * 100)}%`,
    hint: 'closed / all discussions',
  },
  {
    key: 'firstResponse',
    label: 'Median first response',
    render: (health) => formatDuration(health.medianFirstResponseMs),
    hint: 'starter → first community reply',
  },
  {
    key: 'unanswered',
    label: 'Unanswered',
    render: (health) =>
      health.unansweredCount == null ? '—' : health.unansweredCount.toLocaleString(),
    hint: 'open discussions with no replies',
  },
  {
    key: 'participation',
    label: 'Participation',
    render: (health) =>
      health.participants == null ? '—' : health.participants.toLocaleString(),
    hint: 'distinct commenters in recent threads',
  },
]

export function CommunityHealthPanel({ health, modelName }) {
  const unavailable = !health

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-1">Community health</h2>
      <p className="text-gray-400 text-sm mb-4">
        How responsive and welcoming the {modelName ?? 'model'} community actually is — measured
        from public discussion data on Hugging Face.
      </p>

      {unavailable && (
        <p className="text-gray-500 text-sm py-4">
          Community health data unavailable right now — the Hugging Face API request failed. Try
          refreshing.
        </p>
      )}

      {!unavailable && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {STATS.map(({ key, label, render, hint }) => (
              <div
                key={key}
                className="bg-gray-700/50 rounded-lg p-3 border border-gray-600"
              >
                <div className="text-2xl font-bold text-white">{render(health)}</div>
                <div className="text-gray-200 text-sm font-medium">{label}</div>
                <div className="text-gray-400 text-xs mt-1">{hint}</div>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-xs mb-4">
            Median first response is computed across the {health.sampledDiscussionCount} most
            recent open discussions (a PR description counts as its first comment, so unanswered
            PRs are those with no reply beyond the description).
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Needs a reply
                <span className="text-gray-500 text-xs ml-2">
                  {health.needsReply.length} of {health.openCount} open
                </span>
              </h3>
              {health.needsReply.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Every open discussion has at least one reply — great sign.
                </p>
              )}
              <ul className="space-y-2">
                {health.needsReply.map((discussion) => (
                  <li key={discussion.num} className="text-sm">
                    <a
                      href={discussion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-blue-400 block truncate"
                      title={discussion.title}
                    >
                      {discussion.title}
                    </a>
                    <div className="text-gray-500 text-xs">
                      by {discussion.author.name} · {timeAgo(discussion.createdAt)}
                      {discussion.isPullRequest ? ' · PR' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Recently active discussions
                <span className="text-gray-500 text-xs ml-2">
                  {health.openDiscussions.length} open
                </span>
              </h3>
              <ul className="space-y-2">
                {health.openDiscussions.slice(0, 6).map((discussion) => (
                  <li key={discussion.num} className="text-sm">
                    <a
                      href={discussion.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-blue-400 block truncate"
                      title={discussion.title}
                    >
                      {discussion.title}
                    </a>
                    <div className="text-gray-500 text-xs">
                      {discussion.numComments} comment
                      {discussion.numComments === 1 ? '' : 's'}
                      {discussion.isParticipating ? ' · team replied' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
