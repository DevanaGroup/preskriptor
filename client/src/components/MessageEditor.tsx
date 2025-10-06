import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter, Type, Image, Link, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MessageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave?: (content: string) => void;
}

export default function MessageEditor({ isOpen, onClose, content, onSave }: MessageEditorProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight,
      FontFamily,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleCopy = () => {
    if (editor) {
      const text = editor.getHTML();
      navigator.clipboard.writeText(text);
      toast({
        title: "Copiado!",
        description: "O conteúdo foi copiado para a área de transferência.",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    
    try {
      const editorElement = document.querySelector('.ProseMirror');
      if (!editorElement) return;
      
      const canvas = await html2canvas(editorElement as HTMLElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('documento.pdf');
      toast({
        title: "PDF Exportado!",
        description: "O documento foi salvo como PDF.",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar o PDF.",
        variant: "destructive",
      });
    }
  };

  const handleInsertImage = () => {
    if (editor && imageUrl) {
      // Insert image as HTML
      editor.chain().focus().insertContent(`<img src="${imageUrl}" alt="" />`).run();
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  const handleSave = () => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editor de Documento</DialogTitle>
          </DialogHeader>
          
          {/* Barra de ferramentas */}
          <div className="border rounded-lg p-2 flex flex-wrap gap-1 bg-gray-50">
            {/* Formatação de texto */}
            <div className="flex gap-1 pr-2 border-r">
              <Button
                variant={editor?.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive('underline') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className="h-8 w-8 p-0"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive('highlight') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleHighlight().run()}
                className="h-8 w-8 p-0"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
            </div>

            {/* Tipo de texto */}
            <div className="flex gap-1 px-2 border-r">
              <Select
                value={
                  editor?.isActive('heading', { level: 1 }) ? 'h1' :
                  editor?.isActive('heading', { level: 2 }) ? 'h2' :
                  editor?.isActive('heading', { level: 3 }) ? 'h3' :
                  'p'
                }
                onValueChange={(value) => {
                  if (value === 'p') {
                    editor?.chain().focus().setParagraph().run();
                  } else if (value === 'h1') {
                    editor?.chain().focus().toggleHeading({ level: 1 }).run();
                  } else if (value === 'h2') {
                    editor?.chain().focus().toggleHeading({ level: 2 }).run();
                  } else if (value === 'h3') {
                    editor?.chain().focus().toggleHeading({ level: 3 }).run();
                  }
                }}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p">Parágrafo</SelectItem>
                  <SelectItem value="h1">Título 1</SelectItem>
                  <SelectItem value="h2">Título 2</SelectItem>
                  <SelectItem value="h3">Título 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alinhamento */}
            <div className="flex gap-1 px-2 border-r">
              <Button
                variant={editor?.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                className="h-8 w-8 p-0"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </div>

            {/* Listas */}
            <div className="flex gap-1 px-2 border-r">
              <Button
                variant={editor?.isActive('bulletList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={editor?.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Inserir imagem */}
            <div className="flex gap-1 px-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(true)}
                className="h-8 px-2"
              >
                <Image className="h-4 w-4 mr-1" />
                Imagem
              </Button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 border rounded-lg overflow-auto bg-white">
            <EditorContent editor={editor} />
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para inserir imagem */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="image-url">URL da Imagem</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInsertImage}>
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}