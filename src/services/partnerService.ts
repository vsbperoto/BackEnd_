// src/services/partnerService.ts
import { adminRequest, getBackendUrl } from "../lib/adminApi";
import { Partner, PartnershipInquiry } from "../types";

export async function getAllPartners(): Promise<Partner[]> {
  return adminRequest<Partner[]>("/partners");
}

export async function createPartner(
  partner: Omit<Partner, "id" | "created_at" | "updated_at">,
): Promise<Partner> {
  return adminRequest<Partner>("/partners", {
    method: "POST",
    json: partner,
  });
}

export async function updatePartner(
  id: string,
  updates: Partial<Partner>,
): Promise<Partner> {
  return adminRequest<Partner>(`/partners/${id}`, {
    method: "PATCH",
    json: updates,
  });
}

export async function deletePartner(id: string): Promise<void> {
  await adminRequest(`/partners/${id}`, { method: "DELETE" });
}

export async function submitPartnershipInquiry(
  inquiry: Omit<PartnershipInquiry, "id" | "created_at" | "status" | "notes">,
): Promise<PartnershipInquiry> {
  const response = await fetch(`${getBackendUrl()}/api/partners/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });

  if (!response.ok) {
    throw new Error("Failed to submit inquiry");
  }

  return response.json();
}

export async function getAllInquiries(): Promise<PartnershipInquiry[]> {
  return adminRequest<PartnershipInquiry[]>("/inquiries");
}

export async function updateInquiryStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  notes?: string,
): Promise<PartnershipInquiry> {
  return adminRequest<PartnershipInquiry>(`/inquiries/${id}`, {
    method: "PATCH",
    json: { status, notes },
  });
}
