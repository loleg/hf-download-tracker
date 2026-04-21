import { modelInfo, listModels } from "@huggingface/hub";

// Get the HF token from environment variables
const getHfToken = () => {
  return import.meta.env.VITE_HF_TOKEN || null;
};

// Get the HF API base URL
const getHfApiUrl = () => {
  return import.meta.env.VITE_HF_API_URL || "https://huggingface.co";
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

/**
 * Fetch discussions for a specific repository
 * @param {string} repoId - The repository ID (e.g., "swiss-ai/Apertus-8B-Instruct-2509")
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of discussions to fetch (default: 10)
 * @returns {Promise<Array>} Array of discussion objects
 */
export async function fetchDiscussions(repoId, options = {}) {
  const token = getHfToken();
  const limit = options.limit || 10;
  
  try {
    const url = `${getHfApiUrl()}/api/models/${repoId}/discussions?limit=${limit}&status=open&sort=trending`;
    const response = await fetch(url, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`No discussions found for ${repoId}`);
        return [];
      }
      throw new Error(`Failed to fetch discussions: ${response.status}`);
    }
    
    const discussions = await response.json();
    //console.log(discussions); 
    // Normalize discussion data
    return discussions.discussions.map(discussion => ({
      id: discussion.createdAt,
      title: discussion.title,
      author: discussion.author?.name || discussion.author?.email || "Anonymous",
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      numComments: discussion.numComments || 0,
      isPinned: discussion.isPinned || false,
      isResolved: discussion.isResolved || false,
      isUpvote: discussion.isUpvote || false,
      url: `${getHfApiUrl()}/${repoId}/discussions/${discussion.id}`,
      repoId: repoId,
    }));
  } catch (error) {
    console.error(`Error fetching discussions for ${repoId}:`, error);
    return [];
  }
}

/**
 * Fetch discussions for multiple repositories
 * @param {Array} repos - Array of repo objects with id property
 * @param {Object} options - Optional parameters
 * @param {number} options.limitPerRepo - Maximum discussions per repo (default: 5)
 * @returns {Promise<Object>} Object with repo IDs as keys and discussions as values
 */
export async function fetchDiscussionsForRepos(repos, options = {}) {
  const limitPerRepo = options.limitPerRepo || 5;
  const results = {};
  
  try {
    // Fetch discussions for all repos in parallel
    const promises = repos.map(async (repo) => {
      const discussions = await fetchDiscussions(repo.id, { limit: limitPerRepo });
      return { repoId: repo.id, discussions };
    });
    
    const repoResults = await Promise.all(promises);
    
    // Build results object
    repoResults.forEach(({ repoId, discussions }) => {
      results[repoId] = discussions;
    });
    
    return results;
  } catch (error) {
    console.error(`Error fetching discussions for repos:`, error);
    return {};
  }
}

/**
 * Get discussion statistics for a repository
 * @param {string} repoId - The repository ID
 * @returns {Promise<Object>} Discussion statistics
 */
export async function fetchDiscussionStats(repoId) {
  try {
    const discussions = await fetchDiscussions(repoId, { limit: 100 });
    
    const totalDiscussions = discussions.length;
    const pinnedDiscussions = discussions.filter(d => d.isPinned).length;
    const resolvedDiscussions = discussions.filter(d => d.isResolved).length;
    const totalComments = discussions.reduce((sum, d) => sum + d.numComments, 0);
    
    // Get recent discussions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDiscussions = discussions.filter(d => new Date(d.createdAt) > sevenDaysAgo).length;
    
    return {
      repoId,
      totalDiscussions,
      pinnedDiscussions,
      resolvedDiscussions,
      unresolvedDiscussions: totalDiscussions - resolvedDiscussions,
      totalComments,
      recentDiscussions,
      lastActivity: discussions[0]?.updatedAt || null,
    };
  } catch (error) {
    console.error(`Error fetching discussion stats for ${repoId}:`, error);
    return {
      repoId,
      totalDiscussions: 0,
      pinnedDiscussions: 0,
      resolvedDiscussions: 0,
      unresolvedDiscussions: 0,
      totalComments: 0,
      recentDiscussions: 0,
      lastActivity: null,
    };
  }
}

/**
 * Get aggregated discussion statistics for multiple repositories
 * @param {Array} repos - Array of repo objects with id property
 * @returns {Promise<Object>} Aggregated statistics
 */
export async function fetchAggregateDiscussionStats(repos) {
  try {
    const promises = repos.map(repo => fetchDiscussionStats(repo.id));
    const statsResults = await Promise.all(promises);
    
    const aggregated = statsResults.reduce((acc, stats) => ({
      totalDiscussions: acc.totalDiscussions + stats.totalDiscussions,
      totalComments: acc.totalComments + stats.totalComments,
      totalPinned: acc.totalPinned + stats.pinnedDiscussions,
      totalResolved: acc.totalResolved + stats.resolvedDiscussions,
      totalRecent: acc.totalRecent + stats.recentDiscussions,
      repos: [...acc.repos, stats],
    }), {
      totalDiscussions: 0,
      totalComments: 0,
      totalPinned: 0,
      totalResolved: 0,
      totalRecent: 0,
      repos: [],
    });
    
    return aggregated;
  } catch (error) {
    console.error(`Error fetching aggregate discussion stats:`, error);
    return {
      totalDiscussions: 0,
      totalComments: 0,
      totalPinned: 0,
      totalResolved: 0,
      totalRecent: 0,
      repos: [],
    };
  }
}
