import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Facebook, Twitter, Linkedin, Link2 } from "lucide-react";

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

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!shareableLink) return;

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}&text=${encodeURIComponent('Check out my document!')}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableLink)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        textArea.remove();
        return false;
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
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
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Failed to create document');
      }

      if (onSave) {
        onSave(editor.getHTML());
      }

      // Generate shareable link using the Supabase project URL
      const projectId = 'ulnsvkrrdcmfiguibkpx';
      const link = `https://${projectId}.lovableproject.com/document/${data.id}`;
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
        <div className="container mx-auto p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}
            >
              Bold
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}
            >
              Italic
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading') ? 'bg-accent text-accent-foreground' : ''}
            >
              H2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''}
            >
              List
            </Button>
          </div>
        </div>
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
            
            {shareableLink && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Link2 className="h-4 w-4" />
                  <span className="text-sm flex-1 break-all">{shareableLink}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare('facebook')}
                    title="Share on Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare('twitter')}
                    title="Share on Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleShare('linkedin')}
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
