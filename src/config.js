// Central configuration for the Apertus community dashboard.
//
// Everything here refers to public Hugging Face / GitHub entities, so the
// dashboard runs with zero configuration. Optional API tokens (see
// .env.example) only exist to lift rate limits — they never gate the data.

export const GITHUB_ORG = 'swiss-ai'
export const HF_ORG = 'swiss-ai'

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
export const MODELS = [
  { id: 'swiss-ai/Apertus-v1.5-70B', name: 'Apertus 1.5 70B', openness: 'swiss-ai' },
  { id: 'swiss-ai/Apertus-v1.5-8B', name: 'Apertus 1.5 8B', openness: 'swiss-ai' },
  { id: 'swiss-ai/Apertus-v1.1-4B', name: 'Apertus 1.1 4B', openness: 'swiss-ai' },
  { id: 'swiss-ai/Apertus-70B-Instruct-2509', name: 'Apertus 70B', openness: 'swiss-ai' },
  { id: 'swiss-ai/Apertus-8B-Instruct-2509', name: 'Apertus 8B', openness: 'swiss-ai' },
  { id: 'utter-project/EuroLLM-22B-Instruct-2512', name: 'EuroLLM 22B', openness: 'fully-open' },
  { id: 'utter-project/EuroMoE-2.6B-A0.6B-Instruct-2512', name: 'EuroMoE 2.6B', openness: 'fully-open' },
  { id: 'utter-project/EuroLLM1.5-9B-SFT', name: 'EuroLLM 1.5 9B', openness: 'fully-open' },
  { id: 'allenai/Olmo-3.1-32B-Instruct', name: 'Olmo 3.1 32B', openness: 'fully-open' },
  { id: 'allenai/Olmo-3-7B-Instruct', name: 'Olmo 3 7B', openness: 'fully-open' },
  { id: 'aisingapore/Apertus-SEA-LION-v4-8B-IT-GGUF', name: 'Apertus-SEA-LION v4 8B', openness: 'fully-open' },
]

// The model whose community (discussions, derived works) we track most closely.
export const APERTUS_MODEL = MODELS[0]

export const OPENNESS_LABELS = {
  'swiss-ai': 'Swiss AI Initiative',
  'fully-open': 'Fully Open',
}

export const OPENNESS_DESCRIPTIONS = {
  'swiss-ai': '',
  'fully-open': '(Weights, training data and code)',
}
