import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function SharedDocument() {
  const [document, setDocument] = useState<{ content: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('content, title')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setDocument(data);
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the document. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The document you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <a href="https://strength.design" className="inline-block">
              Create Your Own Workout Plan
            </a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top CTA */}
      <div className="w-full bg-primary/10 py-4">
        <div className="container mx-auto px-4">
          <Button asChild className="w-full sm:w-auto" variant="default">
            <a href="https://strength.design">
              Create Your Own AI-Powered Workout Plan
            </a>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto p-6 bg-background">
          {document.title && (
            <h1 className="text-3xl font-bold mb-6">{document.title}</h1>
          )}
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
          
          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <a href="https://strength.design">
                Start Building Your Custom Workout Program
              </a>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}