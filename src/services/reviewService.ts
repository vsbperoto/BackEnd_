import { adminRequest } from "../lib/adminApi";
import { ClientReview } from "../types";

export async function fetchReviews(): Promise<ClientReview[]> {
  return adminRequest<ClientReview[]>("/reviews");
}

export async function createReview(
  review: Partial<ClientReview>,
): Promise<ClientReview> {
  return adminRequest<ClientReview>("/reviews", {
    method: "POST",
    json: review,
  });
}

export async function updateReview(
  id: string,
  updates: Partial<ClientReview>,
): Promise<ClientReview> {
  return adminRequest<ClientReview>(`/reviews/${id}`, {
    method: "PATCH",
    json: updates,
  });
}

export async function deleteReview(id: string): Promise<void> {
  await adminRequest(`/reviews/${id}`, { method: "DELETE" });
}
