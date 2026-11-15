"use client";

import React, { useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import "jodit/es2021/jodit.min.css";

const JoditEditorComponent = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-44 border border-zinc-200 rounded bg-zinc-50 flex items-center justify-center text-xs text-zinc-400 animate-pulse">
      Loading editor...
    </div>
  ),
});

interface JoditEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function JoditEditor({
  value,
  onChange,
  placeholder = "",
  className = "",
}: JoditEditorProps) {
  const editorRef = useRef(null);

  const config = useMemo(
    () => ({
      readonly: false,
      placeholder,
      toolbarAdaptive: false,
      minHeight: 180,
      height: 220,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_as_html",
      useSearch: false,
    }),
    [placeholder]
  );

  return (
    <div className={`w-full jodit-editor-container ${className}`}>
      <JoditEditorComponent
        ref={editorRef}
        value={value}
        config={config as any}
        onBlur={(newContent) => onChange(newContent)}
        onChange={(newContent) => onChange(newContent)}
      />
    </div>
  );
}

