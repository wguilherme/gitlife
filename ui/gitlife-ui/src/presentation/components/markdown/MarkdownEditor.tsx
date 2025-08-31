import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { clsx } from 'clsx';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  theme?: 'light' | 'dark';
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const extensions = [
  markdown(),
  EditorView.theme({
    '&': {
      fontSize: '14px',
    },
    '.cm-content': {
      padding: '16px',
      minHeight: '200px',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '.cm-editor': {
      borderRadius: '8px',
    },
    '.cm-scroller': {
      fontFamily: 'inherit',
    },
  }),
  EditorView.lineWrapping,
];

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  theme = 'light',
  className,
  placeholder = 'Start writing your markdown...',
  readOnly = false,
  height = '400px',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={clsx('relative', className)}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={extensions}
        theme={isDark ? oneDark : undefined}
        placeholder={placeholder}
        editable={!readOnly}
        style={{
          height,
          border: '1px solid',
          borderColor: isDark ? '#374151' : '#d1d5db',
          borderRadius: '8px',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
        }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          searchKeymap: true,
        }}
      />
    </div>
  );
};