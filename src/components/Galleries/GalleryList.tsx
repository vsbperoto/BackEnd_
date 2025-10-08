import React, { useState, useEffect } from "react";
import { Gallery } from "../../types";
import { getGalleries, deleteGallery } from "../../services/galleryService";
import { CloudinaryService } from "../../services/cloudinaryService";
import {
  Plus,
  CreditCard as Edit,
  Trash2,
  Calendar,
  Images,
  Eye,
  AlertCircle,
} from "lucide-react";

interface GalleryListProps {
  onCreateGallery: () => void;
  onEditGallery: (gallery: Gallery) => void;
}

export const GalleryList: React.FC<GalleryListProps> = ({
  onCreateGallery,
  onEditGallery,
}) => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cloudinaryService = CloudinaryService.getInstance();

  useEffect(() => {
    loadGalleries();
  }, []);

  const loadGalleries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGalleries();
      setGalleries(data);
    } catch (err) {
      console.error("Gallery loading error:", err);
      setError(
        "Unable to connect to database. Please check your Supabase configuration.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(`Сигурни ли сте, че искате да изтриете галерията "${title}"?`)
    ) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteGallery(id);
      setGalleries((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete gallery");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "Няма дата";
    return new Date(dateString).toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-boho-brown/20 border-t-boho-terracotta"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boho-card space-y-4 p-8 text-center">
        <AlertCircle className="mx-auto h-14 w-14 text-boho-terracotta" />
        <h3 className="text-2xl font-semibold text-boho-brown boho-heading">
          Грешка при зареждане
        </h3>
        <p className="text-sm text-boho-rust/90 font-boho">{error}</p>
        <button
          onClick={loadGalleries}
          className="boho-button inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-boho-cream"
        >
          Опитай отново
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="ever-section-title">Активни галерии</p>
          <p className="text-sm text-boho-rust/90 font-boho">
            {galleries.length} {galleries.length === 1 ? "галерия" : "галерии"}{" "}
            в портфолиото
          </p>
        </div>
        <button
          onClick={onCreateGallery}
          className="boho-button inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-boho-cream"
        >
          <Plus className="h-4 w-4" />
          <span>Нова галерия</span>
        </button>
      </div>

      {galleries.length === 0 ? (
        <div className="boho-card space-y-6 p-10 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-boho-brown/25 bg-boho-warm/20 text-boho-brown/70">
            <Images className="h-12 w-12" />
          </div>
          <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
            Все още няма галерии
          </h3>
          <p className="text-sm text-boho-rust/90 font-boho">
            Създайте първата си портфолио галерия.
          </p>
          <button
            onClick={onCreateGallery}
            className="boho-button inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-boho-cream"
          >
            <Plus className="h-5 w-5" />
            <span>Създай галерия</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {galleries.map((gallery) => (
            <article
              key={gallery.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-[var(--ever-radius-lg)] border border-boho-brown/10 bg-boho-cream/75 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="relative aspect-video overflow-hidden">
                {gallery.cover_image ? (
                  <img
                    src={cloudinaryService.getOptimizedUrl(
                      gallery.cover_image,
                      {
                        width: 600,
                        height: 360,
                        crop: "fill",
                        quality: "auto",
                      },
                    )}
                    alt={gallery.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-boho-warm/20 text-boho-brown/50">
                    <Images className="h-14 w-14" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-boho-brown/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 p-4 text-sm text-boho-cream/90 transition-all duration-500 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(gallery.event_date)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Images className="h-4 w-4" />
                    {gallery.images.length} снимки
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-boho-brown boho-heading">
                        {gallery.title}
                      </h3>
                      {gallery.subtitle && (
                        <p className="text-sm text-boho-rust/80 font-boho">
                          {gallery.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="ever-chip">
                      <Eye className="h-3.5 w-3.5" />
                      {gallery.images.length}
                    </span>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <button
                    onClick={() => onEditGallery(gallery)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--ever-radius-md)] border border-boho-sage/30 bg-boho-sage/20 px-4 py-2 text-sm font-medium text-boho-sage transition-all duration-300 hover:border-boho-sage/50"
                  >
                    <Edit className="h-4 w-4" />
                    Редактирай
                  </button>
                  <button
                    onClick={() => handleDelete(gallery.id, gallery.title)}
                    disabled={deletingId === gallery.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--ever-radius-md)] border border-boho-terracotta/30 bg-boho-terracotta/20 px-4 py-2 text-sm font-medium text-boho-terracotta transition-all duration-300 hover:border-boho-terracotta/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === gallery.id ? "Изтриване..." : "Изтрий"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
