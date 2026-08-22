import axios from 'axios';
import { api } from '../lib/apiClient';
import type { Product, ProductInput } from '../types';

interface WriteResponse<T> {
  message?: string;
  item?: T;
}

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>('/products');
  return Array.isArray(data) ? data : [];
}

export async function createProduct(product: ProductInput): Promise<Product | undefined> {
  const { data } = await api.post<WriteResponse<Product>>('/products', product);
  return data.item;
}

export async function updateProduct(product: Product): Promise<Product | undefined> {
  const { data } = await api.put<WriteResponse<Product>>('/products', product);
  return data.item;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete('/products', { params: { id } });
}

/**
 * The upload endpoint uses the path segment verbatim as the S3 object key, so two people
 * uploading `photo.jpg` would overwrite each other. Prefixing with a timestamp and random
 * suffix makes the key unique, and stripping everything outside `[a-z0-9._-]` keeps it from
 * containing path separators or query characters.
 */
function uploadKeyFor(fileName: string): string {
  const cleaned =
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(-80) || 'upload';

  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

  return `${Date.now().toString(36)}-${suffix}-${cleaned}`;
}

export async function getUploadUrl(fileName: string, contentType: string): Promise<string> {
  const key = encodeURIComponent(uploadKeyFor(fileName));
  const { data } = await api.get<{ uploadUrl: string }>(`/upload-url/${key}`, {
    params: { contentType },
  });
  return data.uploadUrl;
}

/**
 * Request a presigned URL, PUT the file straight to S3, and return the public object URL.
 *
 * The PUT deliberately uses a bare axios call rather than the shared `api` instance: the
 * presigned URL carries its own signature, and the instance's base URL and Authorization
 * header would both invalidate it.
 */
export async function uploadProductImage(file: File): Promise<string> {
  const contentType = file.type || 'application/octet-stream';
  const uploadUrl = await getUploadUrl(file.name, contentType);
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': contentType },
    timeout: 60_000,
  });
  // Strip the signature query string to get the durable public object URL.
  return uploadUrl.split('?')[0] ?? uploadUrl;
}
