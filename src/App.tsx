import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { CodeEditor } from './components/CodeEditor';
import Terminal from './components/Terminal';
import type { TerminalRef } from './components/Terminal';
import { MemoryVisualizer } from './components/MemoryVisualizer';
import { Button } from './components/ui/button';
import { BrainfuckInterpreter } from './utils/brainfuck';
import type { BrainfuckState } from './utils/brainfuck';
import { Play, Square, StepForward } from 'lucide-react';

const STORAGE_KEY = 'brainfuck-code';

// Default Hello World program in Brainfuck
const DEFAULT_PROGRAM = `++++++++++[>+++++++>++++++++++>+++>+<<<<-]
>++.>+.+++++++..+++.>++.<<+++++++++++++++.
>.+++.------.--------.>+.>.`;

function App() {
  const [code, setCode] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [interpreterState, setInterpreterState] = useState<BrainfuckState | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const terminalRef = useRef<TerminalRef>(null);
  const interpreterRef = useRef<BrainfuckInterpreter | null>(null);

  // Load saved code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem(STORAGE_KEY);
    if (savedCode) {
      setCode(savedCode);
    } else {
      // If no saved code, use the default program
      setCode(DEFAULT_PROGRAM);
    }
  }, []);

  // Handle code changes
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    setIsSaved(false);
  }, []);

  // Save code to localStorage
  const handleSave = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, code);
    setIsSaved(true);
  }, [code]);

  // Create interpreter with terminal integration
  const createInterpreter = useCallback(() => {
    const interpreter = new BrainfuckInterpreter(
      code,
      30000,
      (char: string) => {
        terminalRef.current?.write(char);
      },
      async () => {
        if (terminalRef.current) {
          return await terminalRef.current.requestInput();
        }
        return '';
      }
    );
    
    interpreterRef.current = interpreter;
    return interpreter;
  }, [code]);

  // Run the program
  const handleRun = useCallback(async () => {
    if (isRunning) {
      // Stop the current execution
      if (interpreterRef.current) {
        interpreterRef.current.pause();
      }
      setIsRunning(false);
      return;
    }

    // Reset terminal and create new interpreter
    terminalRef.current?.reset();
    const interpreter = createInterpreter();
    setIsRunning(true);

    // Update state during execution
    const updateInterval = setInterval(() => {
      if (interpreterRef.current) {
        setInterpreterState(interpreterRef.current.getState());
      }
    }, 50);

    await interpreter.run();

    clearInterval(updateInterval);
    setInterpreterState(interpreter.getState());
    setIsRunning(false);
  }, [code, isRunning, createInterpreter]);

  // Step through the program
  const handleStep = useCallback(async () => {
    if (!interpreterRef.current || isRunning) {
      // Create new interpreter if needed
      terminalRef.current?.reset();
      const interpreter = createInterpreter();
      setInterpreterState(interpreter.getState());
    }

    if (interpreterRef.current) {
      await interpreterRef.current.step();
      setInterpreterState(interpreterRef.current.getState());
    }
  }, [isRunning, createInterpreter]);

  // Calculate current line in editor
  const getCurrentLine = useCallback(() => {
    if (!interpreterState) return undefined;
    
    const lines = code.split('\n');
    let charCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= interpreterState.programCounter) {
        return i;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    
    return 0;
  }, [code, interpreterState]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar isSaved={isSaved} onSave={handleSave} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        <div className="w-1/2 p-4">
          <div className="h-full flex flex-col">
            <h2 className="text-sm font-semibold mb-2">Code Editor</h2>
            <div className="flex-1">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                currentLine={getCurrentLine()}
              />
            </div>
          </div>
        </div>
        
        {/* Terminal */}
        <div className="w-1/2 p-4">
          <div className="h-full flex flex-col">
            <h2 className="text-sm font-semibold mb-2">Terminal</h2>
            <div className="flex-1 border rounded-md overflow-hidden">
              <Terminal ref={terminalRef} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="px-4 py-2 bg-card border-t">
        <div className="flex gap-2">
          <Button
            onClick={handleRun}
            variant={isRunning ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
          
          <Button
            onClick={handleStep}
            variant="outline"
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <StepForward className="h-4 w-4" />
            Step
          </Button>
        </div>
      </div>
      
      {/* Memory Visualizer */}
      <div className="p-4 bg-card border-t">
        {interpreterState ? (
          <MemoryVisualizer
            memory={interpreterState.memory}
            pointer={interpreterState.pointer}
          />
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Run or step through your program to see memory visualization
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
