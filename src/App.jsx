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
import { isTokenConfigured, fetchModelInfo } from './services/huggingface'

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
  { id: 'allenai/Olmo-3.1-32B-Instruct-SFT', name: 'Olmo', variants: ['3.1-32B'] },
  { id: 'Qwen/Qwen3.5-35B-A3B', name: 'Qwen', variants: ['Qwen3.5-35B'] },
  { id: 'mistralai/Ministral-3-3B-Instruct-2512-BF16', name: 'Ministral', variants: ['3-3B'] },
  { id: 'aisingapore/Gemma-SEA-LION-v4-27B-IT', name: 'SEA-LION', variants: ['Gemma-v4-27BB'] },
  { id: 'zai-org/GLM-4.6V-Flash', name: 'GLM', variants: ['4.6V-Flash'] },
  { id: 'moonshotai/Kimi-K2-Instruct-0905', name: 'Kimi K2', variants: ['Instruct-0905'] },
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
          parameters: `${Math.floor(Math.random() * 200 + 7)}B`,
          releaseDate: '2024-01-15',
          color: COLORS[idx % COLORS.length]
        }
      }),
      color: COLORS[idx % COLORS.length]
    }
  })

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

  // Fetch real data from Hugging Face API
  const fetchRealData = async () => {
    const tokenConfigured = isTokenConfigured()
    if (!tokenConfigured) {
      console.warn('Hugging Face token not configured. Using mock data.')
      return false
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
              parameters: info.modelId?.includes('7B') ? '7B' : 
                          info.modelId?.includes('8B') ? '8B' : 
                          info.modelId?.includes('22B') ? '22B' : 'Unknown',
              releaseDate: info.createdAt ? new Date(info.createdAt).toISOString().split('T')[0] : '2024-01-01',
              color: COLORS[modelsData.length % COLORS.length]
            })),
            color: COLORS[modelsData.length % COLORS.length]
          })
        }
      } catch (error) {
        console.error(`Error fetching ${model.id}:`, error)
      }
    }

    if (modelsData.length > 0) {
      setData({ models: modelsData, dates })
      
      const initialSelection = {}
      modelsData.forEach(m => {
        initialSelection[m.id] = true
      })
      setSelectedModels(initialSelection)
      return true
    }
    
    return false
  }

  useEffect(() => {
    // Try to use real data if token is configured
    const loadData = async () => {
      const tokenConfigured = isTokenConfigured()
      
      if (tokenConfigured) {
        const success = await fetchRealData()
        if (success) {
          setUseRealData(true)
          setLoading(false)
          return
        }
      }
      
      // Fall back to mock data
      setTimeout(() => {
        const mockData = generateMockData()
        setData(mockData)
        
        const initialSelection = {}
        mockData.models.forEach(m => {
          initialSelection[m.id] = true
        })
        setSelectedModels(initialSelection)
        setLoading(false)
      }, 1000)
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
          label: function(context) {
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
        parameters: v.parameters,
        releaseDate: v.releaseDate,
        totalDownloads: v.totalDownloads,
        color: v.color
      }))
    )
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1
      if (sortBy === 'downloads') return (a.totalDownloads - b.totalDownloads) * multiplier
      if (sortBy === 'name') return a.model.localeCompare(b.model) * multiplier
      if (sortBy === 'parameters') return (parseInt(a.parameters) - parseInt(b.parameters)) * multiplier
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
          <div className="lg:col-span-3 space-y-6">
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
                    <option value="parameters">Parameters</option>
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
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Parameters</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Release Date</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Total Downloads</th>
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
                        <td className="py-3 px-4 text-gray-300">{row.parameters}</td>
                        <td className="py-3 px-4 text-gray-300">{row.releaseDate}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.totalDownloads.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
