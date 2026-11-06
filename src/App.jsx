import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MODELS } from './config'
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
      onRateLimited?.(error)
    }
    return null
  }
}

function App() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [githubNotice, setGithubNotice] = useState(null)

  // The model the model-specific panels (ecosystem, community health, stat
  // cards) are calculated for. Switching recycles the cached per-model info
  // and only refetches the model-specific live sources.
  const [selectedModel, setSelectedModel] = useState(null)
  const selectedModelRef = useRef(selectedModel)
  const requestToken = useRef(0)

  const [modelInfos, setModelInfos] = useState(null)
  const [datasets, setDatasets] = useState(null)
  const [health, setHealth] = useState(null)
  const [pulse, setPulse] = useState(null)
  const [repos, setRepos] = useState(null)

  const selectedModelName = MODELS.find((m) => m.id === selectedModel)?.name

  // Joined view (config + fetched info) for the peer-comparison table.
  const models = useMemo(
    () => MODELS.map((entry, i) => ({ ...entry, ...(modelInfos?.[i] ?? {}) })),
    [modelInfos]
  )
  const selectedInfo = modelInfos?.find((info) => info?.id === selectedModel)

  // Community health and the org's datasets are the only model-specific
  // sources that need a refetch on model switch. The token guard ensures a
  // stale response can never overwrite a newer one.
  const fetchModelSpecific = useCallback(async (modelInfo) => {
    const token = ++requestToken.current
    if (!modelInfo) return;
    const org = modelInfo.id.split('/')[0]
    const [orgDatasets, modelHealth] = await Promise.all([
      fetchOrgDatasets(modelInfo.org),
      fetchCommunityHealth(modelInfo.id),
    ])
    if (token !== requestToken.current) return // a newer request owns the state now
    setDatasets(orgDatasets)
    setHealth(modelHealth)
  }, [])

  // Full refresh of every source (mount + refresh button).
  const loadAll = useCallback(async () => {
    setRefreshing(true)
    setGithubNotice(null)

    // fetchModelSpecific runs in parallel with the rest; it sets the
    // model-specific `health` and `datasets` state internally, token-guarded.
    const [infos, orgPulse, orgRepos] = await Promise.all([
      Promise.all(MODELS.map((entry) => fetchModelInfo(entry.id))),
      safe(fetchOrgPulse, setGithubNotice),
      safe(fetchOrgRepositories, setGithubNotice),
      fetchModelSpecific(selectedModelRef.current),
    ])

    setModelInfos(infos)
    setPulse(orgPulse)
    setRepos(orgRepos)
    setLastUpdated(new Date())
    setRefreshing(false)
    setLoading(false)
  }, [fetchModelSpecific])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Light recalc on model switch: the ecosystem view and stat cards
  // re-derive instantly from the cached per-model infos; only the two
  // model-specific live sources are refetched.
  const handleModelChange = useCallback(
    async (id) => {
      if (id === selectedModelRef.current || loading) return
      setSelectedModel(id)
      selectedModelRef.current = id
      setRefreshing(true)
      await fetchModelSpecific(id)
      setLastUpdated(new Date())
      setRefreshing(false)
    },
    [fetchModelSpecific, loading]
  )

  const selectedDerived = selectedInfo
    ? Object.values(selectedInfo.childrenModelCount ?? {}).reduce((sum, n) => sum + n, 0)
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
              <label htmlFor="model-select" className="text-gray-400 text-sm">
                Model:
              </label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(event) => handleModelChange(event.target.value)}
                disabled={loading}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {MODELS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  refreshing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                }`}
              />
              <span className="text-gray-400 text-sm">
                {refreshing ? 'Refreshing…' : 'Live data'}
                {lastUpdated && (
                  <span className="text-gray-500">
                    {' '}
                    · updated {lastUpdated.toLocaleTimeString()}
                  </span>
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
            {githubNotice.message ?? String(githubNotice)}
          </div>
        )}

        {/* Stat cards — reflect the selected model (plus the org-wide GitHub pulse) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Downloads (30 days)', value: formatCompact(selectedInfo?.downloads) },
            { label: 'All-time downloads', value: formatCompact(selectedInfo?.downloadsAllTime) },
            { label: 'Likes', value: formatCompact(selectedInfo?.likes) },
            {
              label: 'Derived works',
              value: selectedDerived == null ? '—' : selectedDerived.toLocaleString(),
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
        <DownloadsPanel models={models} selectedModelId={selectedModel} />
        <EcosystemPanel
          model={selectedInfo}
          datasets={datasets}
          modelName={selectedModelName}
        />
        <ContributionsPanel pulse={pulse} repos={repos} />
        <CommunityHealthPanel health={health} modelName={selectedModelName} />

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
