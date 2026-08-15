import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../../components/ui/Button';

export interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  selectedFile?: File | null;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  isProcessing = false,
  selectedFile = null,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragOver
          ? 'border-brand-500 bg-brand-500/5 ring-4 ring-brand-500/10'
          : selectedFile
          ? 'border-brand-200 bg-brand-50/50'
          : 'border-line bg-sunken hover:border-brand-300'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.rtf,.txt,.json"
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-4 transition-transform duration-200 ${
          isDragOver
            ? 'scale-110 bg-brand-600 text-white shadow-raised'
            : selectedFile
            ? 'bg-brand-50 text-brand-600'
            : 'bg-surface text-subtle shadow-xs'
        }`}
      >
        {selectedFile ? (
          <FileText className="h-8 w-8" />
        ) : (
          <UploadCloud className="h-8 w-8" />
        )}
      </div>

      {selectedFile ? (
        <div className="space-y-1">
          <p className="font-sans text-sm font-bold text-ink">
            {selectedFile.name}
          </p>
          <p className="font-mono text-xs text-muted">
            {(selectedFile.size / 1024).toFixed(1)} KB • Gotowy do parsowania
          </p>
          <div className="pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              Zmień dokument
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-sm font-bold text-ink">
            Przeciągnij i upuść plik CV tutaj
          </p>
          <p className="text-xs text-muted max-w-sm">
            Obsługujemy formaty <span className="font-mono font-bold text-ink">PDF, DOCX, RTF, TXT, JSON</span>. Wszystkie dane są parsowane lokalnie.
          </p>
          <div className="pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={UploadCloud}
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              Wybierz plik z dysku
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
