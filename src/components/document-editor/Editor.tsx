import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { EditorToolbar } from './EditorToolbar';
import { ShareSection } from './ShareSection';
import { copyToClipboard, createShareableUrl } from './editorUtils';

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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

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
      
      toast({
        title: "Success",
        description: "Your document has been published.",
      });

      const copied = await copyToClipboard(link);
      
      if (copied) {
        toast({
          title: "Link Copied",
          description: "Share link has been copied to your clipboard",
        });
      }
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
              >
                {isPublishing ? 'Publishing...' : 'Publish Document'}
              </Button>
            </div>
            
            <ShareSection 
              shareableLink={shareableLink} 
              handleShare={handleShare}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};