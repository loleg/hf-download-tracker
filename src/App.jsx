import { useCallback, useEffect, useState } from 'react'
import { MODELS, APERTUS_MODEL } from './config'
import { fetchModelInfo, fetchCommunityHealth, fetchOrgDatasets } from './services/huggingface'
import { fetchOrgRepositories, fetchOrgPulse, GitHubRateLimitError } from './services/github'
import { DownloadsPanel } from './components/DownloadsPanel'
import { EcosystemPanel } from './components/EcosystemPanel'
import { ContributionsPanel } from './components/ContributionsPanel'
import { CommunityHealthPanel } from './components/CommunityHealthPanel'
import { formatCompact, formatDuration } from './utils'

// Never let one failing source take down the whole dashboard. GitHub rate
// limits get a dedicated, actionable notice instead of a silent null.
const safe = async (loader, onRateLimited) => {
  try {
    return await loader()
  } catch (error) {
    if (error instanceof GitHubRateLimitError) {
      onRateLimited?.()
      return null
    }
    return null
  }
}

function App() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [githubNotice, setGithubNotice] = useState(null)

  const [models, setModels] = useState(null)
  const [ecosystemModel, setEcosystemModel] = useState(null)
  const [datasets, setDatasets] = useState(null)
  const [health, setHealth] = useState(null)
  const [pulse, setPulse] = useState(null)
  const [repos, setRepos] = useState(null)

  const loadAll = useCallback(async () => {
    setRefreshing(true)
    setGithubNotice(null)

    const [
      modelInfos,
      overviewHealth,
      orgDatasets,
      orgPulse,
      orgRepos,
    ] = await Promise.all([
      Promise.all(MODELS.map((entry) => fetchModelInfo(entry.id))),
      safe(() => fetchCommunityHealth(APERTUS_MODEL), setGithubNotice),
      safe(fetchOrgDatasets, setGithubNotice),
      safe(fetchOrgPulse, setGithubNotice),
      safe(fetchOrgRepositories, setGithubNotice),
    ])

    const joined = MODELS.map((entry, i) => ({
      ...entry,
      ...(modelInfos[i] ?? {}),
    }))

    setModels(joined)
    setEcosystemModel(modelInfos.find((info) => info?.id === APERTUS_MODEL) ?? null)
    setDatasets(orgDatasets)
    setHealth(overviewHealth)
    setPulse(orgPulse)
    setRepos(orgRepos)
    setLastUpdated(new Date())
    setRefreshing(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const totalDownloads = (models ?? []).reduce(
    (sum, m) => (m.downloads != null ? sum + m.downloads : sum),
    0
  )
  const totalAllTime = (models ?? []).reduce(
    (sum, m) => (m.downloadsAllTime != null ? sum + m.downloadsAllTime : sum),
    0
  )
  const totalLikes = (models ?? []).reduce(
    (sum, m) => (m.likes != null ? sum + m.likes : sum),
    0
  )
  const apertusDerived = ecosystemModel
    ? Object.values(ecosystemModel.childrenModelCount ?? {}).reduce(
        (sum, n) => sum + n,
        0
      )
    : null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Apertus Community Dashboard</h1>
            <p className="text-gray-400 text-sm">
              Live community &amp; ecosystem metrics for the Swiss AI Initiative — no demo data,
              ever.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  refreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                }`}
              />
              <span className="text-gray-400 text-sm">
                {refreshing ? 'Refreshing…' : 'Live data'}
                {lastUpdated && (
                  <span className="text-gray-500"> · updated {lastUpdated.toLocaleTimeString()}</span>
                )}
              </span>
            </div>
            <button
              onClick={loadAll}
              disabled={refreshing}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {githubNotice && (
          <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-200 rounded-lg p-4 text-sm">
            {githubNotice.message ?? githubNotice}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Downloads (30 days)', value: formatCompact(totalDownloads) },
            { label: 'All-time downloads', value: formatCompact(totalAllTime) },
            { label: 'Likes', value: formatCompact(totalLikes) },
            {
              label: 'Derived works on Apertus',
              value: apertusDerived == null ? '—' : apertusDerived.toLocaleString(),
            },
            {
              label: 'External PR share',
              value: pulse ? `${Math.round(pulse.externalPRShare * 100)}%` : '—',
            },
            {
              label: 'Median first response',
              value: health ? formatDuration(health.medianFirstResponseMs) : '—',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-gray-400 text-xs mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Panels */}
        <DownloadsPanel models={models} />
        <EcosystemPanel model={ecosystemModel} datasets={datasets} />
        <ContributionsPanel pulse={pulse} repos={repos} />
        <CommunityHealthPanel health={health} />

        {/* Honesty footer */}
        <footer className="text-center text-gray-500 text-xs py-4">
          All numbers come live from the Hugging Face and GitHub public APIs at render time —
          nothing on this page is simulated or cached. Source code:{' '}
          <a
            href="https://github.com/swiss-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-blue-400"
          >
            swiss-ai on GitHub
          </a>
          .
        </footer>
      </main>
    </div>
  )
}

export default App
