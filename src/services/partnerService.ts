// src/services/partnerService.ts
import { adminRequest } from '../lib/adminApi';
import { Partner, PartnershipInquiry } from '../types';

export async function getAllPartners(): Promise<Partner[]> {
  try {
    return await adminRequest<Partner[]>('/partners');
  } catch (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
}

export async function createPartner(partner: Omit<Partner, 'id' | 'created_at' | 'updated_at'>): Promise<Partner> {
  return adminRequest<Partner>('/partners', {
    method: 'POST',
    json: partner
  });
}

export async function updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
  return adminRequest<Partner>(`/partners/${id}`, {
    method: 'PATCH',
    json: updates
  });
}

export async function deletePartner(id: string): Promise<void> {
  await adminRequest(`/partners/${id}`, { method: 'DELETE' });
}

export async function submitPartnershipInquiry(
  inquiry: Omit<PartnershipInquiry, 'id' | 'created_at' | 'status' | 'notes'>
): Promise<PartnershipInquiry> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const response = await fetch(`${backendUrl}/api/partners/inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inquiry)
  });

  if (!response.ok) {
    throw new Error('Failed to submit inquiry');
  }

  return response.json();
}

export async function getAllInquiries(): Promise<PartnershipInquiry[]> {
  try {
    return await adminRequest<PartnershipInquiry[]>('/inquiries');
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return [];
  }
}

export async function updateInquiryStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  notes?: string
): Promise<PartnershipInquiry> {
  return adminRequest<PartnershipInquiry>(`/inquiries/${id}`, {
    method: 'PATCH',
    json: { status, notes }
  });
}