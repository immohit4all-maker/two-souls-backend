import { api } from '../lib/apiClient';
import type { Seller, SellerInput } from '../types';

interface WriteResponse<T> {
  message?: string;
  item?: T;
}

export async function getSellers(): Promise<Seller[]> {
  const { data } = await api.get<Seller[]>('/sellers');
  return Array.isArray(data) ? data : [];
}

export async function createSeller(seller: SellerInput): Promise<Seller | undefined> {
  const { data } = await api.post<WriteResponse<Seller>>('/sellers', seller);
  return data.item;
}

export async function updateSeller(seller: Seller): Promise<Seller | undefined> {
  const { data } = await api.put<WriteResponse<Seller>>('/sellers', seller);
  return data.item;
}

export async function deleteSeller(id: string): Promise<void> {
  await api.delete('/sellers', { params: { id } });
}
