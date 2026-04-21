import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { isTokenConfigured, fetchModelInfo, fetchDiscussions, fetchDiscussionStats } from './services/huggingface'
import { fetchUserRepositories } from './services/github'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// List of models that are visualized
// TODO: this belongs in a config file
const baseModels = [
  { id: 'swiss-ai/Apertus-8B-Instruct-2509', name: 'Apertus', variants: ['1.0-8B'] },
  { id: 'utter-project/EuroLLM-22B-Instruct-2512', name: 'EuroLLM', variants: ['1.0-22B'] },
  { id: 'aisingapore/Gemma-SEA-LION-v4-27B-IT', name: 'SEA-LION', variants: ['Gemma-v4-27BB'] },
  { id: 'zai-org/GLM-4.6V-Flash', name: 'GLM', variants: ['4.6V-Flash'] },
  { id: 'moonshotai/Kimi-K2-Instruct-0905', name: 'Kimi K2', variants: ['Instruct-0905'] },
  { id: 'mistralai/Ministral-3-3B-Instruct-2512-BF16', name: 'Ministral', variants: ['3-3B'] },
  { id: 'nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16', name: 'Nemotron 3', variants: ['Super-120B'] },
  { id: 'allenai/Olmo-3.1-32B-Instruct-SFT', name: 'Olmo', variants: ['3.1-32B'] },
  { id: 'Qwen/Qwen3.5-397B-A17B-GPTQ-Int4', name: 'Qwen', variants: ['Qwen3.5-397B'] },
]

// Color palette for models
const COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
]

// Generate mock data for demonstration
const generateMockData = () => {
  const days = 30
  const today = new Date()
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    return d.toISOString().split('T')[0]
  })

  const modelsData = baseModels.map((model, idx) => {
    const baseDownloads = Math.floor(Math.random() * 50000) + 10000
    const data = dates.map(() => {
      const variation = Math.floor(Math.random() * 10000) - 5000
      return Math.max(0, baseDownloads + variation)
    })

    return {
      id: model.id,
      name: model.name,
      variants: model.variants.map(v => {
        const variantData = data.map((d, i) => ({
          date: dates[i],
          count: Math.floor(d * (0.8 + Math.random() * 0.4))
        }))
        return {
          name: v,
          downloads: variantData,
          totalDownloads: variantData.reduce((sum, item) => sum + item.count, 0),
          likes: Math.floor(Math.random() * 1000),
          releaseDate: '2024-01-15',
          color: COLORS[idx % COLORS.length]
        }
      }),
      color: COLORS[idx % COLORS.length]
    }
  })

  return { models: modelsData, dates }
}

let hasconnected = false

