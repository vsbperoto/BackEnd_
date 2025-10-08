import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PlusCircle, Save, RefreshCw, Tag, Calendar as CalendarIcon, Image as ImageIcon, Trash2 } from 'lucide-react';
import {
  fetchBlogPosts,
  fetchBlogTags,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  createBlogTag,
  updateBlogTag,
  deleteBlogTag
} from '../../services/blogService';
import { BlogPost, BlogTag } from '../../types';

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  status: BlogPost['status'];
  scheduled_for: string;
  tags: string[];
}

const emptyForm: BlogFormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  status: 'draft',
  scheduled_for: '',
  tags: []
};

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagForm, setTagForm] = useState({ name: '', slug: '', editingId: '' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [postData, tagData] = await Promise.all([fetchBlogPosts(), fetchBlogTags()]);
    setPosts(postData);
    setTags(tagData);
    setLoading(false);
  };

  const currentPost = useMemo(() => posts.find((p) => p.id === editingPostId) ?? null, [editingPostId, posts]);

  useEffect(() => {
    if (currentPost) {
      setForm({
        title: currentPost.title,
        slug: currentPost.slug,
        excerpt: currentPost.excerpt ?? '',
        content: currentPost.content ?? '',
        cover_image: currentPost.cover_image ?? '',
        status: currentPost.status,
        scheduled_for: currentPost.scheduled_for ? currentPost.scheduled_for.slice(0, 16) : '',
        tags: currentPost.tags.map((tag) => tag.id)
      });
    } else {
      setForm(emptyForm);
    }
  }, [currentPost]);

  const handleInputChange = (key: keyof BlogFormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editingPostId) {
        const updated = await updateBlogPost(editingPostId, {
          ...form,
          tags: form.tags
        });
        setPosts((prev) => prev.map((post) => (post.id === editingPostId ? updated : post)));
      } else {
        const created = await createBlogPost({ ...form, tags: form.tags });
        setPosts((prev) => [created, ...prev]);
      }
      setEditingPostId(null);
      setForm(emptyForm);
    } catch (error) {
      console.error('Failed to save blog post', error);
      alert('Неуспешно запазване на статията. Проверете конзолата за детайли.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Да изтрием ли тази статия?')) return;
    try {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
      if (editingPostId === id) {
        setEditingPostId(null);
        setForm(emptyForm);
      }
    } catch (error) {
      console.error('Failed to delete blog post', error);
      alert('Неуспешно изтриване на статията');
    }
  };

  const handleTagSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tagForm.name.trim() || !tagForm.slug.trim()) {
      alert('Моля, попълнете име и slug за тага');
      return;
    }

    try {
      if (tagForm.editingId) {
        const updated = await updateBlogTag(tagForm.editingId, {
          name: tagForm.name,
          slug: tagForm.slug
        });
        setTags((prev) => prev.map((tag) => (tag.id === updated.id ? updated : tag)));
      } else {
        const created = await createBlogTag({ name: tagForm.name, slug: tagForm.slug });
        setTags((prev) => [...prev, created]);
      }
      setTagForm({ name: '', slug: '', editingId: '' });
    } catch (error) {
      console.error('Failed to save tag', error);
      alert('Неуспешно запазване на тага.');
    }
  };

  const handleTagDelete = async (id: string) => {
    if (!confirm('Да изтрием ли този таг?')) return;
    try {
      await deleteBlogTag(id);
      setTags((prev) => prev.filter((tag) => tag.id !== id));
      setForm((prev) => ({ ...prev, tags: prev.tags.filter((tagId) => tagId !== id) }));
    } catch (error) {
      console.error('Failed to delete tag', error);
      alert('Неуспешно изтриване на тага.');
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="ever-section-title">Блог управление</span>
          <h2 className="text-3xl font-semibold text-boho-brown boho-heading">Статии и етикети</h2>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refreshData()}
            className="ever-chip"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            Презареждане
          </button>
          <button
            onClick={() => setEditingPostId(null)}
            className="ever-chip"
            type="button"
          >
            <PlusCircle className="h-4 w-4" />
            Нова статия
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-6 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm"
        >
          <div>
            <label className="ever-label">Заглавие</label>
            <input
              className="ever-input"
              value={form.title}
              onChange={(event) => handleInputChange('title', event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ever-label">Slug</label>
              <input
                className="ever-input"
                value={form.slug}
                onChange={(event) => handleInputChange('slug', event.target.value)}
                required
              />
            </div>
            <div>
              <label className="ever-label">Състояние</label>
              <select
                className="ever-input"
                value={form.status}
                onChange={(event) => handleInputChange('status', event.target.value)}
              >
                <option value="draft">Чернова</option>
                <option value="scheduled">Планирана</option>
                <option value="published">Публикувана</option>
                <option value="archived">Архивирана</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ever-label flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Cover image URL
              </label>
              <input
                className="ever-input"
                value={form.cover_image}
                onChange={(event) => handleInputChange('cover_image', event.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <label className="ever-label flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Планирана дата
              </label>
              <input
                type="datetime-local"
                className="ever-input"
                value={form.scheduled_for}
                onChange={(event) => handleInputChange('scheduled_for', event.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="ever-label">Кратко описание</label>
            <textarea
              className="ever-textarea"
              value={form.excerpt}
              onChange={(event) => handleInputChange('excerpt', event.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="ever-label">Съдържание</label>
            <textarea
              className="ever-textarea"
              value={form.content}
              onChange={(event) => handleInputChange('content', event.target.value)}
              rows={8}
            />
          </div>

          <div>
            <label className="ever-label flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Етикети
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = form.tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'tags',
                        isSelected
                          ? form.tags.filter((id) => id !== tag.id)
                          : [...form.tags, tag.id]
                      )
                    }
                    className={`ever-chip ${isSelected ? 'bg-boho-terracotta text-white' : 'bg-boho-cream text-boho-brown'}`}
                  >
                    #{tag.name}
                  </button>
                );
              })}
              {tags.length === 0 && (
                <span className="text-sm text-boho-rust">Добавете първо етикет от секцията вдясно</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="ever-button"
              type="submit"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              {editingPostId ? 'Запази промените' : 'Публикувай чернова'}
            </button>
            {editingPostId && (
              <button
                type="button"
                onClick={() => setEditingPostId(null)}
                className="ever-chip"
              >
                Отмяна
              </button>
            )}
          </div>
        </form>

        <div className="space-y-6">
          <form
            onSubmit={handleTagSubmit}
            className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-boho-brown boho-heading">
                {tagForm.editingId ? 'Редакция на етикет' : 'Нов етикет'}
              </h3>
              {tagForm.editingId && (
                <button
                  type="button"
                  onClick={() => setTagForm({ name: '', slug: '', editingId: '' })}
                  className="ever-chip"
                >
                  Отмяна
                </button>
              )}
            </div>
            <div>
              <label className="ever-label">Име</label>
              <input
                className="ever-input"
                value={tagForm.name}
                onChange={(event) => setTagForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="ever-label">Slug</label>
              <input
                className="ever-input"
                value={tagForm.slug}
                onChange={(event) => setTagForm((prev) => ({ ...prev, slug: event.target.value }))}
                required
              />
            </div>
            <button className="ever-button w-full" type="submit">
              <Save className="h-4 w-4" />
              {tagForm.editingId ? 'Запази етикет' : 'Добави етикет'}
            </button>
          </form>

          <div className="space-y-3 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-boho-brown boho-heading">Всички етикети</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-boho-rust">Все още няма добавени етикети</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="flex items-center justify-between rounded-[var(--ever-radius-md)] bg-boho-cream p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-boho-brown">{tag.name}</span>
                      <span className="text-xs text-boho-rust">/{tag.slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="ever-chip"
                        onClick={() => setTagForm({ name: tag.name, slug: tag.slug, editingId: tag.id })}
                      >
                        Редакция
                      </button>
                      <button
                        type="button"
                        className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                        onClick={() => handleTagDelete(tag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-2xl font-semibold text-boho-brown boho-heading">Статии</h3>
        {loading ? (
          <div className="text-sm text-boho-rust">Зареждане...</div>
        ) : posts.length === 0 ? (
          <div className="text-sm text-boho-rust">Все още няма публикувани статии</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="space-y-4 rounded-boho border border-boho-brown/15 bg-boho-cream/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-boho-brown boho-heading">{post.title}</h4>
                    <p className="text-xs text-boho-rust">/{post.slug}</p>
                  </div>
                  <span className="ever-chip text-xs uppercase">{post.status}</span>
                </div>
                {post.excerpt && <p className="text-sm text-boho-brown line-clamp-3">{post.excerpt}</p>}
                <div className="flex flex-wrap gap-2 text-xs text-boho-rust">
                  {post.tags.map((tag) => (
                    <span key={tag.id} className="ever-chip">
                      #{tag.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="ever-chip"
                    onClick={() => setEditingPostId(post.id)}
                    type="button"
                  >
                    Редакция
                  </button>
                  <button
                    className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                    type="button"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
