import { adminRequest } from "../lib/adminApi";
import { FaqEntry } from "../types";

export async function fetchFaqEntries(): Promise<FaqEntry[]> {
  return adminRequest<FaqEntry[]>("/faqs");
}

export async function createFaqEntry(
  entry: Partial<FaqEntry>,
): Promise<FaqEntry> {
  return adminRequest<FaqEntry>("/faqs", {
    method: "POST",
    json: entry,
  });
}

export async function updateFaqEntry(
  id: string,
  updates: Partial<FaqEntry>,
): Promise<FaqEntry> {
  return adminRequest<FaqEntry>(`/faqs/${id}`, {
    method: "PATCH",
    json: updates,
  });
}

export async function deleteFaqEntry(id: string): Promise<void> {
  await adminRequest(`/faqs/${id}`, { method: "DELETE" });
}
