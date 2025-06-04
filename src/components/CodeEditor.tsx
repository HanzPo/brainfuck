import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  currentLine?: number;
  currentCharIndex?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, currentLine, currentCharIndex }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState<number>(0);

  const lines = value.split('\n');
  const lineCount = lines.length;

  // Track cursor position for editor line highlighting
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const updateCursorLine = () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      const linesBeforeCursor = textBeforeCursor.split('\n');
      setCursorLine(linesBeforeCursor.length - 1);
    };

    textarea.addEventListener('click', updateCursorLine);
    textarea.addEventListener('keyup', updateCursorLine);
    textarea.addEventListener('focus', updateCursorLine);

    return () => {
      textarea.removeEventListener('click', updateCursorLine);
      textarea.removeEventListener('keyup', updateCursorLine);
      textarea.removeEventListener('focus', updateCursorLine);
    };
  }, [value]);

  useEffect(() => {
    // Sync scroll position between textarea and line numbers
    const textarea = textareaRef.current;
    const lineNumbers = lineNumbersRef.current;
    const highlight = highlightRef.current;
    
    if (!textarea || !lineNumbers) return;

    const handleScroll = () => {
      lineNumbers.scrollTop = textarea.scrollTop;
      if (highlight) {
        highlight.style.transform = `translateY(${-textarea.scrollTop}px)`;
      }
    };

    textarea.addEventListener('scroll', handleScroll);
    return () => textarea.removeEventListener('scroll', handleScroll);
  }, []);

  // Update highlight position when cursorLine changes
  useEffect(() => {
    if (highlightRef.current && cursorLine !== undefined) {
      highlightRef.current.style.top = `calc(${cursorLine * 1.5}rem + 1rem)`;
      const scrollTop = textareaRef.current?.scrollTop || 0;
      highlightRef.current.style.transform = `translateY(${-scrollTop}px)`;
    }
  }, [cursorLine]);

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

  // Calculate position for character highlight
  const getCharacterHighlight = () => {
    if (currentCharIndex === undefined) return null;
    
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;
      if (charCount + lineLength >= currentCharIndex) {
        const charInLine = currentCharIndex - charCount;
        return {
          line: i,
          column: charInLine
        };
      }
      charCount += lineLength + 1; // +1 for newline
    }
    return null;
  };

  const charPos = getCharacterHighlight();

  return (
    <div className="flex h-full bg-card border rounded-md overflow-hidden">
      <div 
        ref={lineNumbersRef}
        className="flex-shrink-0 select-none bg-muted text-muted-foreground text-sm font-mono p-4 pr-2 overflow-y-hidden"
        style={{ minHeight: 0 }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-[1.5rem] pr-2 text-right transition-colors",
              cursorLine === i && "text-foreground font-semibold",
              currentLine === i && "text-yellow-500"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            ref={highlightRef}
            className="absolute left-0 right-0 h-[1.5rem] bg-accent/10 border-l-2 border-accent pointer-events-none transition-all duration-150"
            style={{ 
              top: `calc(${cursorLine * 1.5}rem + 1rem)`
            }}
          />
        </div>
        {charPos && (
          <div 
            className="absolute pointer-events-none"
            style={{
              top: `calc(${charPos.line * 1.5}rem + 1rem)`,
              left: `calc(${charPos.column}ch + 1rem)`,
              transform: `translateY(${-(textareaRef.current?.scrollTop || 0)}px)`
            }}
          >
            <span className="inline-block w-[1ch] h-[1.5rem] bg-red-500 opacity-40 animate-pulse" />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="relative z-10 w-full h-full p-4 font-mono text-sm bg-transparent resize-none outline-none overflow-y-auto"
          style={{ lineHeight: '1.5rem', minHeight: 0 }}
          placeholder="Enter your Brainfuck code here..."
          spellCheck={false}
        />
      </div>
    </div>
  );
}; 