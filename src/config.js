// Central configuration for the Apertus community dashboard.
//
// Everything here refers to public Hugging Face / GitHub entities, so the
// dashboard runs with zero configuration. Optional API tokens (see
// .env.example) only exist to lift rate limits — they never gate the data.

export const GITHUB_ORG = 'swiss-ai'
export const HF_ORG = 'swiss-ai'

// The model whose community (discussions, derived works) we track most closely.
export const APERTUS_MODEL = 'swiss-ai/Apertus-8B-Instruct-2509'

// GitHub repositories under the org that we surface in the Contributions panel.
export const TRACKED_REPOS = [
  'pretrain-data',
  'apertus-finetuning-recipes',
  'evals-post-train',
  'apertus-tech-report',
]

// Peer models for the downloads comparison, grouped the way OLMo frames it:
// "fully open" (weights, training data and code) vs "open-weight" (weights
// only). This distinction is the honest way to compare projects that release
// different amounts of their stack.
// TODO: confirm SEA-LION classification with the community.
export const MODELS = [
  { id: 'swiss-ai/Apertus-70B-Instruct-2509', name: 'Apertus 70B', openness: 'fully-open' },
  { id: 'swiss-ai/Apertus-8B-Instruct-2509', name: 'Apertus 8B', openness: 'fully-open' },
  { id: 'utter-project/EuroLLM-22B-Instruct-2512', name: 'EuroLLM 22B', openness: 'fully-open' },
  { id: 'allenai/Olmo-3.1-32B-Instruct-SFT', name: 'Olmo 3.1 32B', openness: 'fully-open' },
  { id: 'aisingapore/Apertus-SEA-LION-v4-8B-IT', name: 'SEA-LION 8B', openness: 'open-weight' },
]

export const OPENNESS_LABELS = {
  'fully-open': 'Fully open',
  'open-weight': 'Open-weight',
}

export const OPENNESS_DESCRIPTIONS = {
  'fully-open': 'weights, training data and code',
  'open-weight': 'weights only',
}
