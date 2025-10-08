import { FormEvent, useEffect, useState } from 'react';
import { PlusCircle, Save, Trash2, Star } from 'lucide-react';
import {
  fetchPricingPackages,
  createPricingPackage,
  updatePricingPackage,
  deletePricingPackage
} from '../../services/pricingService';
import { PricingPackage } from '../../types';

interface FeatureForm {
  id?: string;
  feature: string;
  display_order: number;
}

interface TierForm {
  id?: string;
  tier_name: string;
  price_amount: string;
  price_label: string;
  display_order: number;
  is_featured: boolean;
}

interface PackageFormState {
  title: string;
  description: string;
  highlight: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  features: FeatureForm[];
  tiers: TierForm[];
}

const emptyPackage: PackageFormState = {
  title: '',
  description: '',
  highlight: '',
  is_featured: false,
  is_active: true,
  display_order: 0,
  features: [],
  tiers: []
};

export function PricingManager() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [form, setForm] = useState<PackageFormState>(emptyPackage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    const data = await fetchPricingPackages();
    setPackages(data);
    setLoading(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      features: form.features.map((feature, index) => ({
        feature: feature.feature,
        display_order: feature.display_order ?? index
      })),
      tiers: form.tiers.map((tier, index) => ({
        tier_name: tier.tier_name,
        price_amount: tier.price_amount ? Number(tier.price_amount) : null,
        price_label: tier.price_label,
        display_order: tier.display_order ?? index,
        is_featured: tier.is_featured
      }))
    };

    try {
      if (editingId) {
        const updated = await updatePricingPackage(editingId, payload);
        setPackages((prev) => prev.map((pkg) => (pkg.id === editingId ? updated : pkg)));
      } else {
        const created = await createPricingPackage(payload);
        setPackages((prev) => [...prev, created]);
      }
      setEditingId(null);
      setForm(emptyPackage);
    } catch (error) {
      console.error('Failed to save pricing package', error);
      alert('Неуспешно запазване на пакета');
    }
  };

  const handleEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id);
    setForm({
      title: pkg.title,
      description: pkg.description ?? '',
      highlight: pkg.highlight ?? '',
      is_featured: pkg.is_featured,
      is_active: pkg.is_active,
      display_order: pkg.display_order,
      features: pkg.features.map((feature, index) => ({
        id: feature.id,
        feature: feature.feature,
        display_order: feature.display_order ?? index
      })),
      tiers: pkg.tiers.map((tier, index) => ({
        id: tier.id,
        tier_name: tier.tier_name,
        price_amount: tier.price_amount != null ? String(tier.price_amount) : '',
        price_label: tier.price_label ?? '',
        display_order: tier.display_order ?? index,
        is_featured: tier.is_featured
      }))
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Да изтрием ли този пакет?')) return;
    try {
      await deletePricingPackage(id);
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyPackage);
      }
    } catch (error) {
      console.error('Failed to delete pricing package', error);
      alert('Неуспешно изтриване на пакета');
    }
  };

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      features: [...prev.features, { feature: '', display_order: prev.features.length }]
    }));
  };

  const removeFeature = (index: number) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.map((feature, idx) =>
        idx === index ? { ...feature, feature: value } : feature
      )
    }));
  };

  const addTier = () => {
    setForm((prev) => ({
      ...prev,
      tiers: [
        ...prev.tiers,
        {
          tier_name: '',
          price_amount: '',
          price_label: '',
          display_order: prev.tiers.length,
          is_featured: false
        }
      ]
    }));
  };

  const removeTier = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((_, idx) => idx !== index)
    }));
  };

  const updateTier = (index: number, key: keyof TierForm, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier, idx) =>
        idx === index ? { ...tier, [key]: value } : tier
      )
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <span className="ever-section-title">Ценообразуване</span>
        <h2 className="text-3xl font-semibold text-boho-brown boho-heading">Пакети и опции</h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-boho border border-boho-brown/20 bg-boho-cream/70 p-6 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="ever-label">Заглавие</label>
            <input
              className="ever-input"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </div>
          <div>
            <label className="ever-label">Highlight</label>
            <input
              className="ever-input"
              value={form.highlight}
              onChange={(event) => setForm((prev) => ({ ...prev, highlight: event.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="ever-label">Описание</label>
          <textarea
            className="ever-textarea"
            rows={4}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="ever-label">Ред</label>
            <input
              className="ever-input"
              type="number"
              value={form.display_order}
              onChange={(event) => setForm((prev) => ({ ...prev, display_order: Number(event.target.value) }))}
            />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm text-boho-brown">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(event) => setForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
              className="h-4 w-4 rounded border-boho-brown"
            />
            Представен пакет
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm text-boho-brown">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-boho-brown"
            />
            Показвай на сайта
          </label>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-boho-brown boho-heading">Характеристики</h3>
            <button type="button" className="ever-chip" onClick={addFeature}>
              <PlusCircle className="h-4 w-4" />
              Добави
            </button>
          </div>
          {form.features.length === 0 ? (
            <p className="text-sm text-boho-rust">Добавете ключови точки за този пакет</p>
          ) : (
            <ul className="space-y-2">
              {form.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <input
                    className="ever-input flex-1"
                    value={feature.feature}
                    onChange={(event) => updateFeature(index, event.target.value)}
                    placeholder="Напр. 8 часово заснемане"
                  />
                  <button
                    type="button"
                    className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-boho-brown boho-heading">Ценови нива</h3>
            <button type="button" className="ever-chip" onClick={addTier}>
              <PlusCircle className="h-4 w-4" />
              Добави ниво
            </button>
          </div>
          {form.tiers.length === 0 ? (
            <p className="text-sm text-boho-rust">Добавете ценови опции или допълнителни пакети</p>
          ) : (
            <div className="space-y-3">
              {form.tiers.map((tier, index) => (
                <div
                  key={index}
                  className="rounded-boho border border-boho-brown/20 bg-boho-cream/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className="ever-input flex-1"
                      value={tier.tier_name}
                      onChange={(event) => updateTier(index, 'tier_name', event.target.value)}
                      placeholder="Gold"
                    />
                    <button
                      type="button"
                      className={`ever-chip ${tier.is_featured ? 'bg-boho-terracotta text-white' : ''}`}
                      onClick={() => updateTier(index, 'is_featured', !tier.is_featured)}
                    >
                      <Star className="h-4 w-4" />
                      Акцент
                    </button>
                    <button
                      type="button"
                      className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                      onClick={() => removeTier(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 mt-3">
                    <input
                      className="ever-input"
                      value={tier.price_amount}
                      onChange={(event) => updateTier(index, 'price_amount', event.target.value)}
                      placeholder="1200"
                    />
                    <input
                      className="ever-input"
                      value={tier.price_label}
                      onChange={(event) => updateTier(index, 'price_label', event.target.value)}
                      placeholder="лв."
                    />
                    <input
                      className="ever-input"
                      type="number"
                      value={tier.display_order}
                      onChange={(event) => updateTier(index, 'display_order', Number(event.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <button type="submit" className="ever-button">
          <Save className="h-4 w-4" />
          {editingId ? 'Запази пакета' : 'Създай пакет'}
        </button>
      </form>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-boho-brown boho-heading">Съществуващи пакети</h3>
        {loading ? (
          <div className="text-sm text-boho-rust">Зареждане...</div>
        ) : packages.length === 0 ? (
          <div className="text-sm text-boho-rust">Все още няма въведени пакети</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packages
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((pkg) => (
                <article
                  key={pkg.id}
                  className={`space-y-4 rounded-boho border border-boho-brown/15 bg-boho-cream/80 p-5 shadow-sm ${
                    pkg.is_featured ? 'ring-2 ring-boho-terracotta/60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-boho-brown boho-heading">{pkg.title}</h4>
                      {pkg.highlight && <p className="text-sm text-boho-rust">{pkg.highlight}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs text-boho-rust">
                      <span>{pkg.is_active ? 'Активен' : 'Скрит'}</span>
                      <span>Ред: {pkg.display_order}</span>
                    </div>
                  </div>
                  {pkg.description && <p className="text-sm text-boho-brown whitespace-pre-wrap">{pkg.description}</p>}
                  <ul className="space-y-1 text-sm text-boho-brown">
                    {pkg.features.map((feature) => (
                      <li key={feature.id}>• {feature.feature}</li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    {pkg.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className={`flex items-center justify-between rounded-boho border border-boho-brown/10 bg-boho-cream/70 px-3 py-2 text-sm ${
                          tier.is_featured ? 'border-boho-terracotta/50 text-boho-terracotta' : ''
                        }`}
                      >
                        <span>{tier.tier_name}</span>
                        <span>
                          {tier.price_amount != null ? `${tier.price_amount} ${tier.price_label ?? 'лв.'}` : tier.price_label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <button className="ever-chip" type="button" onClick={() => handleEdit(pkg)}>
                      Редакция
                    </button>
                    <button
                      className="p-2 text-boho-terracotta hover:bg-boho-terracotta/20 rounded-boho"
                      type="button"
                      onClick={() => handleDelete(pkg.id)}
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
