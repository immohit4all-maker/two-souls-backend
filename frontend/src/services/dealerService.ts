import { api } from '../lib/apiClient';
import type { Dealer, DealerInput } from '../types';

/**
 * Dealers (suppliers) are stored server-side under the marketplace-era `/sellers` resource.
 * This module is the single place that boundary is crossed — everything above it says "dealer".
 */
const RESOURCE = '/sellers';

interface WriteResponse<T> {
  message?: string;
  item?: T;
}

export async function getDealers(): Promise<Dealer[]> {
  const { data } = await api.get<Dealer[]>(RESOURCE);
  return Array.isArray(data) ? data : [];
}

export async function createDealer(dealer: DealerInput): Promise<Dealer | undefined> {
  const { data } = await api.post<WriteResponse<Dealer>>(RESOURCE, dealer);
  return data.item;
}

export async function updateDealer(dealer: Dealer): Promise<Dealer | undefined> {
  const { data } = await api.put<WriteResponse<Dealer>>(RESOURCE, dealer);
  return data.item;
}

export async function deleteDealer(id: string): Promise<void> {
  await api.delete(RESOURCE, { params: { id } });
}
