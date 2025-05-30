import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onInput?: (data: string) => void;
}

export interface TerminalRef {
  write: (text: string) => void;
  clear: () => void;
  reset: () => void;
  requestInput: () => Promise<string>;
}

const Terminal = React.forwardRef<TerminalRef, TerminalProps>((props, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const inputResolverRef = useRef<((value: string) => void) | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new XTerm({
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    
    xterm.open(terminalRef.current);
    fitAddon.fit();

    xterm.writeln('Brainfuck Terminal');
    xterm.writeln('==================');
    xterm.writeln('Ready for input/output...\r\n');

    // Handle terminal input
    xterm.onData((data) => {
      if (data === '\r') {
        // Enter key pressed
        xterm.write('\r\n');
        const input = inputBufferRef.current;
        inputBufferRef.current = '';
        
        if (inputResolverRef.current) {
          inputResolverRef.current(input);
          inputResolverRef.current = null;
        }
        
        if (props.onInput) {
          props.onInput(input + '\n');
        }
      } else if (data === '\x7f') {
        // Backspace
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          xterm.write('\b \b');
        }
      } else if (data >= ' ' && data <= '~') {
        // Printable character
        inputBufferRef.current += data;
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xterm.dispose();
    };
  }, [props.onInput]);

  const write = useCallback((text: string) => {
    if (xtermRef.current) {
      // Replace newlines with carriage return + newline for proper terminal display
      const formattedText = text.replace(/\n/g, '\r\n');
      xtermRef.current.write(formattedText);
    }
  }, []);

  const clear = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  }, []);

  const reset = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.reset();
      xtermRef.current.writeln('Brainfuck Terminal');
      xtermRef.current.writeln('==================');
      xtermRef.current.writeln('Ready for input/output...\r\n');
    }
    inputBufferRef.current = '';
    inputResolverRef.current = null;
  }, []);

  const requestInput = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      inputResolverRef.current = resolve;
    });
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({
      write,
      clear,
      reset,
      requestInput,
    }),
    [write, clear, reset, requestInput]
  );

  return (
    <div ref={terminalRef} className="h-full bg-card" />
  );
});

Terminal.displayName = 'Terminal';

export default Terminal; 