import { isDemo, demoFetch } from './demo';
export type Content = Record<string, unknown>;
export type Field = { key: string; label: string; group: string; kind?: string; minItems?: number; fixedLength?: boolean };
export type WebsiteDraft = { content: Content; fields: Field[]; revision: number; publishedAt: string | null };
export const websiteApiConfigured = isDemo || Boolean(import.meta.env.VITE_API_BASE_URL?.trim());
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = isDemo ? '/demo/api' : import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Backend Sleep n Dream belum terhubung.');
  const response = await (isDemo ? demoFetch : fetch)(`${base}/admin/website${path}`, {
    ...options, credentials: 'include',
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Perubahan gagal disimpan.');
  return json.data;
}
export const websiteApi = {
  get: () => request<WebsiteDraft>(''),
  save: (content: Content, revision: number) => request<WebsiteDraft>('', { method: 'PUT', body: JSON.stringify({ content, revision }) }),
  publish: (revision: number) => request<{ revision: number; publishedAt: string }>('/publish', { method: 'POST', body: JSON.stringify({ revision }) }),
  upload: (file: File) => {
    const body = new FormData(); body.append(file.type.startsWith('video/') ? 'video' : 'image', file);
    return request<{ url: string }>('/media', { method: 'POST', body });
  },
};
