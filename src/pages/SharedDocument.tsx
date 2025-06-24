
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { LoadingState } from "@/components/ui/loading-states/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileX, Home } from "lucide-react";
import { typography } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
      <StandardPageLayout maxWidth="4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState 
            variant="spinner" 
            message="Loading document..." 
            size="lg"
          />
        </div>
      </StandardPageLayout>
    );
  }

  if (!document) {
    return (
      <StandardPageLayout 
        title="Document Not Found"
        maxWidth="4xl"
      >
        <Card variant="ghost" className="mt-8">
          <EmptyState
            icon={FileX}
            title="Document Not Found"
            description="The document you're looking for doesn't exist or has been removed."
            size="lg"
            action={
              <Button asChild>
                <a href="/" className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Homepage
                </a>
              </Button>
            }
          />
        </Card>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout
      title={document.title || "Shared Document"}
      maxWidth="4xl"
      showBack
    >
      <Card variant="elevated" className="p-8">
        <div 
          className={cn(
            "prose prose-invert max-w-none",
            typography.body.default
          )}
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </Card>
    </StandardPageLayout>
  );
}
