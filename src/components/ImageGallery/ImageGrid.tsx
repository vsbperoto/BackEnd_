import React, { useState } from "react";
import { CloudinaryImage } from "../../types";
import { CloudinaryService } from "../../services/cloudinaryService";
import {
  Eye,
  Download,
  Trash2,
  CreditCard as Edit,
  Calendar,
  HardDrive,
} from "lucide-react";

interface ImageGridProps {
  images: CloudinaryImage[];
  onImageDelete?: (publicId: string) => void;
  onImageEdit?: (image: CloudinaryImage) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  onImageDelete,
  onImageEdit,
}) => {
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(
    null,
  );
  const cloudinaryService = CloudinaryService.getInstance();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (image: CloudinaryImage) => {
    const link = document.createElement("a");
    link.href = image.secure_url;
    link.download = `${image.public_id}.${image.format}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-boho-brown/20 bg-boho-warm/20 text-boho-brown/70">
          <Eye className="h-16 w-16" />
        </div>
        <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
          Все още няма изображения
        </h3>
        <p className="max-w-md text-sm text-boho-rust/90 font-boho">
          Качете някои изображения, за да започнете с вашата галерия.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {images.map((image) => (
          <article
            key={image.public_id}
            className="group relative overflow-hidden rounded-[var(--ever-radius-lg)] border border-boho-brown/10 bg-boho-cream/70 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={cloudinaryService.getOptimizedUrl(image.public_id, {
                  width: 400,
                  height: 300,
                  crop: "fill",
                  quality: "auto",
                })}
                alt={image.public_id}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onClick={() => setSelectedImage(image)}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-boho-brown/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-3 p-4 transition-all duration-500 group-hover:translate-y-0">
                <div className="flex items-center justify-between text-sm text-boho-cream/90">
                  <span className="inline-flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    {formatFileSize(image.bytes)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(image.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-boho-brown boho-heading">
                    {image.public_id.split("/").pop()}
                  </h3>
                  <p className="text-xs text-boho-rust/80">
                    Формат: {image.format.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedImage(image)}
                    className="rounded-full border border-boho-brown/20 bg-boho-cream/70 p-2 text-boho-brown transition-transform duration-200 hover:-translate-y-0.5 hover:border-boho-brown/40"
                    title="Преглед в пълен размер"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(image)}
                    className="rounded-full border border-boho-brown/20 bg-boho-cream/70 p-2 text-boho-brown transition-transform duration-200 hover:-translate-y-0.5 hover:border-boho-brown/40"
                    title="Изтегляне"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {onImageEdit && (
                    <button
                      onClick={() => onImageEdit(image)}
                      className="rounded-full border border-boho-sage/30 bg-boho-sage/20 p-2 text-boho-sage transition-transform duration-200 hover:-translate-y-0.5 hover:border-boho-sage/50"
                      title="Редактиране"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {onImageDelete && (
                    <button
                      onClick={() => onImageDelete(image.public_id)}
                      className="rounded-full border border-boho-terracotta/30 bg-boho-terracotta/20 p-2 text-boho-terracotta transition-transform duration-200 hover:-translate-y-0.5 hover:border-boho-terracotta/50"
                      title="Изтриване"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-boho-brown/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] w-full max-w-5xl">
            <img
              src={selectedImage.secure_url}
              alt={selectedImage.public_id}
              className="h-full w-full max-h-[90vh] rounded-[var(--ever-radius-lg)] border border-boho-cream/30 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 rounded-full border border-boho-cream/30 bg-boho-cream/80 p-3 text-boho-brown transition-transform duration-200 hover:-translate-y-0.5"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
