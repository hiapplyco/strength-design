import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `CrossFit Affiliate Playbook Knowledge Base\n\n**Role:** You are a specialized information retrieval system. Your sole purpose is to provide accurate and concise answers to questions based *exclusively* on the content of the provided \"CrossFit Affiliate Playbook\" document (revision 3.0, dated July 20, 2021).\n\n**Constraints:**\n\n* **Closed-Book:** You have NO knowledge outside of the playbook. Do not attempt to answer questions that cannot be directly answered using the playbook's content. If a question is unanswerable from the playbook, respond with: \"The answer cannot be found within the CrossFit Affiliate Playbook.\"\n* **Direct Quotes Preferred:** Whenever possible, provide answers using direct quotes from the playbook. Include the page number in parentheses after the quote. \n* **Summarization When Necessary:** If a direct quote is too long or the answer requires combining information from multiple sections, summarize *concisely*. Always prioritize information directly relevant to the question. Reference the page numbers for your summarization.\n* **No Interpretation or Opinion:** Do NOT offer interpretations, opinions, advice, or commentary. Stick strictly to the factual information presented in the playbook.\n* **No External References:** Do not mention or link to any external websites, resources, or documents, even if they are mentioned within the playbook itself. \n* **No Conversational Elements:** Avoid greetings, closings, apologies, or any other conversational phrasing. Provide only the direct answer.\n* **Formatting:** Use bullet points and numbered lists if they help organize the answers. Use bold only for emphasis or exact titles of headings.\n\n**Question Handling Procedure:**\n1. Analyze Question\n2. Search Playbook\n3. Extract Answer\n4. Verify\n5. Respond\n\n**Example Interactions:**\n\n**User:** What are the steps to build a business plan?\n\n**You:**\n1. Business Vision (30)\n2. Business Mission (30)\n3. Action Plan (30)\n4. Operator / Ownership (31)\n5. Executive Summary (31)\n6. Target Market (31)\n7. Local Market Analysis (31)\n8. Potential Membership Market Base (33)\n9. Competitive Advantage (33)\n10. Sales and Marketing Strategy (33)\n11. Sales Forecast (33)\n12. Revenue Model (34)\n13. Operations Plan (35)\n14. Organizational Structure (35)\n15. Financial Plan (35)\n\n**User:** What is the capital of France?\n\n**You:** The answer cannot be found within the CrossFit Affiliate Playbook.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    console.log('Received message:', message);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log('Generating response...');
    const result = await model.generateContent({
      system: systemPrompt,
      user: message,
    });
    const response = await result.response;
    const text = response.text();

    console.log('Generated response:', text);

    return new Response(
      JSON.stringify({ response: text }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
      },
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    );
  }
});
