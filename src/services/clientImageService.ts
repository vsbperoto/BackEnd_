import { supabaseClient } from "../lib/supabaseClient";
import { ClientImage } from "../types";

export async function getGalleryImages(
  galleryId: string,
): Promise<ClientImage[]> {
  try {
    const { data, error } = await supabaseClient
      .from("client_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return [];
  }
}

export async function createImage(
  image: Omit<ClientImage, "id" | "created_at">,
): Promise<ClientImage> {
  const { data, error } = await supabaseClient
    .from("client_images")
    .insert(image)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateImage(
  id: string,
  updates: Partial<ClientImage>,
): Promise<ClientImage> {
  const { data, error } = await supabaseClient
    .from("client_images")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteImage({
  imageId,
  publicId,
}: {
  imageId: string;
  publicId: string;
}): Promise<void> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  if (!publicId) {
    throw new Error("Missing Cloudinary public ID");
  }

  const response = await fetch("/api/deleteImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ imageId, publicId }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to delete image";
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch (parseError) {
      console.error("Error parsing deleteImage response:", parseError);
    }

    throw new Error(errorMessage);
  }
}

export async function reorderImages(imageIds: string[]): Promise<void> {
  try {
    const updates = imageIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabaseClient
        .from("client_images")
        .update({ order_index: update.order_index })
        .eq("id", update.id);
    }
  } catch (error) {
    console.error("Error reordering images:", error);
    throw error;
  }
}

export async function getNextOrderIndex(galleryId: string): Promise<number> {
  try {
    const { data, error } = await supabaseClient
      .from("client_images")
      .select("order_index")
      .eq("gallery_id", galleryId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? data.order_index + 1 : 0;
  } catch (error) {
    console.error("Error getting next order index:", error);
    return 0;
  }
}
