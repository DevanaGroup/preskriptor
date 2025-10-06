import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Image, Loader2, X, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OCRResult {
  text: string;
  confidence: number;
  fileName: string;
  fileType: string;
}

interface FileUploadOCRProps {
  onTextExtracted: (text: string, fileName: string, attachmentMeta?: any) => void;
  disabled?: boolean;
}

export const FileUploadOCR: React.FC<FileUploadOCRProps> = ({ 
  onTextExtracted, 
  disabled = false 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/bmp', 'image/webp', 'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Use apenas imagens (JPEG, PNG, GIF, BMP, WebP) ou arquivos PDF.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ocr/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data) {
        const ocrData = result.data as OCRResult;
        setOcrResult(ocrData);
        
        // Verificar se é uma resposta genérica (erro) ou texto real extraído
        const isGenericResponse = ocrData.text.includes('📄 Arquivo PDF detectado') || 
                                 ocrData.text.includes('⚠️ Para melhor extração') ||
                                 ocrData.text.includes('Erro no processamento');

        if (isGenericResponse) {
          toast({
            title: "Processamento limitado",
            description: "Não foi possível extrair texto automaticamente. Tente converter o PDF para imagem.",
            variant: "destructive",
          });
        } else {
          // Texto real extraído - enviar como attachment para o chat silenciosamente
          // Criar blob do arquivo original para download
          const fileBlob = new Blob([file], { type: file.type });
          const blobUrl = URL.createObjectURL(fileBlob);

          // Preparar formatação do texto
          const cleanedText = ocrData.text
            .replace(/\n/g, '\n\n')
            .replace(/\n\n\n+/g, '\n\n');
          
          // Enviar como attachment especial com metadata do arquivo
          console.log('🚀 Enviando attachment OCR:', {
            fileName: ocrData.fileName,
            fileType: ocrData.fileType,
            isImage: ocrData.fileType.startsWith('image/'),
            isPdf: ocrData.fileType === 'application/pdf'
          });
          
          onTextExtracted(cleanedText, ocrData.fileName, {
            type: 'ocr_attachment',
            fileName: ocrData.fileName,
            fileType: ocrData.fileType,
            blobUrl: blobUrl,
            isImage: ocrData.fileType.startsWith('image/'),
            isPdf: ocrData.fileType === 'application/pdf'
          });
        }
      } else {
        throw new Error(result.message || 'Erro ao processar arquivo');
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no processamento",
        description: error.message || "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const clearResult = () => {
    setOcrResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Área de upload */}
      <Card 
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : disabled || isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary hover:bg-primary/5'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={openFileDialog}
      >
        <CardContent className="p-4 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-600">Processando arquivo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Clique ou arraste um arquivo aqui
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Imagens (JPEG, PNG, GIF, BMP, WebP) ou PDF • Máx. 10MB
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultado do OCR */}
      {ocrResult && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {ocrResult.fileType.startsWith('image/') ? (
                  <Image className="h-4 w-4 text-green-600" />
                ) : (
                  <FileText className="h-4 w-4 text-green-600" />
                )}
                <span className="text-sm font-medium text-green-800">
                  {ocrResult.fileName}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearResult}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {showPreview && (
              <Alert className="mt-2">
                <AlertDescription className="text-xs">
                  <strong>Texto extraído:</strong>
                  <div className="mt-1 p-2 bg-white rounded text-gray-700 max-h-32 overflow-y-auto">
                    {ocrResult.text || 'Nenhum texto detectado'}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-green-600 mt-2">
              ✓ Texto extraído e adicionado à consulta
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};