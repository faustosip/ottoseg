"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImportCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
  total: number;
}

export function ImportCsvDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Solo se permiten archivos CSV");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/subscribers/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al importar");
      }

      setResult(data);
      toast.success(`${data.created} suscriptores importados`);

      if (data.created > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error((error as Error).message || "Error al importar CSV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Suscriptores</DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los emails de los suscriptores. El archivo
            debe tener columnas: email, name (opcional).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* File upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                file
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-green-600" />
                <p className="font-medium text-green-700">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-gray-400" />
                <p className="text-gray-600">
                  Haz clic para seleccionar un archivo CSV
                </p>
                <p className="text-sm text-gray-400">o arrastra y suelta aquí</p>
              </div>
            )}
          </div>

          {/* CSV format help */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Formato esperado:
            </p>
            <pre className="text-xs text-gray-600 bg-white p-2 rounded border">
              email,name{"\n"}
              correo@ejemplo.com,Juan Pérez{"\n"}
              otro@email.com,María García
            </pre>
          </div>

          {/* Import result */}
          {result && (
            <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Importación completada</span>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-green-700">
                  ✓ {result.created} suscriptores creados
                </p>
                {result.skipped > 0 && (
                  <p className="text-yellow-700">
                    ⚠ {result.skipped} duplicados omitidos
                  </p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {result.errors.length} errores:
                    </p>
                    <ul className="text-xs text-red-600 list-disc list-inside mt-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...y {result.errors.length - 5} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>
          {!result && (
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
