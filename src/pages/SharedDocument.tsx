import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SharedDocument() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDocument() {
      try {
        if (!id) {
          setError('Invalid document ID');
          return;
        }

        const { data, error } = await supabase
          .from('documents')
          .select('content, title')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data) {
          setContent(data.content);
        } else {
          setError('Document not found');
          toast({
            title: "Document not found",
            description: "The requested document could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        setError('Failed to load document');
        toast({
          title: "Error",
          description: "Failed to load document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">{error}</h1>
          <p className="text-muted-foreground mb-8">The document you're looking for might have been removed or is temporarily unavailable.</p>
          <Button 
            variant="default"
            onClick={() => window.location.href = '/document-editor'}
          >
            Create New Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <article className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </article>
        
        <div className="mt-16 p-6 bg-black/30 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <Dumbbell className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary">Ready to Build Your Own Evidence-Based Training Program?</h3>
            <p className="text-white/90 max-w-2xl">
              Experience the intersection of exercise science and intelligent programming. Create personalized, science-backed 
              workout plans tailored to your specific goals and training requirements.
            </p>
            <Button 
              className="mt-4 bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = 'https://strength.design'}
            >
              Start Your Training Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}