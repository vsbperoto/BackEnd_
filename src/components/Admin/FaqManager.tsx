import { FormEvent, useEffect, useState } from "react";
import { PlusCircle, Save, Trash2, ArrowUpDown } from "lucide-react";
import {
  fetchFaqEntries,
  createFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,
} from "../../services/faqService";
import { FaqEntry } from "../../types";
import { AdminFeedback } from "./AdminFeedback";

type FeedbackState = {
  message: string;
  variant: "success" | "error" | "info";
} | null;

interface FaqFormState {
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const initialForm: FaqFormState = {
  question: "",
  answer: "",
  display_order: 0,
  is_active: true,
};

export function FaqManager() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [form, setForm] = useState<FaqFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const data = await fetchFaqEntries();
      setFaqs(data);
    } catch (error) {
      console.error("Failed to load FAQs", error);
      setFeedback({
        message: "Неуспешно зареждане на въпросите. Опитайте отново по-късно.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const previousFaqs = faqs;
    if (editingId) {
      const optimisticFaqs = faqs.map((faq) =>
        faq.id === editingId
          ? {
              ...faq,
              question: form.question,
              answer: form.answer,
              display_order: form.display_order,
              is_active: form.is_active,
              updated_at: new Date().toISOString(),
            }
          : faq,
      );
      setFaqs(optimisticFaqs);

      try {
        const updated = await updateFaqEntry(editingId, form);
        setFaqs((prev) =>
          prev.map((faq) => (faq.id === editingId ? updated : faq)),
        );
        setFeedback({ message: "Въпросът беше обновен.", variant: "success" });
      } catch (error) {
        console.error("Failed to update FAQ", error);
        setFaqs(previousFaqs);
        setFeedback({
          message: "Неуспешно обновяване на въпроса.",
          variant: "error",
        });
        return;
      }
    } else {
      const now = new Date().toISOString();
      const optimistic: FaqEntry = {
        id: `temp-${Date.now()}`,
        question: form.question,
        answer: form.answer,
        display_order: form.display_order,
        is_active: form.is_active,
        created_at: now,
        updated_at: now,
      };
      setFaqs((prev) => [...prev, optimistic]);

      try {
        const created = await createFaqEntry(form);
        setFaqs((prev) =>
          prev.map((faq) => (faq.id === optimistic.id ? created : faq)),
        );
        setFeedback({
          message: "Добавихте нов въпрос успешно.",
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to create FAQ", error);
        setFaqs(previousFaqs);
        setFeedback({
          message: "Неуспешно добавяне на въпрос.",
          variant: "error",
        });
        return;
      }
    }
    setEditingId(null);
    setForm(initialForm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Да изтрием ли този въпрос?")) return;
    const previousFaqs = faqs;
    setFaqs((prev) => prev.filter((faq) => faq.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(initialForm);
    }

    try {
      await deleteFaqEntry(id);
      setFeedback({ message: "Въпросът беше изтрит.", variant: "success" });
    } catch (error) {
      console.error("Failed to delete FAQ", error);
      setFaqs(previousFaqs);
      setFeedback({
        message: "Неуспешно изтриване на въпроса.",
        variant: "error",
      });
    }
  };

  const handleEdit = (faq: FaqEntry) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active,
    });
  };

  const handleReorder = (direction: "up" | "down", index: number) => {
    const newOrder = [...faqs];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const [item] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, item);
    const reordered = newOrder.map((faq, idx) => ({
      ...faq,
      display_order: idx,
    }));
    const previousFaqs = faqs;
    setFaqs(reordered);

    Promise.all(
      reordered.map((faq) =>
        updateFaqEntry(faq.id, {
          question: faq.question,
          answer: faq.answer,
          display_order: faq.display_order,
          is_active: faq.is_active,
        }),
      ),
    )
      .then(() => {
        setFeedback({
          message: "Подредбата беше актуализирана.",
          variant: "success",
        });
      })
      .catch((error) => {
        console.error("Failed to reorder FAQ entries", error);
        setFaqs(previousFaqs);
        setFeedback({
          message: "Неуспешно актуализиране на подредбата.",
          variant: "error",
        });
      });
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <AdminFeedback
          message={feedback.message}
          variant={feedback.variant}
          onDismiss={() => setFeedback(null)}
          autoHideMs={6000}
        />
      )}
      <div className="flex flex-col gap-2">
        <span className="ever-section-title">FAQ</span>
        <h2 className="text-3xl font-semibold text-boho-brown boho-heading">
          Често задавани въпроси
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-boho-brown boho-heading">
            {editingId ? "Редакция на въпрос" : "Нов въпрос"}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(initialForm);
              }}
              className="ever-chip"
            >
              Отмяна
            </button>
          )}
        </div>

        <div>
          <label className="ever-label">Въпрос</label>
          <input
            className="ever-input"
            value={form.question}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, question: event.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="ever-label">Отговор</label>
          <textarea
            className="ever-textarea"
            value={form.answer}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, answer: event.target.value }))
            }
            rows={4}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="ever-label">Позиция</label>
            <input
              type="number"
              className="ever-input"
              value={form.display_order}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  display_order: Number(event.target.value),
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="faq-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-boho-brown"
            />
            <label htmlFor="faq-active" className="text-sm text-boho-brown">
              Активен на сайта
            </label>
          </div>
        </div>

        <button type="submit" className="ever-button w-full">
          <Save className="h-4 w-4" />
          {editingId ? "Запази промените" : "Добави въпрос"}
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-boho-brown boho-heading">
            Списък с въпроси
          </h3>
          <button
            className="ever-chip"
            onClick={() => loadFaqs()}
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
            Презареди
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-boho-rust">Зареждане...</div>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-boho-rust">Няма добавени въпроси</p>
        ) : (
          <ul className="space-y-3">
            {faqs
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((faq, index) => (
                <li
                  key={faq.id}
                  className="space-y-2 rounded-boho border border-boho-brown/15 bg-boho-cream/70 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-boho-brown boho-heading">
                        {faq.question}
                      </p>
                      <p className="text-sm text-boho-brown/80 whitespace-pre-wrap">
                        {faq.answer}
                      </p>
                    </div>
                    <span
                      className={`ever-chip text-xs ${faq.is_active ? "bg-boho-sage/30 text-boho-brown" : "bg-boho-rust/20 text-boho-rust"}`}
                    >
                      {faq.is_active ? "Активен" : "Скрит"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-boho-rust">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" /> Позиция:{" "}
                      {faq.display_order}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        className="ever-chip"
                        onClick={() => handleEdit(faq)}
                        type="button"
                      >
                        Редакция
                      </button>
                      <button
                        className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                        onClick={() => handleDelete(faq.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex overflow-hidden rounded-boho border border-boho-brown/20">
                        <button
                          type="button"
                          className="px-2 py-1 text-xs text-boho-brown hover:bg-boho-brown/10"
                          onClick={() => handleReorder("up", index)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs text-boho-brown hover:bg-boho-brown/10"
                          onClick={() => handleReorder("down", index)}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
