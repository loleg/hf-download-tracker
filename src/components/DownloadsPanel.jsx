import { Fragment, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { OPENNESS_LABELS, OPENNESS_DESCRIPTIONS } from '../config'
import { formatCompact } from '../utils'

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend)

const COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
]

const SORT_OPTIONS = [
  { value: 'downloads', label: 'Downloads' },
  { value: 'likes', label: 'Likes' },
  { value: 'derived', label: 'Derived works' },
  { value: 'name', label: 'Name' },
]

function derivedTotal(model) {
  const c = model.childrenModelCount
  if (!c) return null
  return c.finetune + c.adapter + c.quantized + c.merge
}

export function DownloadsPanel({ models }) {
  const [sortKey, setSortKey] = useState('downloads')
  const [sortOrder, setSortOrder] = useState('desc')

  const withDerived = useMemo(
    () =>
      (models ?? []).map((model) => ({
        ...model,
        derived: derivedTotal(model),
      })),
    [models]
  )

  const sorted = useMemo(() => {
    const multiplier = sortOrder === 'desc' ? -1 : 1
    return [...withDerived].sort((a, b) => {
      if (sortKey === 'name') return (a.name ?? '').localeCompare(b.name ?? '') * multiplier
      const read = (m) => (sortKey === 'downloads' ? m.downloads : sortKey === 'likes' ? m.likes : m.derived) ?? -1
      return (read(a) - read(b)) * multiplier
    })
  }, [withDerived, sortKey, sortOrder])

  const unavailableCount = withDerived.filter((m) => m.downloads == null).length

  const chartData = {
    labels: sorted.map((m) => m.name),
    datasets: [
      {
        label: 'Downloads (last 30 days)',
        data: sorted.map((m) => m.downloads ?? 0),
        backgroundColor: sorted.map((_, i) => COLORS[i % COLORS.length]),
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${formatCompact(context.parsed.y)} downloads`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9CA3AF' } },
      y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9CA3AF' } },
    },
  }

  const groups = ['fully-open', 'open-weight']

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">Downloads &amp; peer comparison</h2>
          <p className="text-gray-400 text-sm">
            30-day downloads per model, grouped by how much of the stack is open — the honest way
            to compare projects releasing different amounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="p-1.5 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition-colors"
            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      <div className="h-72 mb-6">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Model</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Downloads (30d)</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">All-time</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Likes</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Derived works</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const rows = sorted.filter((m) => m.openness === group)
              if (!rows.length) return null
              return (
                <Fragment key={group}>
                  <tr className="bg-gray-700/40">
                    <td colSpan={5} className="py-2 px-4">
                      <span className="font-medium text-gray-200">
                        {OPENNESS_LABELS[group]}
                      </span>
                      <span className="text-gray-400 text-xs ml-2">
                        ({OPENNESS_DESCRIPTIONS[group]})
                      </span>
                    </td>
                  </tr>
                  {rows.map((model) => (
                    <tr
                      key={model.id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <a
                          href={model.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-200 hover:text-blue-400"
                        >
                          {model.name}
                        </a>
                        <span className="text-gray-500 text-xs ml-2">{model.id}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {model.downloads == null ? '—' : model.downloads.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {model.downloadsAllTime == null ? '—' : formatCompact(model.downloadsAllTime)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {model.likes == null ? '—' : formatCompact(model.likes)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300">
                        {model.derived == null ? '—' : model.derived.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {unavailableCount > 0 && (
        <p className="text-gray-500 text-xs mt-3">
          {unavailableCount} of {withDerived.length} models returned no data — shown as “—”. All
          other numbers are live from the Hugging Face API.
        </p>
      )}
    </div>
  )
}
