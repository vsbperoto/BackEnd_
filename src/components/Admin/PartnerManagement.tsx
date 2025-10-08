import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  getAllPartners,
  deletePartner,
  createPartner,
  updatePartner,
} from "../../services/partnerService";
import { Partner } from "../../types";
import { AdminFeedback } from "./AdminFeedback";

type FeedbackState = {
  message: string;
  variant: "success" | "error" | "info";
} | null;

interface PartnerFormState {
  name: string;
  category: string;
  description: string;
  logo_url: string;
  website: string;
  email: string;
  phone: string;
  featured: boolean;
  display_order: number;
  is_active: boolean;
}

const emptyPartnerForm: PartnerFormState = {
  name: "",
  category: "",
  description: "",
  logo_url: "",
  website: "",
  email: "",
  phone: "",
  featured: false,
  display_order: 0,
  is_active: true,
};

export default function PartnerManagement() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PartnerFormState>(emptyPartnerForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await getAllPartners();
      setPartners(data);
    } catch (error) {
      console.error("Error fetching partners:", error);
      setFeedback({
        message: "Неуспешно зареждане на партньорите. Опитайте отново.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this partner?")) {
      const previousPartners = partners;
      setPartners((prev) => prev.filter((partner) => partner.id !== id));
      try {
        await deletePartner(id);
        setFeedback({ message: "Партньорът беше изтрит.", variant: "success" });
      } catch (error) {
        console.error("Error deleting partner:", error);
        setPartners(previousPartners);
        setFeedback({
          message: "Неуспешно изтриване на партньора.",
          variant: "error",
        });
      }
    }
  };

  const filteredPartners = useMemo(
    () =>
      partners.filter((partner) =>
        `${partner.name} ${partner.category}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
      ),
    [partners, searchTerm],
  );

  const handleCreateClick = () => {
    setFormOpen(true);
    setEditingId(null);
    setForm(emptyPartnerForm);
  };

  const handleEdit = (partner: Partner) => {
    setFormOpen(true);
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      category: partner.category,
      description: partner.description ?? "",
      logo_url: partner.logo_url ?? "",
      website: partner.website ?? "",
      email: partner.email ?? "",
      phone: partner.phone ?? "",
      featured: Boolean(partner.featured),
      display_order: partner.display_order ?? 0,
      is_active: partner.is_active ?? true,
    });
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyPartnerForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description.trim() || undefined,
      logo_url: form.logo_url.trim() || undefined,
      website: form.website.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      featured: form.featured,
      display_order: form.display_order,
      is_active: form.is_active,
    };

    const previousPartners = partners;
    try {
      if (editingId) {
        const optimisticPartners = partners.map((partner) =>
          partner.id === editingId
            ? {
                ...partner,
                ...payload,
                description: payload.description ?? null,
                logo_url: payload.logo_url ?? null,
                website: payload.website ?? null,
                email: payload.email ?? null,
                phone: payload.phone ?? null,
                featured: payload.featured,
                display_order: payload.display_order,
                is_active: payload.is_active,
                updated_at: new Date().toISOString(),
              }
            : partner,
        );
        setPartners(optimisticPartners);

        try {
          const updated = await updatePartner(editingId, payload);
          setPartners((prev) =>
            prev.map((partner) =>
              partner.id === editingId ? updated : partner,
            ),
          );
          setFeedback({
            message: "Партньорът беше обновен успешно.",
            variant: "success",
          });
        } catch (error) {
          console.error("Failed to update partner", error);
          setPartners(previousPartners);
          setFeedback({
            message: "Неуспешно запазване на партньора.",
            variant: "error",
          });
          setSubmitting(false);
          return;
        }
      } else {
        const timestamp = Date.now();
        const now = new Date().toISOString();
        const optimistic: Partner = {
          id: `temp-${timestamp}`,
          name: payload.name,
          category: payload.category,
          description: payload.description ?? null,
          logo_url: payload.logo_url ?? null,
          website: payload.website ?? null,
          email: payload.email ?? null,
          phone: payload.phone ?? null,
          featured: payload.featured,
          display_order: payload.display_order,
          is_active: payload.is_active,
          created_at: now,
          updated_at: now,
        };
        setPartners((prev) => [optimistic, ...prev]);

        try {
          const created = await createPartner(payload);
          setPartners((prev) =>
            prev.map((partner) =>
              partner.id === optimistic.id ? created : partner,
            ),
          );
          setFeedback({
            message: "Добавихте нов партньор успешно.",
            variant: "success",
          });
        } catch (error) {
          console.error("Failed to create partner", error);
          setPartners(previousPartners);
          setFeedback({
            message: "Неуспешно създаване на партньор.",
            variant: "error",
          });
          setSubmitting(false);
          return;
        }
      }

      handleFormClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
          autoHideMs={6000}
        />
      )}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-boho-brown boho-heading">
            Партньори
          </h2>
          <p className="text-boho-rust mt-1 font-boho">
            Управление на директорията с партньори
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center space-x-2 boho-button text-boho-cream px-6 py-3 rounded-boho hover:shadow-lg transition-all font-boho"
        >
          <Plus className="w-5 h-5" />
          <span>Добави Партньор</span>
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-boho-brown boho-heading">
              {editingId ? "Редакция на партньор" : "Нов партньор"}
            </h3>
            <button
              type="button"
              onClick={handleFormClose}
              className="ever-chip"
            >
              Затвори
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ever-label">Име</label>
              <input
                className="ever-input"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="ever-label">Категория</label>
              <input
                className="ever-input"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, category: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="ever-label">Описание</label>
            <textarea
              className="ever-textarea"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ever-label">Лого URL</label>
              <input
                className="ever-input"
                value={form.logo_url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logo_url: event.target.value }))
                }
                placeholder="https://"
              />
            </div>
            <div>
              <label className="ever-label">Уебсайт</label>
              <input
                className="ever-input"
                value={form.website}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, website: event.target.value }))
                }
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="ever-label">Имейл</label>
              <input
                className="ever-input"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                type="email"
              />
            </div>
            <div>
              <label className="ever-label">Телефон</label>
              <input
                className="ever-input"
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="ever-label">Ред на показване</label>
              <input
                className="ever-input"
                type="number"
                value={form.display_order}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    display_order: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, featured: !prev.featured }))
              }
              className={`flex items-center gap-2 rounded-boho border border-boho-brown/20 px-4 py-2 text-sm transition ${
                form.featured
                  ? "bg-boho-sage/30 text-boho-brown"
                  : "bg-boho-cream text-boho-brown"
              }`}
            >
              {form.featured ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              <span>Избран партньор</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
              className={`flex items-center gap-2 rounded-boho border border-boho-brown/20 px-4 py-2 text-sm transition ${
                form.is_active
                  ? "bg-boho-sage/30 text-boho-brown"
                  : "bg-boho-terracotta/20 text-boho-terracotta"
              }`}
            >
              {form.is_active ? "Активен на сайта" : "Скрит партньор"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button className="ever-button" type="submit" disabled={submitting}>
              {editingId ? "Запази промените" : "Добави партньор"}
            </button>
            <button
              type="button"
              className="ever-chip"
              onClick={handleFormClose}
            >
              Отмяна
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-boho-rust" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Търсене на партньори..."
          className="w-full pl-10 pr-4 py-3 border-2 border-boho-brown border-opacity-30 rounded-boho focus:ring-2 focus:ring-boho-sage focus:border-boho-sage bg-boho-cream bg-opacity-50 text-boho-brown placeholder-boho-rust font-boho"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-boho-rust font-boho">
          Зареждане на партньори...
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="text-center py-12 text-boho-rust font-boho">
          Няма намерени партньори
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-boho-cream bg-opacity-40 border-2 border-boho-brown border-opacity-20 rounded-boho p-6 hover:shadow-lg transition-all hover:border-opacity-40"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  {partner.logo_url && (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-boho-brown font-boho">
                        {partner.name}
                      </h3>
                      {partner.featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-sm text-boho-rust mb-2 font-boho">
                      {partner.category}
                    </p>
                    {partner.description && (
                      <p className="text-sm text-boho-brown font-boho">
                        {partner.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-boho-rust font-boho">
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-boho-sage"
                        >
                          Уебсайт
                        </a>
                      )}
                      {partner.email && <span>{partner.email}</span>}
                      {partner.phone && <span>{partner.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(partner)}
                    className="p-2 text-boho-sage hover:bg-boho-sage hover:bg-opacity-20 rounded-boho transition-all"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="p-2 text-boho-terracotta hover:bg-boho-terracotta hover:bg-opacity-20 rounded-boho transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
