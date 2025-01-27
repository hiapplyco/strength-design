import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { EditorToolbar } from './EditorToolbar';
import { ShareSection } from './ShareSection';
import { copyToClipboard, createShareableUrl, generateShareUrl } from './editorUtils';

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
}

export function Editor({ content = '', onSave }: EditorProps) {
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert min-h-[200px] focus:outline-none max-w-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    // Safari smooth scrolling fix
    const scrollContainer = document.documentElement;
    scrollContainer.style.scrollBehavior = 'auto';
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollContainer.style.scrollBehavior = '';
    };
  }, [prevScrollPos]);

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!shareableLink) return;
    const url = generateShareUrl(platform, shareableLink);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handlePublish = async () => {
    if (!editor) return;
    
    try {
      setIsPublishing(true);
      
      if (!editor.getHTML().trim()) {
        toast({
          title: "Error",
          description: "Document content cannot be empty",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          content: editor.getHTML(),
          title: 'Workout Document'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (onSave) {
        onSave(editor.getHTML());
      }

      const link = createShareableUrl(data.id);
      setShareableLink(link);

      const copied = await copyToClipboard(link);
      
      toast({
        title: "Success",
        description: copied 
          ? "Your document has been published and the share link has been copied to your clipboard."
          : "Your document has been published. Please manually copy the share link below.",
      });

    } catch (error) {
      console.error('Error publishing document:', error);
      toast({
        title: "Error",
        description: "Failed to publish document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="relative">
      <div 
        className={`fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          WebkitTransform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,-100%,0)',
          transform: visible ? 'translateY(0)' : 'translateY(-100%)'
        }}
      >
        <EditorToolbar editor={editor} />
      </div>

      <div className="pt-24">
        <Card className="w-full p-4 bg-background border-primary">
          <EditorContent 
            editor={editor} 
            className="min-h-[200px] prose-h2:text-xl prose-h2:font-bold prose-p:mb-4 prose-hr:my-8 prose-hr:border-primary prose-h3:text-lg prose-h3:font-semibold" 
          />
          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-primary">
            <div className="flex justify-end">
              <Button 
                onClick={handlePublish}
                disabled={isPublishing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isPublishing ? 'Publishing...' : 'Publish Document'}
              </Button>
            </div>
            
            {shareableLink && (
              <>
                <p className="text-sm text-muted-foreground mt-2">
                  Your document has been published! Share it with others using the link below.
                </p>
                <ShareSection 
                  shareableLink={shareableLink} 
                  handleShare={handleShare}
                />
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}