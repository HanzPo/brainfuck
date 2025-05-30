import React, { useRef, useEffect } from 'react';
import { cn } from '../lib/utils';

interface MemoryVisualizerProps {
  memory: Uint8Array;
  pointer: number;
  visibleCells?: number;
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({ 
  memory, 
  pointer, 
  visibleCells = 20 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pointerCellRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, pointer - Math.floor(visibleCells / 2));
  const endIndex = Math.min(memory.length, startIndex + visibleCells);
  const visibleMemory = Array.from(memory.slice(startIndex, endIndex));

  // Auto-scroll to keep pointer in view
  useEffect(() => {
    if (pointerCellRef.current && scrollContainerRef.current) {
      pointerCellRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [pointer]);

  return (
    <div className="bg-muted border rounded-md p-4">
      <div className="mb-2 text-sm font-medium text-foreground">
        Memory Visualization (Pointer at: {pointer})
      </div>
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto"
      >
        <div className="flex gap-1 min-w-max">
          {visibleMemory.map((value, index) => {
            const actualIndex = startIndex + index;
            const isPointer = actualIndex === pointer;
            
            return (
              <div
                key={actualIndex}
                ref={isPointer ? pointerCellRef : undefined}
                className={cn(
                  "flex flex-col items-center",
                  isPointer && "relative"
                )}
              >
                {/* Pointer indicator */}
                {isPointer && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-black" />
                  </div>
                )}
                
                {/* Memory cell */}
                <div
                  className={cn(
                    "w-12 h-12 flex items-center justify-center font-mono text-sm border-2 rounded",
                    isPointer ? "border-black bg-accent" : "border-border bg-card",
                    value > 0 && "font-bold"
                  )}
                >
                  {value}
                </div>
                
                {/* Address */}
                <div className="text-xs text-muted-foreground mt-1">
                  {actualIndex}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ASCII representation */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm font-medium text-foreground mb-2">ASCII Characters:</div>
        <div className="flex gap-1 font-mono text-xs overflow-x-auto">
          {visibleMemory.map((value, index) => {
            const actualIndex = startIndex + index;
            const isPointer = actualIndex === pointer;
            const char = value >= 32 && value <= 126 ? String.fromCharCode(value) : '·';
            
            return (
              <div
                key={actualIndex}
                className={cn(
                  "w-12 text-center",
                  isPointer && "font-bold"
                )}
              >
                {char}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 