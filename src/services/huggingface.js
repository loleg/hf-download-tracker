import { modelInfo, listModels } from "@huggingface/hub";

// Get the HF token from environment variables
const getHfToken = () => {
  return import.meta.env.VITE_HF_TOKEN || null;
};

// Check if token is configured
export const isTokenConfigured = () => {
  const token = getHfToken();
  return !!token && token.length > 0;
};

// Fetch model information from Hugging Face
export async function fetchModelInfo(modelId) {
  try {
    const info = await modelInfo({
      name: modelId,
      hubUrl: "https://huggingface.co",
    }, {
      accessToken: getHfToken() ?? undefined
    });
    
    return info;
  } catch (error) {
    console.error(`Error fetching model info for ${modelId}:`, error);
    return null;
  }
}

// Fetch download statistics for a model
export async function fetchModelDownloads(modelId) {
  try {
    const info = await modelInfo({
      name: modelId,
      hubUrl: "https://huggingface.co",
    }, {
      accessToken: getHfToken() ?? undefined
    });
    
    return {
      downloads: info.downloads || 0,
      lastUpdated: info.lastModified || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching downloads for ${modelId}:`, error);
    return null;
  }
}

// Fetch list of models with filters
export async function searchModels(query, options) {
  try {
    const models = await listModels({
      search: query,
      limit: options?.limit || 10,
      sort: options?.sort || "downloads",
      direction: -1,
      hubUrl: "https://huggingface.co",
    }, {
      accessToken: getHfToken() ?? undefined
    });
    
    return [...models];
  } catch (error) {
    console.error(`Error searching models:`, error);
    return [];
  }
}

// Get all variants of a model
export async function fetchModelVariants(modelId) {
  try {
    const info = await modelInfo({
      name: modelId,
      hubUrl: "https://huggingface.co",
    }, {
      accessToken: getHfToken() ?? undefined
    });
    
    // Get siblings from model info (files in the repo)
    if (info.siblings && Array.isArray(info.siblings)) {
      // Filter for safetensors or bin files which typically indicate model weights
      const variants = info.siblings
        .filter(f => f.rfilename.endsWith(".safetensors") || f.rfilename.endsWith(".bin"))
        .map(f => f.rfilename.replace(".safetensors", "").replace(".bin", ""))
        .slice(0, 5); // Top 5
      
      return [...new Set(variants)];
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching variants for ${modelId}:`, error);
    return [];
  }
}