// Fetch real data from Hugging Face API
const fetchRealData = async () => {
  const tokenConfigured = isTokenConfigured()
  if (!tokenConfigured) {
    console.warn('Hugging Face token not configured. Using mock data.')
    return false
  } else if (hasconnected) {
    console.debug('Not reconnecting')
    return false
  } else {
    console.info('Connecting to Hugging Face API')
    hasconnected = true
  }

  const days = 30
  const today = new Date()
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (days - 1 - i))
    return d.toISOString().split('T')[0]
  })

  const modelsData = []

  for (const model of baseModels) {
    try {
      const info = await fetchModelInfo(model.id)
      if (info) {
        const baseDownloads = info.downloads || 0
        const dailyDownloads = Math.floor(baseDownloads / 30)

        modelsData.push({
          id: model.id,
          name: model.name,
          variants: model.variants.map(v => ({
            name: v,
            downloads: dates.map((date, i) => ({
              date,
              count: Math.floor(dailyDownloads * (0.8 + Math.random() * 0.4))
            })),
            totalDownloads: baseDownloads,
            likes: info.likes,
            releaseDate: 
              info.updatedAt ? new Date(info.updatedAt).toISOString().split('T')[0] :
              info.createdAt ? new Date(info.createdAt).toISOString().split('T')[0] : '?',
            color: COLORS[modelsData.length % COLORS.length]
          })),
          color: COLORS[modelsData.length % COLORS.length]
        })
      }
    } catch (error) {
      console.error(`Error fetching ${model.id}:`, error)
    }
  }

  return { models: modelsData, dates }
}

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedModels, setSelectedModels] = useState({})
  const [timeRange, setTimeRange] = useState(30)
  const [sortBy, setSortBy] = useState('downloads')
  const [sortOrder, setSortOrder] = useState('desc')
  const [useRealData, setUseRealData] = useState(false)
  const [githubRepos, setGithubRepos] = useState([])
  const [githubLoading, setGithubLoading] = useState(true)
  const [discussions, setDiscussions] = useState([])
  const [discussionStats, setDiscussionStats] = useState(null)
  const [discussionsLoading, setDiscussionsLoading] = useState(true)

  useEffect(() => {
    // Try to use real data if token is configured
    const loadData = async () => {
      const tokenConfigured = isTokenConfigured()

      // Load GitHub statistics
      const loadGithubStats = async () => {
        const repos = await fetchUserRepositories('swiss-ai')
        setGithubRepos(repos || [])
        setGithubLoading(false)
      }

      // Load Hugging Face discussions
      const loadDiscussions = async () => {
        try {
          // Fetch discussions for the Apertus model
          const apertusDiscussions = await fetchDiscussions('swiss-ai/Apertus-8B-Instruct-2509', { limit: 10 })
          setDiscussions(apertusDiscussions || [])
          
          // Fetch aggregated stats for base models
          const stats = await fetchDiscussionStats('swiss-ai/Apertus-8B-Instruct-2509')
          setDiscussionStats(stats)
        } catch (error) {
          console.error('Error loading discussions:', error)
        } finally {
          setDiscussionsLoading(false)
        }
      }

      if (tokenConfigured) {
        await fetchRealData().then((md) => {
          if (!md) return
          if (md.models.length > 0) {
            setData({ models: md.models, dates: md.dates })

            const initialSelection = {}
            md.models.forEach(m => {
              initialSelection[m.id] = true
            })
            setSelectedModels(initialSelection)

            loadGithubStats()
            loadDiscussions()
            setUseRealData(true)
            setLoading(false)
          }
        })
      } else {
        // Fall back to mock data
        const mockData = generateMockData()
        setData(mockData)

        const initialSelection = {}
        mockData.models.forEach(m => {
          initialSelection[m.id] = true
        })
        setSelectedModels(initialSelection)
        setDiscussionsLoading(false)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const toggleModel = (modelId) => {
    setSelectedModels(prev => ({
      ...prev,
      [modelId]: !prev[modelId]
    }))
  }

  const chartData = {
    labels: data?.dates || [],
    datasets: data?.models
      .filter(m => selectedModels[m.id])
      .flatMap(m =>
        m.variants.map(v => ({
          label: `${m.name} - ${v.name}`,
          data: v.downloads.slice(-timeRange).map(d => d.count),
          borderColor: v.color,
          backgroundColor: v.color + '20',
          tension: 0.4,
          fill: false,
          pointRadius: 2,
          pointHoverRadius: 6,
        }))
      ) || []
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: { size: 11 },
          boxWidth: 12,
          padding: 10,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} downloads`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9CA3AF', maxTicksLimit: 10 }
      },
      y: {
        grid: { color: '#374151' },
        ticks: {
          color: '#9CA3AF',
          callback: (value) => value.toLocaleString()
        }
      }
    }
  }

  // Get flattened table data
  const tableData = data?.models
    .flatMap(m =>
      m.variants.map(v => ({
        model: m.name,
        variant: v.name,
        likes: v.likes,
        releaseDate: v.releaseDate,
        totalDownloads: v.totalDownloads,
        color: v.color
      }))
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1
      if (sortBy === 'downloads') return (a.totalDownloads - b.totalDownloads) * multiplier
      if (sortBy === 'name') return a.model.localeCompare(b.model) * multiplier
      if (sortBy === 'likes') return (parseInt(a.likes) - parseInt(b.likes)) * multiplier
      return 0
    }) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading model data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Hugging Face Tracker</h1>
            <p className="text-gray-400 text-sm">Interactive LLM Model Download Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${useRealData ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              <span className="text-gray-400 text-sm">
                {useRealData ? 'Live Data' : 'Demo Data'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Time Range:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Model Filters */}
          <aside className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Models</h2>
              <div className="space-y-2">
                {data?.models.map(m => (
                  <label
                    key={m.id}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModels[m.id] || false}
                      onChange={() => toggleModel(m.id)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: m.color }}
                    ></span>
                    <span className="text-gray-200">{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Download Trends (Last {timeRange} Days)</h2>
              <div className="h-80">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Metadata Table */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold">Model Metadata</h2>
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 text-sm">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="downloads">Downloads</option>
                    <option value="name">Name</option>
                    <option value="likes">Likes</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition-colors"
                    title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Variant</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Likes</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Updated</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Downloads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: row.color }}
                            ></span>
                            {row.model}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{row.variant}</td>
                        <td className="py-3 px-4 text-gray-300">{row.likes}</td>
                        <td className="py-3 px-4 text-gray-300">{row.releaseDate}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.totalDownloads.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Statistics */}
          <aside className="lg:col-span-1 space-y-6">
            {/* GitHub Stars */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                @swiss-ai 
              </h2>
              {githubLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : githubRepos.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {githubRepos
                      .sort((a, b) => b.stars - a.stars)
                      .map(repo => (
                        <div key={repo.name} className="flex items-center justify-between text-sm">
                          <a 
                            href={repo.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-blue-400 truncate max-w-[120px]"
                            title={repo.name}
                          >
                            {repo.name}
                          </a>
                          <span className="text-yellow-400 font-medium flex-shrink-0 ml-2">
                            ⭐ {repo.stars}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No repositories found</p>
              )}
            </div>

            {/* Hugging Face Community */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🤗
                Apertus Community
              </h2>
              {discussionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : discussions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Discussions</span>
                    <span className="text-white font-medium">
                      {discussionStats?.totalDiscussions || discussions.length}
                    </span>
                  </div>
                  {discussionStats && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Comments</span>
                      <span className="text-gray-300">
                        {discussionStats.totalComments}
                      </span>
                    </div>
                  )}
                  {discussionStats && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Resolved</span>
                      <span className="text-gray-300">
                        {discussionStats.resolvedDiscussions}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-700 my-4"></div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Discussions</h3>
                  <div className="space-y-2">
                    {discussions.slice(0, 5).map(discussion => (
                      <a
                        key={discussion.id}
                        href={discussion.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm hover:text-orange-400 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          {discussion.isPinned && (
                            <span className="text-yellow-400 flex-shrink-0" title="Pinned">📌</span>
                          )}
                          {discussion.isResolved && (
                            <span className="text-green-400 flex-shrink-0" title="Resolved">✅</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-300 truncate" title={discussion.title}>
                              {discussion.title}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              by {discussion.author} • {discussion.numComments} comment{discussion.numComments !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                  <a
                    href="https://huggingface.co/swiss-ai/Apertus-8B-Instruct-2509/discussions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-orange-400 hover:text-orange-300 mt-4 py-2 px-3 bg-gray-700/50 rounded transition-colors"
                  >
                    View all discussions →
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-500 text-sm">
                    No discussions found
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Top Model Downloads</span>
                  <span className="text-white font-medium">
                    {data?.models[0]?.variants[0]?.totalDownloads.toLocaleString() || '—'}
                  </span>
                </div>
                <div className="border-t border-gray-700"></div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Models Tracked</span>
                  <span className="text-white font-medium">{data?.models.length || 0}</span>
                </div>
                <div className="border-t border-gray-700"></div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Data Source</span>
                  <span className={`text-sm font-medium ${useRealData ? 'text-green-400' : 'text-yellow-400'}`}>
                    {useRealData ? 'Live' : 'Demo'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-4 mt-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>Data sourced from Hugging Face Hub API • Last updated: {new Date().toLocaleString()}</p>
        </div>
      </footer>
    </div>
  )
}

export default App
