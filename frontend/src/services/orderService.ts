import { api } from '../lib/apiClient';
import type { Order, OrderInput } from '../types';

interface WriteResponse<T> {
  message?: string;
  item?: T;
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>('/orders');
  return Array.isArray(data) ? data : [];
}

export async function createOrder(order: OrderInput): Promise<Order | undefined> {
  const { data } = await api.post<WriteResponse<Order>>('/orders', order);
  return data.item;
}

export async function updateOrder(order: Order): Promise<Order | undefined> {
  const { data } = await api.put<WriteResponse<Order>>('/orders', order);
  return data.item;
}

export async function deleteOrder(id: string): Promise<void> {
  await api.delete('/orders', { params: { id } });
}
