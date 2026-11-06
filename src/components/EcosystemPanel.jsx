import { formatCompact, timeAgo } from '../utils'

const DERIVED_KINDS = [
  { key: 'finetune', label: 'Finetunes', description: 'models trained on top of this one' },
  { key: 'adapter', label: 'Adapters', description: 'lightweight LoRA/PEFT checkpoints' },
  {
    key: 'quantized',
    label: 'Quantizations',
    description: 'compressed variants for cheaper inference',
  },
  {
    key: 'merge',
    label: 'Merges',
    description: 'combinations with other models',
  },
]

export function EcosystemPanel({ model, datasets, modelName }) {
  const unavailable = !model?.childrenModelCount
  const derivedTotal = model
    ? Object.values(model.childrenModelCount ?? {}).reduce((sum, n) => sum + n, 0)
    : null

  const spaces = model?.spaces ?? []
  const topDatasets = (datasets ?? []).slice(0, 8)

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-1">
        Ecosystem{modelName ? ` — ${modelName}` : ''}
      </h2>
      <p className="text-gray-400 text-sm mb-4">
        What the community has built on top of {modelName ?? 'this model'} — derived models, Spaces and
        datasets. This is the part no download counter can fake.
      </p>

      {unavailable && (
        <p className="text-gray-500 text-sm py-4">
          Ecosystem data unavailable right now — the Hugging Face API request failed. Try
          refreshing.
        </p>
      )}

      {model && !unavailable && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {DERIVED_KINDS.map(({ key, label, description }) => (
              <div
                key={key}
                className="bg-gray-700/50 rounded-lg p-3 border border-gray-600"
              >
                <div className="text-2xl font-bold text-white">
                  {formatCompact(model.childrenModelCount[key])}
                </div>
                <div className="text-gray-200 text-sm font-medium">{label}</div>
                <div className="text-gray-400 text-xs mt-1">{description}</div>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Derived works in total: {derivedTotal?.toLocaleString()} — every one is someone
              building on {modelName ?? 'this model'}.
            </h3>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Spaces using the model
            {spaces.length > 0 && (
              <span className="text-gray-500 text-xs ml-2">{spaces.length} total</span>
            )}
          </h3>
          {spaces.length === 0 && (
            <p className="text-gray-500 text-sm">
              No Spaces build on this model yet — publishing one is a great first contribution.
            </p>
          )}
          <ul className="space-y-2">
            {spaces.slice(0, 6).map((spaceId) => (
              <li key={spaceId} className="text-sm">
                <a
                  href={`https://huggingface.co/spaces/${spaceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-blue-400"
                >
                  {spaceId}
                </a>
              </li>
            ))}
          </ul>
          {spaces.length > 6 && (
            <p className="text-gray-500 text-xs mt-2">
              Showing 6 of {spaces.length} Spaces.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-2">
            Datasets published by the org
            {datasets && (
              <span className="text-gray-500 text-xs ml-2">{datasets.length} total</span>
            )}
          </h3>
          {!datasets && (
            <p className="text-gray-500 text-sm">
              Dataset data unavailable right now — the Hugging Face API request failed.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Dataset</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Downloads</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Likes</th>
                </tr>
              </thead>
              <tbody>
                {topDatasets.map((dataset) => (
                  <tr
                    key={dataset.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-2 px-3">
                      <a
                        href={dataset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-200 hover:text-blue-400"
                        title={dataset.id}
                      >
                        {dataset.id.split('/').pop()}
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {formatCompact(dataset.downloads)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">
                      {formatCompact(dataset.likes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {datasets && datasets.length > 8 && (
            <p className="text-gray-500 text-xs mt-2">
              Showing 8 of {datasets.length} datasets.
            </p>
          )}
          {model?.lastModified && (
            <p className="text-gray-500 text-xs mt-2">
              Model last updated {timeAgo(model.lastModified)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
