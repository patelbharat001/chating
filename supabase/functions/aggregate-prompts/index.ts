import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchGitHubPrompts } from '../utils/github-fetcher.ts';
import { fetchOpenAIPrompts } from '../utils/openai-fetcher.ts';
import { cleanPromptText, validatePrompt } from '../utils/prompt-parser.ts';
import type { Prompt } from '../utils/github-fetcher.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export async function aggregatePrompts() {
  let totalAggregated = 0;
  const errors: string[] = [];

  try {
    // Fetch all categories with enabled sources
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');

    if (catError) throw catError;

    for (const category of categories || []) {
      try {
        // GitHub aggregation
        if (category.sources?.github?.enabled) {
          const githubPrompts = await fetchGitHubPrompts(
            category.sources.github.keywords || [],
            category.sources.github.min_stars || 10,
            category.sources.github.max_results || 50
          );

          for (const prompt of githubPrompts) {
            await upsertPrompt(prompt, category.id);
            totalAggregated++;
          }
          console.log(`GitHub: ${githubPrompts.length} prompts for ${category.name}`);
        }

        // OpenAI aggregation
        if (category.sources?.openai?.enabled) {
          const openaiPrompts = await fetchOpenAIPrompts(
            category.sources.openai.path || 'examples'
          );

          for (const prompt of openaiPrompts) {
            await upsertPrompt(prompt, category.id);
            totalAggregated++;
          }
          console.log(`OpenAI: ${openaiPrompts.length} prompts for ${category.name}`);
        }
      } catch (catError) {
        const errorMsg = `Error aggregating ${category.name}: ${catError.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update category prompt counts
    for (const category of categories || []) {
      const { count } = await supabase
        .from('prompts')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id);

      await supabase
        .from('categories')
        .update({ prompt_count: count || 0 })
        .eq('id', category.id);
    }

    return {
      status: 'completed',
      total_aggregated: totalAggregated,
      errors: errors.length > 0 ? errors : null
    };
  } catch (error) {
    console.error('Aggregation error:', error);
    return {
      status: 'error',
      total_aggregated: totalAggregated,
      errors: [error.message]
    };
  }
}

async function upsertPrompt(prompt: Prompt, categoryId: string) {
  if (!validatePrompt(prompt)) {
    console.warn('Invalid prompt, skipping:', prompt.title);
    return;
  }

  const cleanedContent = cleanPromptText(prompt.content);

  const { error } = await supabase
    .from('prompts')
    .upsert(
      {
        title: prompt.title.slice(0, 200),
        description: (prompt.description || '').slice(0, 500),
        content: cleanedContent,
        source: prompt.source,
        source_url: prompt.source_url,
        category_id: categoryId,
        author: (prompt.author || 'Unknown').slice(0, 100),
        updated_at: new Date().toISOString()
      }
    );

  if (error) {
    console.error('Upsert error:', error);
  }
}

// Serve function for manual trigger or GET request
Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const result = await aggregatePrompts();
  const statusCode = result.status === 'error' ? 500 : 200;
  return new Response(JSON.stringify(result), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
});
