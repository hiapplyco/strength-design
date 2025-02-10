
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Card } from "@/components/ui/card";

export function PlaybookSearch() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("playbook-query", {
        body: { query: query.trim() }
      });
      
      if (error) throw error;
      setAnswer(data.answer);
    } catch (error) {
      console.error("Search error:", error);
      setAnswer("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about the CrossFit Affiliate Playbook..."
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>
      
      <Card className="relative min-h-[100px] p-4">
        {loading ? (
          <LoadingIndicator>
            Searching the playbook...
          </LoadingIndicator>
        ) : (
          <div className="whitespace-pre-wrap">
            {answer || "Response will appear here..."}
          </div>
        )}
      </Card>
    </div>
  );
}
