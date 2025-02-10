
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { query } = await req.json();
  
  // Clean the query for SQL
  const cleanQuery = query.replace(/[^a-zA-Z0-9 ]/g, ' ');
  const searchTerms = cleanQuery.trim().split(/\s+/).join(' & ');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Full-text search using PostgreSQL tsvector
  const { data, error } = await supabase
    .from('playbook')
    .select('page_number, content')
    .textSearch('fts', `${searchTerms}`, {
      type: 'websearch',
      config: 'english'
    })
    .limit(5)
    .order('page_number', { ascending: true });

  if (error || !data?.length) {
    return new Response(JSON.stringify({
      answer: "The answer cannot be found within the CrossFit Affiliate Playbook."
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  // Format response according to system prompt rules
  const response = formatResponse(data, query);
  
  return new Response(JSON.stringify(response), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
});

// Response formatting logic
function formatResponse(results: any[], originalQuery: string): { answer: string } {
  const directQuotes = results.filter(r => 
    r.content.toLowerCase().includes(originalQuery.toLowerCase()) &&
    r.content.length <= 300
  );

  if (directQuotes.length > 0) {
    return {
      answer: directQuotes.map(q => 
        `"${q.content.trim()}" (${q.page_number})`
      ).join('\n\n')
    };
  }

  // Summarization fallback
  const pageNumbers = [...new Set(results.map(r => r.page_number))];
  const summary = results
    .map(r => r.content)
    .join(' ')
    .substring(0, 500)
    .replace(/\s\S*$/, ''); // Clean truncation

  return {
    answer: `${summary} (${pageNumbers.join(', ')})`
  };
}
