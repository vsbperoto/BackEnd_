import { useState, useEffect } from "react";
import { X, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { ClientGallery, ClientGalleryStats, ClientImage } from "../../types";
import {
  getGalleryImages,
  createImage,
  deleteImage,
} from "../../services/clientImageService";
import { CloudinaryService } from "../../services/cloudinaryService";
import { getGalleryStats } from "../../services/clientGalleryService";

interface GalleryDetailsModalProps {
  gallery: ClientGallery;
  onClose: () => void;
  onUpdate: () => void;
}

export default function GalleryDetailsModal({
  gallery,
  onClose,
  onUpdate,
}: GalleryDetailsModalProps) {
  const [images, setImages] = useState<ClientImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<ClientGalleryStats | null>(null);
  const cloudinaryService = CloudinaryService.getInstance();

  useEffect(() => {
    loadImages();
    loadStats();
  }, [gallery.id]);

  const loadImages = async () => {
    const data = await getGalleryImages(gallery.id);
    setImages(data);
  };

  const loadStats = async () => {
    const data = await getGalleryStats(gallery.id);
    setStats(data);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const startingIndex = images.length;

    try {
      const uploadResults = await Promise.all(
        Array.from(files).map(async (file, index) => {
          try {
            const upload = await cloudinaryService.uploadImage(file);

            if (!upload.success || !upload.data) {
              throw new Error(upload.error || "Cloudinary upload failed");
            }

            const { secure_url: secureUrl, public_id: publicId } = upload.data;
            const thumbnailUrl = cloudinaryService.getOptimizedUrl(publicId, {
              width: 400,
              height: 400,
              crop: "fill",
              quality: "auto",
            });

            const savedImage = await createImage({
              gallery_id: gallery.id,
              image_url: secureUrl,
              thumbnail_url: thumbnailUrl,
              title: file.name,
              public_id: publicId,
              order_index: startingIndex + index,
            });

            return savedImage;
          } catch (error) {
            console.error(
              `[FAILURE] Failed to process file ${file.name}:`,
              error,
            );
            return null;
          }
        }),
      );

      const successfulImages = uploadResults.filter(
        (image): image is ClientImage => Boolean(image),
      );
      const failedCount = uploadResults.length - successfulImages.length;

      if (successfulImages.length > 0) {
        setImages((prev) => {
          const combined = [...prev, ...successfulImages];
          return combined.sort(
            (a, b) => (a.order_index || 0) - (b.order_index || 0),
          );
        });
        onUpdate();
      }

      if (failedCount > 0) {
        alert(
          `${failedCount} image${failedCount > 1 ? "s" : ""} failed to upload. Please try again.`,
        );
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteImage = async (image: ClientImage) => {
    if (!image.public_id) {
      alert(
        "Unable to delete this image because its Cloudinary ID is missing. Please refresh and try again.",
      );
      return;
    }

    if (confirm("Delete this image?")) {
      const previousImages = images;
      setImages((current) => current.filter((item) => item.id !== image.id));

      try {
        await deleteImage({ imageId: image.id, publicId: image.public_id });
        onUpdate();
      } catch (error) {
        console.error("Error deleting image:", error);
        setImages(previousImages);
        alert(
          error instanceof Error ? error.message : "Failed to delete image",
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">
              {gallery.bride_name} & {gallery.groom_name}
            </h2>
            <p className="text-neutral-600 text-sm mt-1">
              {gallery.client_email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {stats && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Total Views</div>
                <div className="text-2xl font-semibold text-blue-900">
                  {stats.totalViews}
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Downloads</div>
                <div className="text-2xl font-semibold text-green-900">
                  {stats.totalDownloads}
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-700 mb-1">Favorites</div>
                <div className="text-2xl font-semibold text-purple-900">
                  {stats.totalFavorites}
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm text-orange-700 mb-1">Days Left</div>
                <div className="text-2xl font-semibold text-orange-900">
                  {stats.daysUntilExpiration}
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">
                Gallery Images ({images.length})
              </h3>
              <label className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>{uploading ? "Uploading..." : "Upload Images"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {images.length === 0 ? (
              <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-300">
                <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                <p className="text-neutral-600 mb-2">No images uploaded yet</p>
                <p className="text-sm text-neutral-500">
                  Click the Upload button to add images
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden"
                  >
                    <img
                      src={image.thumbnail_url || image.image_url}
                      alt={image.title || "Gallery image"}
                      className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40" />
                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-white/80 text-red-600 shadow-md opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 hover:bg-white"
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="mt-2 text-xs text-neutral-600 truncate">
                      {image.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Gallery Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Slug:</span>{" "}
                <code className="bg-neutral-100 px-2 py-1 rounded">
                  {gallery.gallery_slug}
                </code>
              </div>
              <div>
                <span className="text-neutral-600">Access Code:</span>{" "}
                <code className="bg-neutral-100 px-2 py-1 rounded font-mono">
                  {gallery.access_code}
                </code>
              </div>
              <div>
                <span className="text-neutral-600">Status:</span>{" "}
                <span className="font-semibold">{gallery.status}</span>
              </div>
              <div>
                <span className="text-neutral-600">Wedding Date:</span>{" "}
                {new Date(gallery.wedding_date || "").toLocaleDateString()}
              </div>
              <div>
                <span className="text-neutral-600">Expires:</span>{" "}
                {new Date(gallery.expiration_date).toLocaleDateString()}
              </div>
              <div>
                <span className="text-neutral-600">Downloads:</span>{" "}
                {gallery.allow_downloads ? "Enabled" : "Disabled"}
              </div>
              <div>
                <span className="text-neutral-600">Created:</span>{" "}
                {new Date(gallery.created_at).toLocaleDateString()}
              </div>
            </div>
            {gallery.welcome_message && (
              <div className="mt-4 bg-neutral-50 p-4 rounded-lg">
                <div className="text-sm text-neutral-600 mb-1">
                  Welcome Message:
                </div>
                <div className="text-neutral-800">
                  {gallery.welcome_message}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
