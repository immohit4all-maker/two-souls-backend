import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getOrders = async () => {
  const response = await axios.get(`${API_URL}/orders`);
  return response.data;
};

export const createOrder = async (order: any) => {
  const response = await axios.post(`${API_URL}/orders`, order);
  return response.data;
};

export const updateOrder = async (order: any) => {
  const response = await axios.put(`${API_URL}/orders`, order);
  return response.data;
};

export const deleteOrder = async (id: string) => {
  const response = await axios.delete(`${API_URL}/orders`, { params: { id } });
  return response.data;
};
