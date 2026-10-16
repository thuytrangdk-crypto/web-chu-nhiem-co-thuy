import type { AnnouncementAttachment } from '../types';
export const MEDIA_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
};
export function parseClipLink(input: string): Pick<AnnouncementAttachment, 'kind' | 'url'> {
  const url = new URL(input.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Dùng đường dẫn HTTPS của YouTube hoặc Google Drive.');
  const host = url.hostname.toLowerCase();
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] : url.searchParams.get('v') || (/^\/(?:shorts|embed)\/([^/]+)/.exec(url.pathname)?.[1]);
    if (!id || !/^[\w-]{11}$/.test(id)) throw new Error('Đường dẫn YouTube chưa đúng.');
    return { kind: 'youtube', url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (host === 'drive.google.com') {
    const id = /\/file\/d\/([\w-]+)/.exec(url.pathname)?.[1] || url.searchParams.get('id');
    if (!id || !/^[\w-]{10,200}$/.test(id)) throw new Error('Dùng liên kết chia sẻ tệp video trên Google Drive.');
    return { kind: 'drive', url: `https://drive.google.com/file/d/${id}/view` };
  }
  throw new Error('Chỉ hỗ trợ liên kết YouTube hoặc Google Drive.');
}
export function mediaLimit(type: string) { return (type.startsWith('image/') ? 10 : 50) * 1024 * 1024; }
