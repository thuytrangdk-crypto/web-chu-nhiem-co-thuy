import React, { useEffect, useState } from 'react';
import { api } from '../api';
import type { AnnouncementAttachment } from '../types';
import { MEDIA_TYPES, mediaLimit, parseClipLink } from '../utils/media';

async function mediaRequest(endpoint: string, body: object) {
  const response = await fetch('/api/media/' + endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + api.getToken() },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không kết nối được nơi lưu tệp.');
  return result;
}
function MediaItem({ item }: { item: AnnouncementAttachment }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!item.path) return;
    let active = true;
    const refresh = () => mediaRequest('view-url', { path: item.path }).then(result => {
      if (active) { setUrl(result.url); setError(''); }
    }).catch(e => { if (active) setError(e.message); });
    refresh();
    const timer = window.setInterval(refresh, 50 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [item.path, retry]);
  if (item.kind === 'youtube' || item.kind === 'drive') {
    let link: ReturnType<typeof parseClipLink>;
    try { link = parseClipLink(item.url || ''); } catch { return <p>Liên kết clip không hợp lệ.</p>; }
    // Load third-party players only after the viewer chooses to open the clip.
    return <ExternalClip item={item} link={link} />;
  }
  return <div className="rounded-xl border border-slate-200 p-3 min-w-0">
    <p className="text-xs text-slate-600 mb-2 break-words">{item.name}</p>
    {error ? <div className="text-xs text-rose-600">{error} <button type="button" className="underline" onClick={() => setRetry(v => v + 1)}>Thử lại</button></div>
      : !url ? <p className="text-xs text-slate-500">Đang tải tệp...</p>
      : item.kind === 'image' ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={item.name} loading="lazy" className="rounded-lg max-h-96 w-full object-contain" /></a>
      : <><video src={url} controls playsInline preload="metadata" className="rounded-lg w-full max-h-96 bg-slate-900" /><a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-700 underline">Mở clip riêng nếu thiết bị không phát được</a></>}
  </div>;
}
function ExternalClip({ item, link }: { item: AnnouncementAttachment; link: ReturnType<typeof parseClipLink> }) {
  const [opened, setOpened] = useState(false);
  const id = link.kind === 'youtube' ? new URL(link.url!).searchParams.get('v') : /\/d\/([^/]+)/.exec(link.url!)?.[1];
  const embed = link.kind === 'youtube' ? `https://www.youtube-nocookie.com/embed/${id}` : `https://drive.google.com/file/d/${id}/preview`;
  return <div className="rounded-xl border border-slate-200 p-3 min-w-0">
    <p className="text-xs font-semibold text-slate-600 mb-2 break-words">{item.name}</p>
    {opened ? <iframe title={item.name} src={embed} className="w-full aspect-video rounded-lg" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen />
      : <button type="button" onClick={() => setOpened(true)} className="rounded-lg bg-sky-50 text-sky-700 px-4 py-2 text-sm">▶ Xem clip</button>}
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-sky-700 underline mt-2">Mở trên {link.kind === 'youtube' ? 'YouTube' : 'Google Drive'}</a>
    {link.kind === 'drive' && <p className="text-xs text-slate-500 mt-1">Nếu không xem được, hãy kiểm tra quyền chia sẻ của video trên Google Drive.</p>}
  </div>;
}
export function AnnouncementMedia({ items = [] }: { items?: AnnouncementAttachment[] }) {
  if (!items.length) return null;
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">{items.map(item => <MediaItem key={item.id} item={item} />)}</div>;
}
export function MediaEditor({ items, onChange, busy, onBusy }: {
  items: AnnouncementAttachment[]; onChange: (items: AnnouncementAttachment[]) => void;
  busy: boolean; onBusy: (busy: boolean) => void;
}) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  async function upload(files: File[]) {
    setError('');
    if (items.length + files.length > 10) { setError('Mỗi thông báo tối đa 10 tệp và liên kết.'); return; }
    for (const file of files) {
      if (!Object.hasOwn(MEDIA_TYPES, file.type) || !file.size || file.size > mediaLimit(file.type)) {
        setError(`Tệp “${file.name}” không phù hợp. Ảnh JPG/PNG/WEBP/GIF tối đa 10 MB; clip MP4/MOV/WEBM tối đa 50 MB. Ảnh HEIC cần chuyển sang JPG.`); return;
      }
    }
    onBusy(true);
    const next = [...items];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]; setProgress(`Đang tải ${i + 1}/${files.length}: ${file.name}`);
        const prepared = await mediaRequest('upload-url', { name: file.name.slice(0, 200), type: file.type, size: file.size });
        const body = new FormData(); body.append('cacheControl', '3600'); body.append('', file);
        const response = await fetch(prepared.signedUrl, { method: 'PUT', body });
        if (!response.ok) throw new Error(`Không tải được “${file.name}”. Kiểm tra kết nối hoặc dung lượng Supabase rồi thử lại.`);
        next.push(prepared.attachment); onChange([...next]);
      }
    } catch (e: any) { setError(e.message); }
    finally { onBusy(false); setProgress(''); }
  }
  function addLink() {
    try {
      if (items.length >= 10) throw new Error('Mỗi thông báo tối đa 10 tệp và liên kết.');
      const clip = parseClipLink(link);
      onChange([...items, { ...clip, id: crypto.randomUUID(), name: clip.kind === 'youtube' ? 'Clip YouTube' : 'Clip Google Drive' }]);
      setLink(''); setError('');
    } catch (e: any) { setError(e.message); }
  }
  return <section className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
    <p className="text-sm font-semibold text-slate-700">Ảnh và clip đính kèm</p>
    <label className="inline-block rounded-lg bg-white border border-sky-300 px-4 py-2 text-sm text-sky-700 cursor-pointer">
      Chọn ảnh / clip từ máy
      <input type="file" multiple accept={Object.keys(MEDIA_TYPES).join(',')} disabled={busy} className="sr-only" onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; void upload(files); }} />
    </label>
    <p className="text-xs text-slate-500">Ảnh tối đa 10 MB; clip tối đa 50 MB; tổng cộng tối đa 10 tệp/liên kết. Clip MP4 tương thích tốt với nhiều thiết bị. Ảnh HEIC cần chuyển sang JPG.</p>
    <div className="flex flex-col sm:flex-row gap-2">
      <input aria-label="Đường dẫn clip YouTube hoặc Google Drive" type="url" value={link} disabled={busy} onChange={e => setLink(e.target.value)} placeholder="Dán liên kết YouTube hoặc Google Drive" className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <button type="button" disabled={busy || !link.trim()} onClick={addLink} className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm disabled:opacity-50">Thêm liên kết</button>
    </div>
    <p className="text-xs text-slate-500">Video Google Drive cần được chia sẻ quyền xem cho học sinh.</p>
    {items.map((item, index) => <div key={item.id} className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg"><span className="break-all">{item.name} {item.size ? `(${(item.size / 1024 / 1024).toFixed(1)} MB)` : ''}</span><button type="button" disabled={busy} onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-rose-600 shrink-0">Bỏ đính kèm</button></div>)}
    {busy && <p role="status" className="text-sm text-sky-700">{progress || 'Đang xử lý...'}</p>}
    {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
  </section>;
}
