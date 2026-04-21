// GitHub API service for fetching repository statistics

const GITHUB_API_BASE = 'https://api.github.com';

// Fetch top repositories by stars for a user/org
export async function fetchUserRepositories(username, options = {}) {
  const { limit = 8, sort = 'updated' } = options;
  
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${username}/repos?sort=${sort}&per_page=${limit}&type=public`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const repos = await response.json();
    
    return repos.map(repo => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      url: repo.html_url,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));
  } catch (error) {
    console.error(`Error fetching GitHub repos for ${username}:`, error);
    return null;
  }
}
