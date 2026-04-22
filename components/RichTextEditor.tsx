'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill-new');
    // Using a wrapper so it doesn't complain about forwarding refs in some Next.js versions
    return function ForwardedQuill(props: any) {
      return <RQ {...props} />;
    };
  }, 
  { 
    ssr: false, 
    loading: () => <div className="h-40 w-full animate-pulse bg-[#080808] border border-white/10 rounded-xl"></div> 
  }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'align',
    'list',
    'link', 'image', 'video'
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="w-full bg-[#080808] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-all font-sans"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          border: none !important;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          font-family: inherit;
          min-height: 150px;
        }
        .rich-text-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
          color: white;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.5);
          font-style: normal;
        }
        .rich-text-editor .ql-stroke {
          stroke: #9ca3af !important;
        }
        .rich-text-editor .ql-fill {
          fill: #9ca3af !important;
        }
        .rich-text-editor .ql-picker {
          color: #9ca3af !important;
        }
        .rich-text-editor .ql-picker-options {
          background-color: #1f2937 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .rich-text-editor .ql-picker-item:hover, .rich-text-editor .ql-picker-label:hover {
          color: white !important;
        }
        .rich-text-editor .ql-picker-item:hover .ql-stroke, .rich-text-editor .ql-picker-label:hover .ql-stroke {
          stroke: white !important;
        }
      `}</style>
    </div>
  );
}
