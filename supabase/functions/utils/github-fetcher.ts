interface GitHubRepo {
  name: string;
  html_url: string;
  owner: { login: string };
  description: string;
}

export interface Prompt {
  title: string;
  description: string;
  content: string;
  source: string;
  source_url: string;
  author: string;
}

export async function fetchGitHubPrompts(
  keywords: string[],
  minStars: number,
  maxResults: number
): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  const headers = {
    'Accept': 'application/vnd.github.v3+json'
  };

  try {
    for (const keyword of keywords) {
      const query = `${keyword} language:markdown stars:>=${minStars}`;
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=50`;

      console.log(`GitHub search: "${keyword}" minStars=${minStars}`);

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`);

      const data = await response.json();
      console.log(`GitHub response: ${data.total_count} results for "${keyword}"`);

      // Fetch top repositories
      if (data.items) {
        for (const repo of data.items.slice(0, maxResults)) {
          const repoPrompts = await fetchPromptFilesFromRepo(repo, keyword);
          prompts.push(...repoPrompts);
        }
      }
    }

    return prompts.slice(0, maxResults);
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return [];
  }
}

async function fetchPromptFilesFromRepo(
  repo: GitHubRepo,
  keyword: string
): Promise<Prompt[]> {
  const prompts: Prompt[] = [];

  try {
    // Fetch README
    const readmeUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/README.md`;
    const readmeResponse = await fetch(readmeUrl);
    if (readmeResponse.ok) {
      const readmeText = await readmeResponse.text();
      const promptsFromReadme = parseMarkdownForPrompts(readmeText, repo);
      prompts.push(...promptsFromReadme);
    }

    // Fetch prompt files (*.md, *.txt in root and examples/)
    const filesUrl = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/contents/`;
    const filesResponse = await fetch(filesUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (filesResponse.ok) {
      const files = await filesResponse.json();
      for (const file of files) {
        if ((file.name.endsWith('.md') || file.name.endsWith('.txt')) &&
            (file.name.includes('prompt') || file.name.includes('example'))) {
          const rawUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/main/${file.name}`;
          const content = await fetch(rawUrl).then(r => r.text());

          prompts.push({
            title: file.name.replace(/\.(md|txt)$/, ''),
            description: repo.description || `Prompt from ${repo.name}`,
            content: content.slice(0, 2000), // Limit to 2000 chars
            source: 'github',
            source_url: `${repo.html_url}/blob/main/${file.name}`,
            author: repo.owner.login
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching from repo ${repo.name}:`, error);
  }

  return prompts;
}

function parseMarkdownForPrompts(markdown: string, repo: GitHubRepo): Prompt[] {
  const prompts: Prompt[] = [];

  // Simple extraction: look for code blocks marked as "prompt" or "example"
  const blockRegex = /```(?:prompt|example)\n([\s\S]*?)```/g;
  let match;

  while ((match = blockRegex.exec(markdown)) !== null) {
    prompts.push({
      title: `Prompt from ${repo.name}`,
      description: `Example prompt from ${repo.owner.login}/${repo.name}`,
      content: match[1].trim(),
      source: 'github',
      source_url: repo.html_url,
      author: repo.owner.login
    });
  }

  return prompts;
}
