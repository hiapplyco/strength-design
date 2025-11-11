
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback } from 'react';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { DocumentEditorContent } from './EditorContent';
import { supabase } from '@/integrations/supabase/client';
import { isWorkoutDay, isWorkoutCycle, WeeklyWorkouts, WorkoutDay, WorkoutCycle } from '@/types/fitness';

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

  const handleShare = useCallback(async (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!shareableLink) return;
    const url = generateShareUrl(platform, shareableLink);
    try {
      await window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Error opening share window:', error);
    }
  }, [shareableLink]);

  const formatWorkoutData = useCallback((workoutData: WeeklyWorkouts) => {
    let formattedContent = '<h1>Weekly Workout Plan</h1>\n\n';
    
    // Process all entries in the workout data
    Object.entries(workoutData)
      .filter(([key]) => key !== '_meta')
      .forEach(([key, value]) => {
        if (isWorkoutCycle(value)) {
          // Handle cycle structure
          const cycleTitle = key.charAt(0).toUpperCase() + key.slice(1);
          formattedContent += `<h2>${cycleTitle}</h2>\n\n`;
          
          // Process all days within this cycle
          Object.entries(value as WorkoutCycle)
            .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
            .forEach(([dayKey, dayValue]) => {
              const workoutDay = dayValue as WorkoutDay;
              const formattedDay = dayKey.replace(/day(\d+)/, 'Day $1');
              
              formattedContent += `<h3>${formattedDay}</h3>\n`;
              
              if (workoutDay.description) {
                formattedContent += `<p><strong>Focus:</strong> ${workoutDay.description}</p>\n`;
              }
              
              if (workoutDay.strength) {
                formattedContent += `<h4>Strength</h4>\n<p>${workoutDay.strength}</p>\n`;
              }
              
              if (workoutDay.warmup) {
                formattedContent += `<h4>Warmup</h4>\n<p>${workoutDay.warmup}</p>\n`;
              }
              
              if (workoutDay.workout) {
                formattedContent += `<h4>Workout</h4>\n<p>${workoutDay.workout}</p>\n`;
              }
              
              if (workoutDay.notes) {
                formattedContent += `<h4>Notes</h4>\n<p>${workoutDay.notes}</p>\n`;
              }
              
              formattedContent += '<hr/>\n\n';
            });
        } else if (isWorkoutDay(value)) {
          // Handle legacy single days (no cycle structure)
          const workoutDay = value as WorkoutDay;
          const formattedDay = key.replace(/day(\d+)/, 'Day $1');
          
          formattedContent += `<h2>${formattedDay}</h2>\n`;
          
          if (workoutDay.description) {
            formattedContent += `<p><strong>Focus:</strong> ${workoutDay.description}</p>\n`;
          }
          
          if (workoutDay.strength) {
            formattedContent += `<h3>Strength</h3>\n<p>${workoutDay.strength}</p>\n`;
          }
          
          if (workoutDay.warmup) {
            formattedContent += `<h3>Warmup</h3>\n<p>${workoutDay.warmup}</p>\n`;
          }
          
          if (workoutDay.workout) {
            formattedContent += `<h3>Workout</h3>\n<p>${workoutDay.workout}</p>\n`;
          }
          
          if (workoutDay.notes) {
            formattedContent += `<h3>Notes</h3>\n<p>${workoutDay.notes}</p>\n`;
          }
          
          formattedContent += '<hr/>\n\n';
        }
      });
    
    return formattedContent;
  }, []);

  const setEditorContent = useCallback(() => {
    if (editor && content) {
      try {
        // First try to parse as JSON
        const parsedContent = JSON.parse(content);
        console.log('Parsed content:', parsedContent);
        
        if (typeof parsedContent === 'string') {
          // If the parsed content is a string, set it directly
          editor.commands.setContent(parsedContent);
        } else if (parsedContent.content) {
          // If it's the Gemini response format with a content property
          const cleanContent = parsedContent.content
            .replace(/```html|```/g, '') // Remove markdown code block markers
            .trim();
          console.log('Setting cleaned Gemini content:', cleanContent);
          editor.commands.setContent(cleanContent);
        } else {
          // Format the workout data into a readable document with ALL cycles and days
          const formattedContent = formatWorkoutData(parsedContent);
          console.log('Setting formatted content:', formattedContent);
          editor.commands.setContent(formattedContent);
        }
      } catch (error) {
        // If parsing fails, set the content directly
        console.log('Setting direct content:', content);
        editor.commands.setContent(content);
      }
    }
  }, [editor, content, formatWorkoutData]);

  useEffect(() => {
    setEditorContent();
  }, [setEditorContent]);

  const handlePublish = useCallback(async () => {
    if (!editor) return;
    
    try {
      const currentContent = editor.getHTML();
      await publishDocument(currentContent, onSave);
    } catch (error) {
      console.error('Error in handlePublish:', error);
    }
  }, [editor, publishDocument, onSave]);

  if (!editor) return null;

  return (
    <div className="relative min-h-screen">
      <div className="pt-24 pb-12">
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
