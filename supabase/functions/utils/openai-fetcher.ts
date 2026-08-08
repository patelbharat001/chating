import type { Prompt } from './github-fetcher.ts';

export async function fetchOpenAIPrompts(path: string = 'examples'): Promise<Prompt[]> {
  const prompts: Prompt[] = [];
  const baseUrl = 'https://raw.githubusercontent.com/openai/openai-cookbook/main';

  try {
    // Fetch directory listing from GitHub API
    const apiUrl = `https://api.github.com/repos/openai/openai-cookbook/contents/${path}`;
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    });

    if (!response.ok) throw new Error(`OpenAI repo fetch error: ${response.statusText}`);

    const files = await response.json();

    // Get markdown files
    for (const file of files) {
      if (file.name.endsWith('.md') && file.type === 'file') {
        const rawUrl = `${baseUrl}/${path}/${file.name}`;
        const content = await fetch(rawUrl).then(r => r.text());

        // Extract prompt sections from markdown
        const sections = extractPromptSections(content, file.name);
        sections.forEach(section => {
          prompts.push({
            title: section.title,
            description: section.description || `Example from OpenAI Cookbook`,
            content: section.content,
            source: 'openai',
            source_url: `https://github.com/openai/openai-cookbook/blob/main/${path}/${file.name}`,
            author: 'OpenAI'
          });
        });
      }
    }

    return prompts;
  } catch (error) {
    console.error('OpenAI Cookbook fetch error:', error);
    return [];
  }
}

function extractPromptSections(markdown: string, filename: string): any[] {
  const sections = [];

  // Extract code blocks
  const codeBlockRegex = /```(?:python|typescript|javascript|plaintext)?\n([\s\S]*?)```/g;
  const headingRegex = /^#+\s+(.+)$/gm;

  let codeMatch;
  let headingMatches = [...markdown.matchAll(headingRegex)];

  while ((codeMatch = codeBlockRegex.exec(markdown)) !== null) {
    const heading = headingMatches.length > 0 ? headingMatches[0][1] : filename;

    sections.push({
      title: heading,
      description: `Example from ${filename}`,
      content: codeMatch[1].trim()
    });
  }

  // If no code blocks found, use the whole markdown as one section
  if (sections.length === 0 && markdown.length > 100) {
    sections.push({
      title: filename.replace('.md', ''),
      description: 'Example from OpenAI Cookbook',
      content: markdown.slice(0, 3000)
    });
  }

  return sections;
}
