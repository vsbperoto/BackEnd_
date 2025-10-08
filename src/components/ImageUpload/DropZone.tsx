import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image, X, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { CloudinaryService } from "../../services/cloudinaryService";
import { ImageProcessor, ProcessingResult } from "../../utils/imageProcessor";
import { CloudinaryImage } from "../../types";

interface DropZoneProps {
  onUploadComplete: (images: CloudinaryImage[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "processing" | "uploading" | "completed" | "error";
  result?: CloudinaryImage;
  error?: string;
  processingResult?: ProcessingResult;
}

export const DropZone: React.FC<DropZoneProps> = ({ onUploadComplete }) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const cloudinaryService = CloudinaryService.getInstance();
  const imageProcessor = ImageProcessor.getInstance();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "processing" as const,
      }));

      setUploadingFiles(newFiles);

      const uploadPromises = newFiles.map(async (uploadingFile, index) => {
        try {
          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? { ...item, status: "processing", progress: 25 }
                : item,
            ),
          );

          const processingResult = await imageProcessor.processImage(
            uploadingFile.file,
            {
              maxSizeBytes: 10 * 1024 * 1024,
              maxWidth: 4000,
              maxHeight: 4000,
              quality: 0.9,
              format: "jpeg",
            },
          );

          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    status: "uploading",
                    progress: 55,
                    processingResult,
                  }
                : item,
            ),
          );

          const result = await cloudinaryService.uploadImage(
            processingResult.file,
          );

          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    progress: 100,
                    status: result.success ? "completed" : "error",
                    result: result.data,
                    error: result.error,
                  }
                : item,
            ),
          );

          return result.data;
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? {
                    ...item,
                    status: "error",
                    error: "Upload failed",
                  }
                : item,
            ),
          );
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(Boolean) as CloudinaryImage[];

      if (successfulUploads.length > 0) {
        onUploadComplete(successfulUploads);
      }

      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    },
    [cloudinaryService, imageProcessor, onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: true,
    maxSize: 100 * 1024 * 1024,
  });

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-8">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-[var(--ever-radius-xl)] border border-dashed border-boho-brown/25 bg-boho-cream/60 p-10 text-center shadow-lg transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-boho-terracotta/40 ${
          isDragActive
            ? "border-boho-sage bg-boho-sage/10 shadow-xl"
            : "hover:border-boho-sage/70 hover:bg-boho-cream/80"
        }`}
      >
        <input {...getInputProps()} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(205,133,63,0.08),transparent_65%)]" />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-4">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-4 transition-all duration-300 ${
              isDragActive
                ? "border-boho-sage bg-boho-sage/20 text-boho-sage"
                : "border-boho-brown/20 bg-boho-warm/30 text-boho-brown"
            }`}
          >
            <Upload className="h-11 w-11" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold text-boho-brown boho-heading">
              {isDragActive
                ? "Пуснете изображенията тук"
                : "Плъзнете и пуснете за качване"}
            </p>
            <p className="text-sm text-boho-rust/90 font-boho">
              Кликнете или пуснете файловете си, за да ги оптимизирате и качите
              автоматично.
            </p>
            <p className="text-xs text-boho-brown/70">
              Поддържа JPEG, PNG, GIF, WebP (до 100MB). Изображенията се
              оптимизират до 10MB без загуба на качество.
            </p>
          </div>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="ever-section-title">Прогрес</span>
              <h3 className="mt-2 text-2xl font-semibold text-boho-brown boho-heading">
                Обработка и качване
              </h3>
            </div>
            <span className="ever-chip">{uploadingFiles.length} файла</span>
          </div>

          <div className="space-y-4">
            {uploadingFiles.map((uploadingFile, index) => (
              <div key={index} className="boho-card flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-[var(--ever-radius-sm)] border border-boho-brown/15 ${
                        uploadingFile.status === "processing"
                          ? "bg-boho-sage/20 text-boho-sage"
                          : "bg-boho-warm/20 text-boho-brown"
                      }`}
                    >
                      {uploadingFile.status === "processing" ? (
                        <Zap className="h-6 w-6 animate-pulse" />
                      ) : (
                        <Image className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <p className="truncate text-sm font-medium text-boho-brown font-boho">
                        {uploadingFile.file.name}
                      </p>
                      <div className="text-xs text-boho-rust/90 space-y-1">
                        <p>
                          Оригинал:{" "}
                          {ImageProcessor.formatFileSize(
                            uploadingFile.file.size,
                          )}
                        </p>
                        {uploadingFile.processingResult && (
                          <p className="text-boho-sage/80">
                            Оптимизиран:{" "}
                            {ImageProcessor.formatFileSize(
                              uploadingFile.processingResult.processedSize,
                            )}
                            (
                            {Math.round(
                              (1 -
                                uploadingFile.processingResult
                                  .compressionRatio) *
                                100,
                            )}
                            % намаление)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-start">
                    {uploadingFile.status === "completed" && (
                      <CheckCircle className="h-5 w-5 text-boho-sage" />
                    )}
                    {uploadingFile.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-boho-terracotta" />
                    )}

                    <button
                      onClick={() => removeUploadingFile(index)}
                      className="rounded-[var(--ever-radius-sm)] p-1 text-boho-brown/70 transition-colors duration-200 hover:text-boho-terracotta"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {(uploadingFile.status === "processing" ||
                  uploadingFile.status === "uploading") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-boho-brown/80">
                      <span>
                        {uploadingFile.status === "processing"
                          ? "Обработка"
                          : "Качване"}
                      </span>
                      <span>{uploadingFile.progress}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full border border-boho-brown/10 bg-boho-warm/20">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${
                          uploadingFile.status === "processing"
                            ? "from-boho-sage via-boho-dusty to-boho-cream"
                            : "from-boho-terracotta via-boho-rust to-boho-warm"
                        } transition-all duration-500`}
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadingFile.status === "error" && (
                  <p className="text-xs text-boho-terracotta font-boho">
                    {uploadingFile.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
