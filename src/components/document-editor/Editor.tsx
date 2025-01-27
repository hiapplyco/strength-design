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
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback for older browsers or non-HTTPS
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
        textArea.remove();
        return false;
      }
    } catch (err) {
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

      if (error) throw error;
      
      if (!data) {
        throw new Error('Failed to create document');
      }

      if (onSave) {
        onSave(editor.getHTML());
      }

      const link = `${window.location.origin}/document/${data.id}`;
      setShareableLink(link);
      
      toast({
        title: "Success",
        description: "Your document has been published.",
      });

      // Try to copy the link to clipboard
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
    <Card className="w-full p-4 bg-background border-primary">
      <div className="flex gap-2 mb-4 border-b border-primary pb-4">
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
  );
}