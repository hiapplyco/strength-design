// Markdown parser for React Native
export class MarkdownParser {
  static parse(text) {
    const lines = text.split('\n');
    const nodes = [];
    let currentList = null;
    let currentCodeBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Code block
      if (line.startsWith('```')) {
        if (currentCodeBlock) {
          nodes.push({
            type: 'codeblock',
            content: currentCodeBlock.join('\n'),
            language: currentCodeBlock[0]
          });
          currentCodeBlock = null;
        } else {
          currentCodeBlock = [];
        }
        continue;
      }
      
      if (currentCodeBlock !== null) {
        currentCodeBlock.push(line);
        continue;
      }

      // Headers
      if (line.startsWith('### ')) {
        nodes.push({ type: 'h3', content: line.substring(4) });
        currentList = null;
      } else if (line.startsWith('## ')) {
        nodes.push({ type: 'h2', content: line.substring(3) });
        currentList = null;
      } else if (line.startsWith('# ')) {
        nodes.push({ type: 'h1', content: line.substring(2) });
        currentList = null;
      }
      // Bullet points
      else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        const content = line.substring(2);
        if (!currentList || currentList.type !== 'bullet') {
          currentList = { type: 'bullet', items: [] };
          nodes.push(currentList);
        }
        currentList.items.push(content);
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, '');
        if (!currentList || currentList.type !== 'numbered') {
          currentList = { type: 'numbered', items: [] };
          nodes.push(currentList);
        }
        currentList.items.push(content);
      }
      // Empty lines
      else if (line.trim() === '') {
        nodes.push({ type: 'break' });
        currentList = null;
      }
      // Regular text
      else {
        nodes.push({ type: 'text', content: line });
        currentList = null;
      }
    }

    return nodes;
  }

  static parseInline(text) {
    if (!text) return [];
    
    const parts = [];
    let currentIndex = 0;
    
    // Pattern for bold text - handles both ** and * for bold
    const boldRegex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push({
          type: 'text',
          content: text.substring(currentIndex, match.index)
        });
      }
      
      // Add bold text (match[1] for ** or match[2] for *)
      parts.push({
        type: 'bold',
        content: match[1] || match[2]
      });
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(currentIndex)
      });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  }

  static extractWorkoutData(text) {
    const workout = {
      title: '',
      weeks: [],
      overview: '',
      equipment: [],
      frequency: null
    };

    const lines = text.split('\n');
    let currentWeek = null;
    let currentDay = null;
    let currentSection = null;

    for (const line of lines) {
      // Program Overview
      if (line.includes('Program Overview')) {
        currentSection = 'overview';
      }
      // Week headers
      else if (line.match(/##\s*Week\s*(\d+)/i)) {
        const weekMatch = line.match(/##\s*Week\s*(\d+[^:]*):?\s*(.*)/i);
        if (weekMatch) {
          currentWeek = {
            number: parseInt(weekMatch[1]),
            title: weekMatch[2] || `Week ${weekMatch[1]}`,
            days: []
          };
          workout.weeks.push(currentWeek);
          currentDay = null;
        }
      }
      // Day headers
      else if (line.match(/###\s*Day\s*(\d+)/i) && currentWeek) {
        const dayMatch = line.match(/###\s*Day\s*(\d+):?\s*(.*)/i);
        if (dayMatch) {
          currentDay = {
            number: parseInt(dayMatch[1]),
            title: dayMatch[2] || `Day ${dayMatch[1]}`,
            warmup: [],
            mainWorkout: [],
            cooldown: []
          };
          currentWeek.days.push(currentDay);
          currentSection = null;
        }
      }
      // Sections
      else if (line.toLowerCase().includes('warm-up') || line.toLowerCase().includes('warmup')) {
        currentSection = 'warmup';
      }
      else if (line.toLowerCase().includes('main workout') || line.toLowerCase().includes('strength')) {
        currentSection = 'mainWorkout';
      }
      else if (line.toLowerCase().includes('cool-down') || line.toLowerCase().includes('cooldown')) {
        currentSection = 'cooldown';
      }
      // Exercise lines
      else if (currentDay && currentSection && line.trim()) {
        // Parse exercise format: "1. Exercise Name - Sets x Reps (Rest: XX seconds)"
        const exerciseMatch = line.match(/^\d+\.\s*([^-]+)(?:-\s*(.+))?/);
        const bulletMatch = line.match(/^[•\-\*]\s*(.+)/);
        
        if (exerciseMatch || bulletMatch) {
          const exercise = {
            name: exerciseMatch ? exerciseMatch[1].trim() : bulletMatch[1].trim(),
            details: exerciseMatch && exerciseMatch[2] ? exerciseMatch[2].trim() : ''
          };
          
          if (currentSection === 'warmup') {
            currentDay.warmup.push(exercise);
          } else if (currentSection === 'mainWorkout') {
            currentDay.mainWorkout.push(exercise);
          } else if (currentSection === 'cooldown') {
            currentDay.cooldown.push(exercise);
          }
        }
      }
    }

    return workout;
  }
}