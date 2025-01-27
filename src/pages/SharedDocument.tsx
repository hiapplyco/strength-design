import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SharedDocument() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDocument() {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('content')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setContent(data.content);
        } else {
          toast({
            title: "Document not found",
            description: "The requested document could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          title: "Error",
          description: "Failed to load document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchDocument();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto prose prose-invert">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}