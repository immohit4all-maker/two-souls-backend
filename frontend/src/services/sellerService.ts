import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const getSellers = async () => {
  const response = await axios.get(`${API_URL}/sellers`);
  return response.data;
};

export const createSeller = async (seller: any) => {
  const response = await axios.post(`${API_URL}/sellers`, seller);
  return response.data;
};

export const updateSeller = async (seller: any) => {
  const response = await axios.put(`${API_URL}/sellers`, seller);
  return response.data;
};

export const deleteSeller = async (id: string) => {
  const response = await axios.delete(`${API_URL}/sellers`, { params: { id } });
  return response.data;
};
