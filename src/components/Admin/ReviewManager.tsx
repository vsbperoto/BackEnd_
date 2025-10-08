import { FormEvent, useEffect, useState } from 'react';
import { Star, Trash2, Save, CheckCircle, CircleSlash } from 'lucide-react';
import { fetchReviews, createReview, updateReview, deleteReview } from '../../services/reviewService';
import { ClientReview } from '../../types';

interface ReviewFormState {
  reviewer_name: string;
  event_name: string;
  rating: number;
  content: string;
  status: ClientReview['status'];
  display_order: number;
}

const defaultReviewForm: ReviewFormState = {
  reviewer_name: '',
  event_name: '',
  rating: 5,
  content: '',
  status: 'pending',
  display_order: 0
};

export function ReviewManager() {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [form, setForm] = useState<ReviewFormState>(defaultReviewForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const data = await fetchReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editingId) {
        const updated = await updateReview(editingId, form);
        setReviews((prev) => prev.map((review) => (review.id === editingId ? updated : review)));
      } else {
        const created = await createReview(form);
        setReviews((prev) => [...prev, created]);
      }
      setEditingId(null);
      setForm(defaultReviewForm);
    } catch (error) {
      console.error('Failed to save review', error);
      alert('Неуспешно запазване на отзива');
    }
  };

  const handleEdit = (review: ClientReview) => {
    setEditingId(review.id);
    setForm({
      reviewer_name: review.reviewer_name,
      event_name: review.event_name ?? '',
      rating: review.rating ?? 5,
      content: review.content,
      status: review.status,
      display_order: review.display_order
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Да изтрием ли този отзив?')) return;
    try {
      await deleteReview(id);
      setReviews((prev) => prev.filter((review) => review.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultReviewForm);
      }
    } catch (error) {
      console.error('Failed to delete review', error);
      alert('Неуспешно изтриване на отзива');
    }
  };

  const renderRating = (value: number) => (
    <div className="flex items-center gap-1 text-boho-terracotta">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < value ? 'text-boho-terracotta' : 'text-boho-rust/30'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <span className="ever-section-title">Отзиви</span>
        <h2 className="text-3xl font-semibold text-boho-brown boho-heading">Думи от нашите клиенти</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="ever-label">Име на клиент</label>
            <input
              className="ever-input"
              value={form.reviewer_name}
              onChange={(event) => setForm((prev) => ({ ...prev, reviewer_name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="ever-label">Събитие</label>
            <input
              className="ever-input"
              value={form.event_name}
              onChange={(event) => setForm((prev) => ({ ...prev, event_name: event.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="ever-label">Оценка</label>
            <input
              type="number"
              min={1}
              max={5}
              className="ever-input"
              value={form.rating}
              onChange={(event) => setForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
            />
          </div>
          <div>
            <label className="ever-label">Статус</label>
            <select
              className="ever-input"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ClientReview['status'] }))}
            >
              <option value="pending">Чака одобрение</option>
              <option value="approved">Одобрен</option>
              <option value="rejected">Отхвърлен</option>
            </select>
          </div>
        </div>

        <div>
          <label className="ever-label">Ред на показване</label>
          <input
            className="ever-input"
            type="number"
            value={form.display_order}
            onChange={(event) => setForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))}
          />
        </div>

        <div>
          <label className="ever-label">Отзив</label>
          <textarea
            className="ever-textarea"
            rows={4}
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="ever-button" type="submit">
            <Save className="h-4 w-4" />
            {editingId ? 'Запази промените' : 'Добави отзив'}
          </button>
          {editingId && (
            <button
              type="button"
              className="ever-chip"
              onClick={() => {
                setEditingId(null);
                setForm(defaultReviewForm);
              }}
            >
              Отмяна
            </button>
          )}
        </div>
      </form>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-boho-brown boho-heading">Всички отзиви</h3>
        {loading ? (
          <div className="text-sm text-boho-rust">Зареждане...</div>
        ) : reviews.length === 0 ? (
          <div className="text-sm text-boho-rust">Все още няма добавени отзиви</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {reviews
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((review) => (
                <article
                  key={review.id}
                  className="space-y-4 rounded-boho border border-boho-brown/15 bg-boho-cream/80 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-boho-brown boho-heading">{review.reviewer_name}</p>
                      {review.event_name && <p className="text-sm text-boho-rust">{review.event_name}</p>}
                    </div>
                    <span className="ever-chip text-xs flex items-center gap-1">
                      {review.status === 'approved' ? <CheckCircle className="h-4 w-4" /> : review.status === 'rejected' ? <CircleSlash className="h-4 w-4" /> : null}
                      {review.status}
                    </span>
                  </div>
                  {renderRating(review.rating ?? 0)}
                  <p className="text-sm text-boho-brown whitespace-pre-wrap">{review.content}</p>
                  <div className="flex items-center justify-between text-xs text-boho-rust">
                    <span>Ред: {review.display_order}</span>
                    <div className="flex items-center gap-2">
                      <button className="ever-chip" onClick={() => handleEdit(review)} type="button">
                        Редакция
                      </button>
                      <button
                        className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                        onClick={() => handleDelete(review.id)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
