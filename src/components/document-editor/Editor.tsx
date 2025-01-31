import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { DocumentEditorContent } from './EditorContent';
import { supabase } from '@/integrations/supabase/client';

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
        class: 'prose prose-slate focus:outline-none max-w-none min-h-[200px]',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  const formatWorkoutContent = async (workouts: any) => {
    try {
      console.log('Formatting workout content:', workouts);
      const { data, error } = await supabase.functions.invoke('generate-tiptap-document', {
        body: { workouts }
      });

      if (error) {
        console.error('Error formatting workout:', error);
        throw error;
      }

      console.log('Received formatted content:', data);
      return data;
    } catch (error) {
      console.error('Error in formatWorkoutContent:', error);
      throw error;
    }
  };

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
    
    try {
      // Parse the content as JSON to check if it's workout data
      const workoutData = JSON.parse(content);
      console.log('Publishing workout data:', workoutData);
      
      // Format the workout content using Gemini
      const formattedContent = await formatWorkoutContent(workoutData);
      console.log('Setting formatted content:', formattedContent);
      
      // Update the editor with the formatted content
      editor.commands.setContent(formattedContent);
      
      // Publish the formatted document
      await publishDocument(editor.getHTML(), onSave);
    } catch (error) {
      console.error('Error in handlePublish:', error);
      // If parsing fails, assume it's regular content
      console.log('Content is not workout data, publishing as is');
      await publishDocument(editor.getHTML(), onSave);
    }
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
      </div>
    </div>
  );
}