// src/services/contactService.ts
import { adminRequest } from '../lib/adminApi';
import { Contact } from '../types';

export async function getAllContacts(options: { archived?: boolean | null } = {}): Promise<Contact[]> {
  try {
    const query = options.archived === undefined
      ? ''
      : `?archived=${options.archived ? 'true' : 'false'}`;
    return await adminRequest<Contact[]>(`/contacts${query}`);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}

export async function archiveContact(id: string): Promise<void> {
  await adminRequest(`/contacts/${id}/archive`, {
    method: 'POST'
  });
}

export async function unarchiveContact(id: string): Promise<void> {
  await adminRequest(`/contacts/${id}/archive`, {
    method: 'DELETE'
  });
}

export async function deleteContact(id: string): Promise<void> {
  await adminRequest(`/contacts/${id}`, { method: 'DELETE' });
}