import { adminRequest } from '../lib/adminApi';
import { PricingPackage } from '../types';

type PricingPackagePayload = Partial<PricingPackage> & {
  features?: Array<{ feature: string; display_order?: number }>;
  tiers?: Array<{
    tier_name: string;
    price_amount?: number | null;
    price_label?: string | null;
    display_order?: number;
    is_featured?: boolean;
  }>;
};

export async function fetchPricingPackages(): Promise<PricingPackage[]> {
  try {
    return await adminRequest<PricingPackage[]>('/pricing/packages');
  } catch (error) {
    console.error('Failed to fetch pricing packages', error);
    return [];
  }
}

export async function createPricingPackage(pkg: PricingPackagePayload): Promise<PricingPackage> {
  return adminRequest<PricingPackage>('/pricing/packages', {
    method: 'POST',
    json: pkg
  });
}

export async function updatePricingPackage(id: string, updates: PricingPackagePayload): Promise<PricingPackage> {
  return adminRequest<PricingPackage>(`/pricing/packages/${id}`, {
    method: 'PATCH',
    json: updates
  });
}

export async function deletePricingPackage(id: string): Promise<void> {
  await adminRequest(`/pricing/packages/${id}`, { method: 'DELETE' });
}
