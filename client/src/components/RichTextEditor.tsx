import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Redo,
  Undo,
  Type,
  Quote,
  PanelTopClose
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite o conteúdo aqui...',
  className
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose focus:outline-none min-h-[200px] max-w-none p-4',
        placeholder: placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sincronizar com o valor externo
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const fontFamilies = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Desfazer"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Refazer"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="h-5 w-px bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('bold') ? 'bg-gray-200' : '')}
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('italic') ? 'bg-gray-200' : '')}
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('underline') ? 'bg-gray-200' : '')}
          title="Sublinhado"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={cn("h-8 w-8 p-0", editor.isActive('highlight') ? 'bg-gray-200' : '')}
          title="Destacar"
        >
          <Highlighter className="h-4 w-4" />
        </Button>

        <div className="h-5 w-px bg-gray-300 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              title="Estilos de texto"
            >
              <Type className="h-4 w-4" />
              <span>Estilo</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={cn(editor.isActive('paragraph') ? 'bg-gray-100' : '')}
              >
                <span>Parágrafo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor.isActive('heading', { level: 1 }) ? 'bg-gray-100' : '')}
              >
                <Heading1 className="h-4 w-4 mr-2" />
                <span>Título 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : '')}
              >
                <Heading2 className="h-4 w-4 mr-2" />
                <span>Título 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editor.isActive('bulletList') ? 'bg-gray-100' : '')}
              >
                <List className="h-4 w-4 mr-2" />
                <span>Lista com marcadores</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editor.isActive('orderedList') ? 'bg-gray-100' : '')}
              >
                <ListOrdered className="h-4 w-4 mr-2" />
                <span>Lista numerada</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(editor.isActive('blockquote') ? 'bg-gray-100' : '')}
              >
                <Quote className="h-4 w-4 mr-2" />
                <span>Citação</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1"
              title="Fonte"
            >
              <PanelTopClose className="h-4 w-4" />
              <span>Fonte</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {fontFamilies.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                  className={cn(editor.isActive('textStyle', { fontFamily: font.value }) ? 'bg-gray-100' : '')}
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-gray-300 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : '')}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : '')}
          title="Centralizar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : '')}
          title="Alinhar à direita"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 rounded-md shadow-lg bg-white border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("h-7 w-7 p-0", editor.isActive('bold') ? 'bg-gray-200' : '')}
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("h-7 w-7 p-0", editor.isActive('italic') ? 'bg-gray-200' : '')}
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("h-7 w-7 p-0", editor.isActive('underline') ? 'bg-gray-200' : '')}
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn("h-7 w-7 p-0", editor.isActive('highlight') ? 'bg-gray-200' : '')}
            >
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
};

export default RichTextEditor;