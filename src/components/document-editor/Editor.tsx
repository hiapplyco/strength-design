import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { EditorContent } from './EditorContent';

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
    await publishDocument(editor.getHTML(), onSave);
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
        <EditorContent 
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