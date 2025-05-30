export interface BrainfuckState {
  memory: Uint8Array;
  pointer: number;
  programCounter: number;
  output: string;
  input: string;
  inputIndex: number;
  isRunning: boolean;
  isPaused: boolean;
}

export class BrainfuckInterpreter {
  private state: BrainfuckState;
  private program: string;
  private loopStack: number[] = [];
  private onOutput?: (char: string) => void;
  private onInputRequest?: () => Promise<string>;

  constructor(
    program: string,
    memorySize: number = 30000,
    onOutput?: (char: string) => void,
    onInputRequest?: () => Promise<string>
  ) {
    this.program = program;
    this.onOutput = onOutput;
    this.onInputRequest = onInputRequest;
    this.state = {
      memory: new Uint8Array(memorySize),
      pointer: 0,
      programCounter: 0,
      output: "",
      input: "",
      inputIndex: 0,
      isRunning: false,
      isPaused: false,
    };
  }

  getState(): BrainfuckState {
    return { ...this.state };
  }

  reset() {
    this.state.memory.fill(0);
    this.state.pointer = 0;
    this.state.programCounter = 0;
    this.state.output = "";
    this.state.input = "";
    this.state.inputIndex = 0;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.loopStack = [];
  }

  async step(): Promise<boolean> {
    if (this.state.programCounter >= this.program.length) {
      this.state.isRunning = false;
      return false;
    }

    const instruction = this.program[this.state.programCounter];

    switch (instruction) {
      case '>':
        this.state.pointer = (this.state.pointer + 1) % this.state.memory.length;
        break;
      
      case '<':
        this.state.pointer = (this.state.pointer - 1 + this.state.memory.length) % this.state.memory.length;
        break;
      
      case '+':
        this.state.memory[this.state.pointer] = (this.state.memory[this.state.pointer] + 1) % 256;
        break;
      
      case '-':
        this.state.memory[this.state.pointer] = (this.state.memory[this.state.pointer] - 1 + 256) % 256;
        break;
      
      case '.':
        {
          const outputChar = String.fromCharCode(this.state.memory[this.state.pointer]);
          this.state.output += outputChar;
          if (this.onOutput) {
            this.onOutput(outputChar);
          }
        }
        break;
      
      case ',':
        if (this.onInputRequest && this.state.inputIndex >= this.state.input.length) {
          const newInput = await this.onInputRequest();
          this.state.input += newInput;
        }
        
        if (this.state.inputIndex < this.state.input.length) {
          this.state.memory[this.state.pointer] = this.state.input.charCodeAt(this.state.inputIndex);
          this.state.inputIndex++;
        } else {
          this.state.memory[this.state.pointer] = 0;
        }
        break;
      
      case '[':
        if (this.state.memory[this.state.pointer] === 0) {
          // Jump to matching ]
          let depth = 1;
          let i = this.state.programCounter + 1;
          while (i < this.program.length && depth > 0) {
            if (this.program[i] === '[') depth++;
            else if (this.program[i] === ']') depth--;
            i++;
          }
          this.state.programCounter = i - 1;
        } else {
          this.loopStack.push(this.state.programCounter);
        }
        break;
      
      case ']':
        if (this.state.memory[this.state.pointer] !== 0) {
          // Jump back to matching [
          this.state.programCounter = this.loopStack[this.loopStack.length - 1];
        } else {
          this.loopStack.pop();
        }
        break;
    }

    this.state.programCounter++;
    return true;
  }

  async run() {
    this.state.isRunning = true;
    this.state.isPaused = false;
    
    while (this.state.isRunning && !this.state.isPaused) {
      const canContinue = await this.step();
      if (!canContinue) {
        this.state.isRunning = false;
      }
      
      // Allow UI to update between steps
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  pause() {
    this.state.isPaused = true;
  }

  resume() {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.run();
    }
  }
} 