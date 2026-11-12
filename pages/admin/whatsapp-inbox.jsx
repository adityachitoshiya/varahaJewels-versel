import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { RefreshCw, Send, Bot, UserRound, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getApiUrl, getAdminHeaders } from '../../lib/config';
import { istDateTime } from '../../lib/istDate';

// WhatsApp chats with customers. The bot answers by itself; when a customer asks for the team
// (or a return is requested) the bot goes quiet and the reply is typed here.
const api = (path, opts = {}) => fetch(`${getApiUrl()}${path}`, { ...opts, headers: getAdminHeaders(true) })
    .then(async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.detail || 'Request failed'); return d; });
const showPhone = (p) => (p?.startsWith('91') && p.length === 12 ? `+91 ${p.slice(2, 7)} ${p.slice(7)}` : `+${p}`);

export default function WhatsAppInbox() {
    const [chats, setChats] = useState([]);
    const [open, setOpen] = useState(null);       // phone
    const [thread, setThread] = useState(null);   // { chat, messages }
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const bottom = useRef(null);

    const loadChats = () => api('/api/admin/wa/chats').then(setChats).catch((e) => setError(e.message));
    const loadThread = (phone) => api(`/api/admin/wa/chats/${phone}`).then((d) => { setThread(d); setError(''); }).catch((e) => setError(e.message));

    useEffect(() => { loadChats(); const id = setInterval(loadChats, 20000); return () => clearInterval(id); }, []);
    useEffect(() => {
        if (!open) return undefined;
        loadThread(open);
        const id = setInterval(() => loadThread(open), 10000);
        return () => clearInterval(id);
    }, [open]);
    useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [thread?.messages?.length]);

    const send = async (e) => {
        e.preventDefault();
        if (!text.trim() || !open) return;
        setBusy(true);
        try {
            await api(`/api/admin/wa/chats/${open}/reply`, { method: 'POST', body: JSON.stringify({ text }) });
            setText('');
        } catch (err) { setError(err.message); }
        await loadThread(open); loadChats(); setBusy(false);
    };
    const setMode = async (mode) => {
        try { await api(`/api/admin/wa/chats/${open}/mode`, { method: 'POST', body: JSON.stringify({ mode }) }); } catch (err) { setError(err.message); }
        loadThread(open); loadChats();
    };

    const chat = thread?.chat;
    return (
        <AdminLayout>
            <Head><title>WhatsApp Inbox - Varaha Admin</title></Head>
            <h1 className="sr-only">WhatsApp Inbox</h1>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-[#2a150c]/70 max-w-2xl text-sm">Customer chats on WhatsApp. The bot replies by itself; chats marked <b>Team</b> are waiting for you. You can reply up to 24 hours after the customer's last message.</p>
                <button onClick={loadChats} className="inline-flex items-center gap-2 rounded-xl border border-[#2a150c]/15 bg-white px-3 py-2 text-sm hover:bg-[#F6F1EB]"><RefreshCw size={16} /> Refresh</button>
            </div>
            {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

            <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
                <ul className={`bg-white rounded-2xl border border-[#2a150c]/10 overflow-y-auto max-h-[75vh] ${open ? 'hidden md:block' : ''}`}>
                    {chats.length === 0 && <li className="p-4 text-sm text-[#2a150c]/60">No chats yet.</li>}
                    {chats.map((c) => (
                        <li key={c.phone}>
                            <button onClick={() => setOpen(c.phone)} className={`w-full text-left px-4 py-3 border-b border-[#2a150c]/5 hover:bg-[#F6F1EB] ${open === c.phone ? 'bg-[#F6F1EB]' : ''}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-[#2a150c] truncate">{c.name || showPhone(c.phone)}</span>
                                    <span className="flex items-center gap-1 shrink-0">
                                        {c.mode === 'human' && <span className="text-[10px] rounded-full bg-[#7A3B23] text-white px-2 py-0.5">Team</span>}
                                        {c.unread > 0 && <span className="text-[10px] rounded-full bg-green-600 text-white px-2 py-0.5">{c.unread}</span>}
                                    </span>
                                </div>
                                <div className="text-xs text-[#2a150c]/60 truncate">{c.name ? `${showPhone(c.phone)} · ` : ''}{c.last_text}</div>
                                <div className="text-[11px] text-[#2a150c]/40">{c.last_at ? istDateTime(c.last_at) : ''}</div>
                            </button>
                        </li>
                    ))}
                </ul>

                <section className={`bg-white rounded-2xl border border-[#2a150c]/10 flex flex-col max-h-[75vh] ${open ? '' : 'hidden md:flex'}`}>
                    {!chat ? <p className="m-auto text-sm text-[#2a150c]/50">Choose a chat.</p> : (
                        <>
                            <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#2a150c]/10">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => { setOpen(null); setThread(null); }} className="md:hidden p-1" aria-label="Back"><ArrowLeft size={18} /></button>
                                    <div>
                                        <div className="font-medium">{chat.name || showPhone(chat.phone)}</div>
                                        <div className="text-xs text-[#2a150c]/60">{showPhone(chat.phone)} · {chat.lang === 'hi' ? 'Hindi' : chat.lang === 'en' ? 'English' : 'language not chosen'}</div>
                                    </div>
                                </div>
                                {chat.mode === 'human'
                                    ? <button onClick={() => setMode('bot')} className="inline-flex items-center gap-1.5 rounded-xl border border-[#2a150c]/15 px-3 py-1.5 text-sm hover:bg-[#F6F1EB]"><Bot size={15} /> Hand back to bot</button>
                                    : <button onClick={() => setMode('human')} className="inline-flex items-center gap-1.5 rounded-xl border border-[#2a150c]/15 px-3 py-1.5 text-sm hover:bg-[#F6F1EB]"><UserRound size={15} /> Take over (pause bot)</button>}
                            </header>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F6F1EB]/50">
                                {thread.messages.map((m) => (
                                    <div key={m.id} className={`flex ${m.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${m.direction === 'out' ? (m.sender === 'team' ? 'bg-[#7A3B23] text-white' : 'bg-[#e8dccf] text-[#2a150c]') : 'bg-white border border-[#2a150c]/10'}`}>
                                            {m.text || '—'}
                                            <div className={`mt-1 text-[10px] ${m.sender === 'team' ? 'text-white/70' : 'text-[#2a150c]/45'}`}>{m.sender === 'bot' ? 'Bot · ' : m.sender === 'team' ? 'Team · ' : ''}{istDateTime(m.created_at)}</div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={bottom} />
                            </div>
                            {chat.can_reply ? (
                                <form onSubmit={send} className="flex gap-2 p-3 border-t border-[#2a150c]/10">
                                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={4000} placeholder="Type a reply…" aria-label="Reply"
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
                                        className="flex-1 resize-none rounded-xl border border-[#2a150c]/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A3B23]/30" />
                                    <button disabled={busy || !text.trim()} className="self-end inline-flex items-center gap-1.5 rounded-xl bg-[#7A3B23] text-white px-4 py-2 text-sm disabled:opacity-50"><Send size={15} /> Send</button>
                                </form>
                            ) : <p className="p-3 border-t border-[#2a150c]/10 text-xs text-[#2a150c]/60">More than 24 hours since the customer's last message, so WhatsApp does not allow a reply. The customer has to write first.</p>}
                        </>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
