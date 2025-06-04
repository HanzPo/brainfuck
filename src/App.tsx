import { useState, useRef, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { CodeEditor } from './components/CodeEditor';
import Terminal from './components/Terminal';
import type { TerminalRef } from './components/Terminal';
import { MemoryVisualizer } from './components/MemoryVisualizer';
import { Button } from './components/ui/button';
import { BrainfuckInterpreter } from './utils/brainfuck';
import type { BrainfuckState } from './utils/brainfuck';
import { Play, Pause, RotateCcw, StepForward } from 'lucide-react';

const STORAGE_KEY = 'brainfuck-code';

// Default Hello World program in Brainfuck
const DEFAULT_PROGRAM = `++++++++++[>+++++++>++++++++++>+++>+<<<<-]
>++.>+.+++++++..+++.>++.<<+++++++++++++++.
>.+++.------.--------.>+.>.`;

function App() {
  const [code, setCode] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [interpreterState, setInterpreterState] = useState<BrainfuckState | null>(null);
  const [executionState, setExecutionState] = useState<'idle' | 'running' | 'paused'>('idle');
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

  // Start/Resume the program
  const handleStart = useCallback(async () => {
    if (executionState === 'paused' && interpreterRef.current) {
      // Resume from pause
      setExecutionState('running');
      
      // Continue monitoring state
      const updateInterval = setInterval(() => {
        if (interpreterRef.current) {
          const state = interpreterRef.current.getState();
          setInterpreterState(state);
          
          // Check if execution has stopped
          if (!state.isRunning) {
            clearInterval(updateInterval);
            if (state.isPaused) {
              setExecutionState('paused');
            } else {
              setExecutionState('idle');
            }
          }
        }
      }, 50);
      
      await interpreterRef.current.resume();
      
      // Clean up after resume completes
      clearInterval(updateInterval);
      const finalState = interpreterRef.current.getState();
      setInterpreterState(finalState);
      if (!finalState.isRunning) {
        setExecutionState('idle');
      }
      return;
    }

    // Start new execution only if idle
    if (executionState === 'idle') {
      terminalRef.current?.reset();
      const interpreter = createInterpreter();
      setExecutionState('running');

      // Update state during execution
      const updateInterval = setInterval(() => {
        if (interpreterRef.current) {
          const state = interpreterRef.current.getState();
          setInterpreterState(state);
          
          // Check if execution has stopped
          if (!state.isRunning) {
            clearInterval(updateInterval);
            if (state.isPaused) {
              setExecutionState('paused');
            } else {
              setExecutionState('idle');
            }
          }
        }
      }, 50);

      await interpreter.run();

      clearInterval(updateInterval);
      setInterpreterState(interpreter.getState());
      if (interpreter.getState().isPaused) {
        setExecutionState('paused');
      } else {
        setExecutionState('idle');
      }
    }
  }, [executionState, createInterpreter]);

  // Pause the program
  const handlePause = useCallback(() => {
    if (interpreterRef.current && executionState === 'running') {
      interpreterRef.current.pause();
      setExecutionState('paused');
    }
  }, [executionState]);

  // Reset the program
  const handleReset = useCallback(() => {
    if (interpreterRef.current) {
      interpreterRef.current.reset();
      setInterpreterState(null);
    }
    terminalRef.current?.reset();
    setExecutionState('idle');
    interpreterRef.current = null;
  }, []);

  // Step through the program
  const handleStep = useCallback(async () => {
    // If we're paused, just step without creating a new interpreter
    if (executionState === 'paused' && interpreterRef.current) {
      await interpreterRef.current.step();
      setInterpreterState(interpreterRef.current.getState());
      return;
    }
    
    // If idle and no interpreter, create one
    if (!interpreterRef.current && executionState === 'idle') {
      // Create new interpreter if needed
      terminalRef.current?.reset();
      const interpreter = createInterpreter();
      setInterpreterState(interpreter.getState());
    }

    if (interpreterRef.current && executionState !== 'running') {
      await interpreterRef.current.step();
      setInterpreterState(interpreterRef.current.getState());
    }
  }, [executionState, createInterpreter]);

  // Calculate current line in editor
  const getCurrentLine = useCallback(() => {
    if (!interpreterState) {
      return undefined;
    }
    
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
        <div className="w-1/2 p-4 flex flex-col min-h-0">
          <h2 className="text-sm font-semibold mb-2">Code Editor</h2>
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              currentLine={getCurrentLine()}
              currentCharIndex={interpreterState?.programCounter}
            />
          </div>
        </div>
        
        {/* Terminal */}
        <div className="w-1/2 p-4 flex flex-col">
          <h2 className="text-sm font-semibold mb-2">Terminal</h2>
          <div className="flex-1 border rounded-md overflow-hidden">
            <Terminal ref={terminalRef} />
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="px-4 py-2 bg-card border-t">
        <div className="flex gap-2">
          {executionState === 'running' ? (
            <Button
              onClick={handlePause}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              variant="default"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {executionState === 'paused' ? 'Resume' : 'Start'}
            </Button>
          )}
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            onClick={handleStep}
            variant="outline"
            disabled={executionState === 'running'}
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
