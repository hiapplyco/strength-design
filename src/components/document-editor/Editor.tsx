import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { DocumentEditorContent } from './EditorContent';
import { FloatingMenu } from '@tiptap/react';

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
}

export function Editor({ content = '', onSave }: EditorProps) {
  const { shareableLink, isPublishing, publishDocument } = useDocumentPublisher();
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate focus:outline-none max-w-none min-h-[200px] prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

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
      <div className="pt-24">
        <DocumentEditorContent 
          editor={editor}
          isPublishing={isPublishing}
          shareableLink={shareableLink}
          onPublish={handlePublish}
          handleShare={handleShare}
        />
        
        {editor && (
          <FloatingMenu 
            editor={editor} 
            className="bg-white border rounded-lg shadow-lg p-2 flex gap-2"
            shouldShow={({ editor }) => {
              // Only show when text is selected
              return editor.view.state.selection.content().size > 0;
            }}
          >
            <EditorToolbar editor={editor} />
          </FloatingMenu>
        )}
      </div>
    </div>
  );
}