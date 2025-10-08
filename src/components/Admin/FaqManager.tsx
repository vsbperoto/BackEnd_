import { FormEvent, useEffect, useState } from 'react';
import { PlusCircle, Save, Trash2, ArrowUpDown } from 'lucide-react';
import { fetchFaqEntries, createFaqEntry, updateFaqEntry, deleteFaqEntry } from '../../services/faqService';
import { FaqEntry } from '../../types';

interface FaqFormState {
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

const initialForm: FaqFormState = {
  question: '',
  answer: '',
  display_order: 0,
  is_active: true
};

export function FaqManager() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [form, setForm] = useState<FaqFormState>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    setLoading(true);
    const data = await fetchFaqEntries();
    setFaqs(data);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        const updated = await updateFaqEntry(editingId, form);
        setFaqs((prev) => prev.map((faq) => (faq.id === editingId ? updated : faq)));
      } else {
        const created = await createFaqEntry(form);
        setFaqs((prev) => [...prev, created]);
      }
      setEditingId(null);
      setForm(initialForm);
    } catch (error) {
      console.error('Failed to save FAQ', error);
      alert('Неуспешно запазване на въпроса');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Да изтрием ли този въпрос?')) return;
    try {
      await deleteFaqEntry(id);
      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
    } catch (error) {
      console.error('Failed to delete FAQ', error);
      alert('Неуспешно изтриване на въпроса');
    }
  };

  const handleEdit = (faq: FaqEntry) => {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      display_order: faq.display_order,
      is_active: faq.is_active
    });
  };

  const handleReorder = (direction: 'up' | 'down', index: number) => {
    const newOrder = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const [item] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, item);
    const reordered = newOrder.map((faq, idx) => ({ ...faq, display_order: idx }));
    setFaqs(reordered);
    reordered.forEach((faq) => {
      updateFaqEntry(faq.id, {
        question: faq.question,
        answer: faq.answer,
        display_order: faq.display_order,
        is_active: faq.is_active
      });
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <span className="ever-section-title">FAQ</span>
        <h2 className="text-3xl font-semibold text-boho-brown boho-heading">Често задавани въпроси</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-boho-brown boho-heading">
            {editingId ? 'Редакция на въпрос' : 'Нов въпрос'}
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
            onChange={(event) => setForm((prev) => ({ ...prev, question: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="ever-label">Отговор</label>
          <textarea
            className="ever-textarea"
            value={form.answer}
            onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
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
              onChange={(event) => setForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="faq-active"
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-boho-brown"
            />
            <label htmlFor="faq-active" className="text-sm text-boho-brown">
              Активен на сайта
            </label>
          </div>
        </div>

        <button type="submit" className="ever-button w-full">
          <Save className="h-4 w-4" />
          {editingId ? 'Запази промените' : 'Добави въпрос'}
        </button>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-boho-brown boho-heading">Списък с въпроси</h3>
          <button className="ever-chip" onClick={() => loadFaqs()} type="button">
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
                      <p className="font-semibold text-boho-brown boho-heading">{faq.question}</p>
                      <p className="text-sm text-boho-brown/80 whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                    <span className={`ever-chip text-xs ${faq.is_active ? 'bg-boho-sage/30 text-boho-brown' : 'bg-boho-rust/20 text-boho-rust'}`}>
                      {faq.is_active ? 'Активен' : 'Скрит'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-boho-rust">
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-3 w-3" /> Позиция: {faq.display_order}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="ever-chip" onClick={() => handleEdit(faq)} type="button">
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
                          onClick={() => handleReorder('up', index)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 text-xs text-boho-brown hover:bg-boho-brown/10"
                          onClick={() => handleReorder('down', index)}
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
