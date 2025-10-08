import { adminRequest } from "../lib/adminApi";
import { BlogPost, BlogTag } from "../types";

export async function fetchBlogPosts(): Promise<BlogPost[]> {
  return adminRequest<BlogPost[]>("/blog/posts");
}

export async function createBlogPost(
  post: Partial<BlogPost> & { tags?: string[] },
): Promise<BlogPost> {
  return adminRequest<BlogPost>("/blog/posts", {
    method: "POST",
    json: post,
  });
}

export async function updateBlogPost(
  id: string,
  updates: Partial<BlogPost> & { tags?: string[] },
): Promise<BlogPost> {
  return adminRequest<BlogPost>(`/blog/posts/${id}`, {
    method: "PATCH",
    json: updates,
  });
}

export async function deleteBlogPost(id: string): Promise<void> {
  await adminRequest(`/blog/posts/${id}`, { method: "DELETE" });
}

export async function fetchBlogTags(): Promise<BlogTag[]> {
  return adminRequest<BlogTag[]>("/blog/tags");
}

export async function createBlogTag(tag: Partial<BlogTag>): Promise<BlogTag> {
  return adminRequest<BlogTag>("/blog/tags", {
    method: "POST",
    json: tag,
  });
}

export async function updateBlogTag(
  id: string,
  updates: Partial<BlogTag>,
): Promise<BlogTag> {
  return adminRequest<BlogTag>(`/blog/tags/${id}`, {
    method: "PATCH",
    json: updates,
  });
}

export async function deleteBlogTag(id: string): Promise<void> {
  await adminRequest(`/blog/tags/${id}`, { method: "DELETE" });
}
