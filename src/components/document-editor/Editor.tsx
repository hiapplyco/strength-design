import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { DocumentEditorContent } from './EditorContent';

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
}

export function Editor({ content = '', onSave }: EditorProps) {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  const { shareableLink, isPublishing, publishDocument } = useDocumentPublisher();
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate focus:outline-none max-w-none min-h-[200px]',
      },
    },
    onFocus: () => {
      setVisible(true);
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
      const isScrollingUp = prevScrollPos > currentScrollPos;
      const isNearTop = currentScrollPos < 10;
      const isEditorFocused = editor?.isFocused;
      
      setVisible(isScrollingUp || isNearTop || isEditorFocused);
      setPrevScrollPos(currentScrollPos);
    };

    const scrollContainer = document.documentElement;
    scrollContainer.style.scrollBehavior = 'smooth';
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      scrollContainer.style.scrollBehavior = '';
    };
  }, [prevScrollPos, editor]);

  const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!shareableLink) return;
    const url = generateShareUrl(platform, shareableLink);
    try {
      await window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Error opening share window:', error);
    }
  };

  const handlePublish = async () => {
    if (!editor) return;
    await publishDocument(editor.getHTML(), onSave);
  };

  if (!editor) return null;

  return (
    <div className="relative min-h-screen">
      <div 
        className={`fixed top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          WebkitTransform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,-100%,0)',
          transform: visible ? 'translateY(0)' : 'translateY(-100%)'
        }}
      >
        <div className="container mx-auto">
          <EditorToolbar editor={editor} />
        </div>
      </div>

      <div className="pt-24">
        <DocumentEditorContent 
          editor={editor}
          isPublishing={isPublishing}
          shareableLink={shareableLink}
          onPublish={handlePublish}
          handleShare={handleShare}
        />
      </div>
    </div>
  );
}