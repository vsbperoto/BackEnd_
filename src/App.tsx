import { useState, useEffect } from "react";
import { supabaseClient as supabase } from "./lib/supabaseClient";
import { LoginScreen } from "./components/Auth/LoginScreen";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import { DropZone } from "./components/ImageUpload/DropZone";
import { ImageGrid } from "./components/ImageGallery/ImageGrid";
import { StatsCard } from "./components/Dashboard/StatsCard";
import { GalleryList } from "./components/Galleries/GalleryList";
import { GalleryForm } from "./components/Galleries/GalleryForm";
import ClientGalleryManagement from "./components/Admin/ClientGalleryManagement";
import PartnerManagement from "./components/Admin/PartnerManagement";
import InquiryManagement from "./components/Admin/InquiryManagement";
import ContactManagement from "./components/Admin/ContactManagement";
import { SupabaseFunctionCaller } from "./components/SupabaseFunctionCaller";
import { CloudinaryImage, Gallery } from "./types";
import { getGalleries } from "./services/galleryService";
import { Images, Upload, Clock, FileText, FolderOpen } from "lucide-react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadGalleries();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    checkAuth();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const loadGalleries = async () => {
    try {
      const data = await getGalleries();
      setGalleries(data);
    } catch (error) {
      console.error(
        "Failed to load galleries - check Supabase connection:",
        error,
      );
      setGalleries([]);
    }
  };

  const handleUploadComplete = (newImages: CloudinaryImage[]) => {
    setImages((prev) => [...newImages, ...prev]);
    setActiveSection("images");
  };

  const handleImageDelete = (publicId: string) => {
    setImages((prev) => prev.filter((img) => img.public_id !== publicId));
  };

  const handleCreateGallery = () => {
    setEditingGallery(null);
    setShowGalleryForm(true);
  };

  const handleEditGallery = (gallery: Gallery) => {
    setEditingGallery(gallery);
    setShowGalleryForm(true);
  };

  const handleSaveGallery = (gallery: Gallery) => {
    if (editingGallery) {
      setGalleries((prev) =>
        prev.map((g) => (g.id === gallery.id ? gallery : g)),
      );
    } else {
      setGalleries((prev) => [gallery, ...prev]);
    }
    setShowGalleryForm(false);
    setEditingGallery(null);
  };

  const handleCancelGalleryForm = () => {
    setShowGalleryForm(false);
    setEditingGallery(null);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-10">
            <section className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="ever-section-title">Основни показатели</span>
                <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                  Вашият творчески преглед
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatsCard
                  title="Общо изображения"
                  value={images.length}
                  icon={Images}
                  trend={{ value: 12, isPositive: true }}
                  color="sage"
                />
                <StatsCard
                  title="Портфолио галерии"
                  value={galleries.length}
                  icon={FolderOpen}
                  trend={{ value: 5, isPositive: true }}
                  color="dusty"
                />
                <StatsCard
                  title="Използвано място"
                  value="2.4 GB"
                  icon={FolderOpen}
                  trend={{ value: 8, isPositive: true }}
                  color="warm"
                />
                <StatsCard
                  title="Месечни прегледи"
                  value="45.2K"
                  icon={FolderOpen}
                  trend={{ value: 15, isPositive: true }}
                  color="terracotta"
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
              <div className="boho-card p-6 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="ever-section-title">
                      Последни действия
                    </span>
                    <h4 className="mt-3 text-2xl font-semibold text-boho-brown boho-heading">
                      Пулсът на студиото
                    </h4>
                  </div>
                  <div className="ever-chip">
                    <Clock className="h-4 w-4" />
                    Обновено преди 5 минути
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  {images.slice(0, 5).map((image) => (
                    <article
                      key={image.public_id}
                      className="group flex items-center gap-4 rounded-[var(--ever-radius-md)] border border-boho-brown/10 bg-boho-cream/70 p-3 transition-all duration-300 hover:border-boho-brown/30 hover:shadow-md"
                    >
                      <div className="relative h-14 w-14 overflow-hidden rounded-[var(--ever-radius-md)] border border-boho-brown/20">
                        <img
                          src={`https://res.cloudinary.com/demo/image/upload/w_64,h_64,c_fill/${image.public_id}`}
                          alt={image.public_id}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-boho-brown font-boho">
                          Качено ново изображение
                        </p>
                        <p className="text-xs text-boho-rust">
                          {image.public_id} •{" "}
                          {new Date(image.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <FolderOpen className="h-5 w-5 text-boho-warm" />
                    </article>
                  ))}

                  {images.length === 0 && (
                    <div className="rounded-[var(--ever-radius-lg)] border border-dashed border-boho-brown/30 bg-boho-cream/60 py-12 text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12 text-boho-brown/40" />
                      <p className="font-boho text-boho-rust">
                        Няма скорошна активност. Качете някои изображения, за да
                        започнете!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="boho-card flex flex-col gap-6 p-6 lg:col-span-2">
                <div>
                  <span className="ever-section-title">Инструменти</span>
                  <h4 className="mt-3 text-2xl font-semibold text-boho-brown boho-heading">
                    Supabase функции
                  </h4>
                  <p className="mt-2 text-sm text-boho-rust">
                    Тествайте директно от таблото вашите функции и интеграции.
                  </p>
                </div>
                <SupabaseFunctionCaller />
              </div>
            </section>
          </div>
        );

      case "portfolio-galleries":
        if (showGalleryForm) {
          return (
            <GalleryForm
              gallery={editingGallery || undefined}
              onSave={handleSaveGallery}
              onCancel={handleCancelGalleryForm}
              availableImages={images}
            />
          );
        }

        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Портфолио</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Галерии и истории
              </h3>
            </div>
            <GalleryList
              onCreateGallery={handleCreateGallery}
              onEditGallery={handleEditGallery}
            />
          </div>
        );

      case "client-galleries":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Клиентски преживявания</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Управление на клиентски галерии
              </h3>
            </div>
            <div className="boho-card p-6">
              <ClientGalleryManagement />
            </div>
          </div>
        );

      case "partners":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Вдъхновяващи партньори</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Мрежа от сътрудници
              </h3>
            </div>
            <div className="boho-card p-6">
              <PartnerManagement />
            </div>
          </div>
        );

      case "inquiries":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Запитвания</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Контакт с нови партньори
              </h3>
            </div>
            <div className="boho-card p-6">
              <InquiryManagement />
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Съобщения</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Комуникация от сайта
              </h3>
            </div>
            <div className="boho-card p-6">
              <ContactManagement />
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <span className="ever-section-title">Нови ресурси</span>
              <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                Качване на изображения
              </h3>
              <p className="text-sm text-boho-rust max-w-2xl">
                Добавете нови изображения към вашата галерия. Всички файлове се
                оптимизират автоматично и се съхраняват защитено в Cloudinary.
              </p>
            </div>
            <DropZone onUploadComplete={handleUploadComplete} />
          </div>
        );

      case "images":
        return (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <span className="ever-section-title">Галерия</span>
                <h3 className="text-3xl font-semibold text-boho-brown boho-heading">
                  Вашата визуална колекция
                </h3>
                <p className="text-boho-rust font-boho">
                  {images.length}{" "}
                  {images.length === 1 ? "изображение" : "изображения"} във
                  вашата галерия
                </p>
              </div>
              <button
                onClick={() => setActiveSection("upload")}
                className="boho-button inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-boho-cream"
              >
                <Upload className="h-4 w-4" />
                <span>Качване на изображения</span>
              </button>
            </div>

            <div className="boho-card p-6">
              <ImageGrid images={images} onImageDelete={handleImageDelete} />
            </div>
          </div>
        );

      default:
        return (
          <div className="boho-card p-12 text-center">
            <h3 className="mb-3 text-3xl font-semibold text-boho-brown boho-heading">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h3>
            <p className="text-boho-rust font-boho">
              Тази секция скоро ще бъде готова. Очаквайте повече функции!
            </p>
          </div>
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case "dashboard":
        return {
          title: "Табло",
          subtitle: "Преглед на вашата система за управление на съдържанието",
        };
      case "portfolio-galleries":
        return showGalleryForm
          ? {
              title: "Управление на галерии",
              subtitle: editingGallery
                ? "Редактиране на галерия"
                : "Създаване на нова галерия",
            }
          : {
              title: "Портфолио галерии",
              subtitle: "Управлявайте вашите портфолио галерии",
            };
      case "client-galleries":
        return {
          title: "Клиентски Галерии",
          subtitle: "Управлявайте вашите сватбени галерии за клиенти",
        };
      case "partners":
        return {
          title: "Партньори",
          subtitle: "Управлявайте вашите партньори и доставчици",
        };
      case "inquiries":
        return {
          title: "Запитвания за Партньорство",
          subtitle: "Преглеждайте и управлявайте заявления за партньорство",
        };
      case "contacts":
        return {
          title: "Контактни Съобщения",
          subtitle: "Преглеждайте съобщени от контактната форма",
        };
      case "upload":
        return {
          title: "Качване на изображения",
          subtitle: "Добавете нови изображения към вашата галерия",
        };
      case "images":
        return {
          title: "Галерия с изображения",
          subtitle: "Управлявайте и организирайте вашите изображения",
        };
      default:
        return {
          title: activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
          subtitle: "Управлявайте вашето съдържание",
        };
    }
  };

  const sectionInfo = getSectionTitle();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-boho-cream via-boho-sand to-boho-warm boho-pattern">
        <div className="flex flex-col items-center gap-4 text-boho-brown">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-boho-brown/20 border-t-boho-terracotta"></div>
          <p className="font-boho text-lg">
            Зареждане на вашето творческо пространство...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-boho-cream/90 via-boho-sand/80 to-boho-warm/60">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="boho-pattern h-full w-full"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden lg:flex lg:w-[300px] xl:w-[320px]">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={(section) => {
              setActiveSection(section);
              closeSidebar();
            }}
            userEmail={user?.email}
          />
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div
              className="absolute inset-0 bg-boho-brown/40 backdrop-blur-sm"
              onClick={closeSidebar}
            />
            <div className="relative z-50 h-full w-80 max-w-[85vw]">
              <Sidebar
                activeSection={activeSection}
                onSectionChange={(section) => {
                  setActiveSection(section);
                  closeSidebar();
                }}
                userEmail={user?.email}
                className="h-full"
              />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            title={sectionInfo.title}
            subtitle={sectionInfo.subtitle}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />

          <main className="ever-scrollbar flex-1 overflow-y-auto px-6 py-8 lg:px-12 lg:py-10">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
