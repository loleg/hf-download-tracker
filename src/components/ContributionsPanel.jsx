import { formatCompact, timeAgo } from '../utils'

export function ContributionsPanel({ pulse, repos }) {
  const unavailable = !pulse

  const externalShare = pulse?.externalPRShare ?? 0
  const externalPercent = Math.round(externalShare * 100)
  const recentMerged = (pulse?.mergedPRs ?? []).slice(0, 8)
  const openIssues = (pulse?.openIssues ?? []).slice(0, 6)
  const contributors = (pulse?.contributors ?? []).slice(0, 6)
  const trackedRepos = (repos ?? [])
    .filter((repo) => repo.tracked)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6)

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-1">Contributions</h2>
      <p className="text-gray-400 text-sm mb-4">
        Who is actually doing the work — external contributors vs the core team, across the org's
        GitHub repositories.
      </p>

      {unavailable && (
        <p className="text-gray-500 text-sm py-4">
          Contribution data unavailable right now — the GitHub API request failed. Try
          refreshing.
        </p>
      )}

      {!unavailable && (
        <>
          {/* External contribution share */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-gray-400 text-sm">External contribution share</span>
              <span className="text-white font-semibold">
                {externalPercent}%
                <span className="text-gray-400 text-xs ml-1">
                  of {pulse.totalMerged.toLocaleString()} merged PRs
                </span>
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${externalPercent}%` }}
                title={`${pulse.externalPRCount} external of ${pulse.mergedPRs.length} shown`}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              {pulse.externalPRCount} of the {pulse.mergedPRs.length} most recent merged PRs came
              from outside the core team (author_association: NONE / CONTRIBUTOR /
              FIRST_TIME_CONTRIBUTOR / FIRST_TIMER).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Merged PRs */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Recently merged pull requests
                <span className="text-gray-500 text-xs ml-2">
                  showing {recentMerged.length} of {pulse.totalMerged.toLocaleString()}
                </span>
              </h3>
              <ul className="space-y-2">
                {recentMerged.map((pr) => (
                  <li key={`${pr.repo}-${pr.number}`} className="text-sm">
                    <div className="flex items-start gap-2">
                      {pr.external ? (
                        <span
                          className="text-emerald-400 flex-shrink-0 text-xs"
                          title="External contributor"
                        >
                          ●
                        </span>
                      ) : (
                        <span className="text-blue-400 flex-shrink-0 text-xs" title="Core team">
                          ●
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-200 hover:text-blue-400 block truncate"
                          title={pr.title}
                        >
                          {pr.title}
                        </a>
                        <div className="text-gray-500 text-xs">
                          {pr.repo?.split('/').pop()} · by{' '}
                          <a
                            href={pr.authorUrl ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-400"
                          >
                            {pr.author}
                          </a>{' '}
                          · merged {timeAgo(pr.mergedAt)}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Open issues */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Open issues
                {pulse.totalOpenIssues != null && (
                  <span className="text-gray-500 text-xs ml-2">
                    {formatCompact(pulse.totalOpenIssues)} total
                  </span>
                )}
              </h3>
              {openIssues.length === 0 && (
                <p className="text-gray-500 text-sm">No open issues — nice.</p>
              )}
              <ul className="space-y-2">
                {openIssues.map((issue) => (
                  <li key={`${issue.repo}-${issue.number}`} className="text-sm">
                    <a
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-blue-400 block truncate"
                      title={issue.title}
                    >
                      {issue.title}
                    </a>
                    <div className="text-gray-500 text-xs">
                      {issue.repo?.split('/').pop()} · opened {timeAgo(issue.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contributors */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Most active contributors (merged PRs)
            </h3>
            <div className="flex flex-wrap gap-2">
              {contributors.map((contributor) => (
                <div
                  key={contributor.login}
                  className="flex items-center gap-2 bg-gray-700/50 rounded-full px-3 py-1"
                >
                  {contributor.url && (
                    <a
                      href={contributor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-200 hover:text-blue-400 text-sm"
                    >
                      {contributor.login}
                    </a>
                  )}
                  <span className="text-gray-400 text-xs">
                    {contributor.count} PR{contributor.count === 1 ? '' : 's'}
                    {contributor.externalCount > 0 && ' ⭐'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tracked repos */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Tracked repositories</h3>
        {!repos && (
          <p className="text-gray-500 text-sm">
            Repository data unavailable right now — the GitHub API request failed.
          </p>
        )}
        {trackedRepos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Repository</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Stars</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Forks</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Open issues</th>
                </tr>
              </thead>
              <tbody>
                {trackedRepos.map((repo) => (
                  <tr
                    key={repo.name}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-200 hover:text-blue-400"
                      >
                        {repo.name}
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right text-yellow-400">
                      {repo.stars.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {repo.forks.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {repo.openIssues.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
