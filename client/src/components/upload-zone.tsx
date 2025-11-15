import { useCallback, useState } from "react";
import { Upload, FileArchive, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadZone({ onUpload, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .zip file containing your Discord bot.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          await onUpload(file);
          setSelectedFile(null);
        }
      }
    },
    [onUpload, toast]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
          await onUpload(file);
          setSelectedFile(null);
        }
      }
      e.target.value = '';
    },
    [onUpload, toast]
  );

  return (
    <div className="w-full">
      <Card
        className={`relative overflow-hidden transition-all duration-200 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-dashed hover-elevate"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="upload-zone"
      >
        <div className="p-8">
          <input
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
            data-testid="input-file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="mb-4 rounded-full bg-primary/10 p-6">
              {isUploading ? (
                <FileArchive className="h-10 w-10 text-primary animate-pulse" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {isUploading ? "Uploading..." : "Upload Discord Bot"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop your .zip file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Maximum file size: 50MB
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="outline"
                className="mt-6"
                data-testid="button-browse-files"
              >
                Browse Files
              </Button>
            )}
          </label>

          {isUploading && selectedFile && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileArchive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate font-medium">{selectedFile.name}</span>
                </div>
                <span className="text-muted-foreground ml-2">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" data-testid="progress-upload" />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
