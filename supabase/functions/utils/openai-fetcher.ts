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

        let content: string;
        try {
          const response = await fetch(rawUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          content = await response.text();
        } catch (error) {
          console.warn(`Failed to fetch ${file.name}:`, error);
          continue;  // Skip this file, continue with others
        }

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

interface PromptSection {
  title: string;
  description: string;
  content: string;
}

function extractPromptSections(markdown: string, filename: string): PromptSection[] {
  const sections: PromptSection[] = [];

  // Extract code blocks
  const codeBlockRegex = /```(?:python|typescript|javascript|plaintext)?\n([\s\S]*?)```/g;
  const headingRegex = /^#+\s+(.+)$/gm;

  let codeMatch;

  while ((codeMatch = codeBlockRegex.exec(markdown)) !== null) {
    // Find all headings that appear before this code block
    const headingsBeforeBlock = [...markdown.matchAll(headingRegex)]
      .filter(h => h.index! < codeMatch.index);

    // Use the most recent heading (closest to this block)
    const closestHeading = headingsBeforeBlock.length > 0
      ? headingsBeforeBlock[headingsBeforeBlock.length - 1][1]
      : filename;

    sections.push({
      title: closestHeading,
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
