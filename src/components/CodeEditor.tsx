import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  currentLine?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, currentLine }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  useEffect(() => {
    // Sync scroll position between textarea and line numbers
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    
    if (!textarea || !lineNumbers) return;

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Reset cursor position after the tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="flex h-full bg-card border rounded-md overflow-hidden">
      <div 
        ref={lineNumbersRef}
        className="flex-shrink-0 select-none bg-muted text-muted-foreground text-sm font-mono p-4 pr-2 overflow-hidden"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-[1.5rem] pr-2 text-right",
              currentLine === i && "bg-accent text-accent-foreground font-bold"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="flex-1 p-4 font-mono text-sm bg-transparent resize-none outline-none"
        style={{ lineHeight: '1.5rem' }}
        placeholder="Enter your Brainfuck code here..."
        spellCheck={false}
      />
    </div>
  );
}; 