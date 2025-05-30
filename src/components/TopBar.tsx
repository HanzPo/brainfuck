import React from 'react';
import { Save, Check } from 'lucide-react';
import { Button } from './ui/button';

interface TopBarProps {
  isSaved: boolean;
  onSave: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isSaved, onSave }) => {
  return (
    <div className="h-14 bg-card border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Brainfuck Interpreter</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaved ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span>Saved</span>
            </>
          ) : (
            <span className="text-orange-600">Unsaved changes</span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}; 