"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Quote } from 'lucide-react';

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your script, outline, or video notes here...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-6 py-4 text-sm font-medium text-[#0F0F0F]',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const toggleBtnClass = (isActive) => 
    `p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-neutral-500 hover:bg-neutral-100 hover:text-[#0F0F0F]'}`;

  return (
    <div className="w-full bg-[#F9FAFB] border border-black/[0.06] rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-black/[0.04] bg-white">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toggleBtnClass(editor.isActive('bold'))}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toggleBtnClass(editor.isActive('italic'))}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-black/[0.1] mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toggleBtnClass(editor.isActive('heading', { level: 2 }))}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toggleBtnClass(editor.isActive('bulletList'))}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toggleBtnClass(editor.isActive('orderedList'))}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-black/[0.1] mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toggleBtnClass(editor.isActive('blockquote'))}
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
