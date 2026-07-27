import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
export const getProducts = async () => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};
export const createProduct = async (product: any) => {
  const response = await axios.post(`${API_URL}/products`, product);
  return response.data;
};
export const updateProduct = async (product: any) => {
  const response = await axios.put(`${API_URL}/products`, product);
  return response.data;
};
export const deleteProduct = async (id: string) => {
  const response = await axios.delete(`${API_URL}/products`, { params: { id } });
  return response.data;
};
export const getUploadUrl = async (fileName: string, contentType: string) => {
  const response = await axios.get(`${API_URL}/upload-url/${fileName}`, {
    params: { contentType }
  });
  return response.data.uploadUrl;
};
