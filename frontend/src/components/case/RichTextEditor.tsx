/**
 * Rich Text Editor Component
 * Simple rich text editor with formatting tools (bold, italic, underline, etc.)
 */

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Tapez votre texte ici...',
  className
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Helper to get text nodes
  const getTextNodes = (node: Node): Text[] => {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null
    );
    let textNode;
    while (textNode = walker.nextNode()) {
      textNodes.push(textNode as Text);
    }
    return textNodes;
  };

  useEffect(() => {
    if (editorRef.current) {
      // Only update if content actually changed to prevent cursor jumping
      const currentContent = editorRef.current.innerHTML;
      // Convert plain text to HTML if needed (preserve line breaks)
      let newContent = value || '';
      if (newContent && !newContent.includes('<')) {
        // Plain text - convert to HTML preserving line breaks
        newContent = newContent
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        newContent = `<p>${newContent}</p>`;
      }
      if (currentContent !== newContent) {
        // Save cursor position
        const selection = window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        const cursorOffset = range?.startOffset || 0;
        const cursorNode = range?.startContainer;
        
        editorRef.current.innerHTML = newContent;
        
        // Restore cursor position if possible
        if (range && cursorNode) {
          try {
            const newRange = document.createRange();
            const textNodes = getTextNodes(editorRef.current);
            if (textNodes.length > 0 && cursorOffset <= textNodes[0].textContent?.length) {
              newRange.setStart(textNodes[0], Math.min(cursorOffset, textNodes[0].textContent?.length || 0));
              newRange.collapse(true);
              selection?.removeAllRanges();
              selection?.addRange(newRange);
            }
          } catch (e) {
            // If cursor restoration fails, just focus the editor
            editorRef.current.focus();
          }
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | boolean = false) => {
    document.execCommand(command, false, value as string);
    editorRef.current?.focus();
    handleInput();
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  return (
    <div className={cn("border border-gray-300 rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('bold') && "bg-gray-200"
          )}
          title="Gras"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('italic') && "bg-gray-200"
          )}
          title="Italique"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className={cn(
            "h-8 w-8 p-0",
            isCommandActive('underline') && "bg-gray-200"
          )}
          title="Souligné"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
          className="h-8 w-8 p-0"
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          className="h-8 w-8 p-0"
          title="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          className="h-8 w-8 p-0"
          title="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          className="h-8 w-8 p-0"
          title="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "min-h-[400px] p-4 focus:outline-none overflow-y-auto",
          "prose prose-sm max-w-none",
          isFocused && "ring-2 ring-[#009639] ring-offset-1"
        )}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxHeight: 'calc(100vh - 300px)'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
      
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

