import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 5 * 1024 * 1024;

export function DocumentDropzone({
  onFile,
  label = "Arraste o PDF aqui ou clique para selecionar",
  hint = "Tamanho máximo: 5MB. Apenas arquivos .pdf.",
}: {
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
}) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((accepted: File[], rejections: FileRejection[]) => {
    if (rejections.length) {
      const r = rejections[0];
      if (r.errors.some((e) => e.code === "file-too-large")) {
        toast.error("Tamanho máximo excedido (5MB).");
      } else {
        toast.error("Arquivo inválido. Apenas PDF é permitido.");
      }
      return;
    }
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    onFile(f);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: MAX_BYTES,
  });

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          type="button"
          onClick={() => setFile(null)}
          className="text-muted-foreground hover:text-foreground rounded-md p-1.5 hover:bg-muted"
          aria-label="Remover arquivo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
