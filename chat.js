/**
 * ZukaChatEngine - ZUKA Messenger 1:1 Chat Engine (chat.js)
 * 100% English - No Fake Contacts, No Fake Messages
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 */

class ZukaChatEngine {
    constructor() {
        this.activeContactId = 'zuka_ai_contact';
        this.messageListeners = [];
        this.typingListeners = [];
        this.typingState = {};
        this.realtimeChannel = null;
        this.initRealtime();
    }

    aiContact() {
        return {
            id: 'zuka_ai_contact',
            name: 'ZUKA AI',
            username: 'zuka_ai',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            is_ai: true,
            is_online: true,
            last_msg: '',
            last_time: '',
            unread: 0,
            theme: '#1877F2'
        };
    }

    currentUserId() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        return currentUser ? currentUser.id : null;
    }

    async getContacts() {
        const ai = this.aiContact();
        if (!window.supabaseClient) return [ai];

        try {
            const { data: contacts, error } = await window.supabaseClient
                .from('chat_contacts')
                .select('*')
                .order('last_time', { ascending: false });

            if (error) throw error;

            const cleanContacts = contacts || [];
            if (!cleanContacts.some(c => String(c.id) === 'zuka_ai_contact')) {
                cleanContacts.unshift(ai);
            }
            return cleanContacts;
        } catch (e) {
            console.error("Error fetching chat contacts from Supabase:", e);
            return [ai];
        }
    }

    async getConversationPeer(contactId) {
        if (!window.supabaseClient) return null;
        try {
            const { data, error } = await window.supabaseClient
                .from('profiles')
                .select('id, full_name, username, avatar_url')
                .eq('id', contactId)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        } catch (e) {
            return null;
        }
    }

    async getMessages(contactId) {
        if (contactId === 'zuka_ai_contact' && window.ZukaAIChat) {
            return window.ZukaAIChat.getMessages().map(m => ({
                id: m.id,
                sender_id: m.sender === 'user' ? 'me' : 'zuka_ai_contact',
                text: m.message,
                media_url: null,
                voice_note_url: null,
                message_type: 'text',
                is_pay: false,
                pay_amount: 0,
                is_seen: true,
                is_disappearing: false,
                disappear_after_seconds: 0,
                status: 'seen',
                time: m.created_at || '',
                created_at: m.created_at || new Date().toISOString()
            }));
        }

        const me = this.currentUserId();
        if (!window.supabaseClient || !me) return [];

        try {
            const { data: messages, error } = await window.supabaseClient
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${me},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return (messages || []).map(m => this.mapMessage(m, me));
        } catch (e) {
            console.error("Error fetching message history from Supabase:", e);
            return [];
        }
    }

    mapMessage(m, me) {
        const isPay = m.message_type === 'pay';
        let payAmount = 0;
        if (isPay && m.content) {
            const match = String(m.content).match(/TZS\s?([\d,]+)/i);
            if (match) payAmount = Number(String(match[1]).replace(/,/g, '')) || 0;
        }
        return {
            id: m.id,
            sender_id: m.sender_id === me ? 'me' : m.sender_id,
            text: m.content || '',
            media_url: m.media_url || null,
            voice_note_url: m.voice_note_url || null,
            message_type: m.message_type || 'text',
            is_pay: isPay,
            pay_amount: payAmount,
            is_seen: !!m.is_seen,
            is_disappearing: !!m.is_disappearing,
            disappear_after_seconds: m.disappear_after_seconds || 0,
            status: m.sender_id === me ? (m.is_seen ? 'seen' : 'delivered') : 'seen',
            time: m.created_at || '',
            created_at: m.created_at || new Date().toISOString()
        };
    }

    async sendMessage({ contactId, text, mediaUrl, voiceUrl, isPay = false, payAmount = 0, disappearAfterSeconds = 0 }) {
        if (!contactId) throw new Error('Please select a contact to chat with.');

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        if (text && window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Message blocked by AI Moderation: ${scan.reason}`);
            }
        }

        if (contactId === 'zuka_ai_contact' && window.ZukaAIChat) {
            return window.ZukaAIChat.reply(text);
        }

        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        if (!currentUser) {
            throw new Error('Please log in to send messages.');
        }

        let messageType = 'text';
        let content = text || '';

        if (isPay) {
            messageType = 'pay';
            content = `Sent TZS ${Number(payAmount).toLocaleString()}`;
        } else if (voiceUrl) {
            messageType = 'voice';
            content = text || '';
        } else if (mediaUrl) {
            messageType = 'image';
            content = text || '';
        }

        const newMsg = {
            sender_id: currentUser.id,
            receiver_id: contactId,
            content: content,
            media_url: mediaUrl || null,
            voice_note_url: voiceUrl || null,
            message_type: messageType,
            is_seen: false,
            is_disappearing: !!disappearAfterSeconds,
            disappear_after_seconds: disappearAfterSeconds || 0,
            created_at: new Date().toISOString()
        };

        const { data: savedMsg, error: msgError } = await window.supabaseClient
            .from('messages')
            .insert([newMsg])
            .select()
            .single();

        if (msgError) throw msgError;

        const lastMessageSnippet = messageType === 'pay'
            ? `Sent TZS ${Number(payAmount).toLocaleString()}`
            : (messageType === 'voice' ? '🎤 Voice note' : (messageType === 'image' ? '📷 Photo' : (text || 'Message')));

        await this.upsertContactSummary(contactId, lastMessageSnippet);

        if (window.ZukaSupabase && window.ZukaSupabase.broadcast) {
            window.ZukaSupabase.broadcast('new_chat_message', this.mapMessage(savedMsg, currentUser.id));
        }

        return savedMsg;
    }

    async upsertContactSummary(contactId, snippet) {
        if (!window.supabaseClient) return;
        try {
            const { data: existing, error: checkError } = await window.supabaseClient
                .from('chat_contacts')
                .select('id')
                .eq('id', contactId)
                .maybeSingle();

            if (checkError) throw checkError;

            const patch = {
                last_msg: snippet,
                last_time: new Date().toISOString()
            };

            if (existing) {
                await window.supabaseClient
                    .from('chat_contacts')
                    .update(patch)
                    .eq('id', contactId);
            } else {
                const peer = await this.getConversationPeer(contactId);
                await window.supabaseClient
                    .from('chat_contacts')
                    .insert([{
                        id: contactId,
                        name: peer ? (peer.full_name || peer.username || 'ZUKA Member') : 'ZUKA Member',
                        avatar: peer ? (peer.avatar_url || '') : '',
                        is_ai: false,
                        is_online: false,
                        last_msg: snippet,
                        last_time: new Date().toISOString(),
                        unread: 0,
                        theme: '#1877F2'
                    }]);
            }
        } catch (e) {
            console.error("Error updating chat contact summary:", e);
        }
    }

    async markAsSeen(contactId) {
        const me = this.currentUserId();
        if (!window.supabaseClient || !me || contactId === 'zuka_ai_contact') return;

        try {
            await window.supabaseClient
                .from('messages')
                .update({ is_seen: true })
                .eq('sender_id', contactId)
                .eq('receiver_id', me)
                .eq('is_seen', false);
        } catch (e) {
            console.error("Error marking messages as seen:", e);
        }
    }

    async deleteMessage(msgId) {
        if (!window.supabaseClient) return;

        const { error } = await window.supabaseClient
            .from('messages')
            .delete()
            .eq('id', msgId);

        if (error) {
            console.error("Error performing database row deletion for message:", error);
        }
    }

    async clearConversation(contactId) {
        const me = this.currentUserId();
        if (!window.supabaseClient || !me) return;

        try {
            await window.supabaseClient
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${me},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me})`);
        } catch (e) {
            console.error("Error clearing conversation:", e);
        }
    }

    async getUnreadTotal() {
        if (!window.supabaseClient) return 0;
        try {
            const { data, error } = await window.supabaseClient
                .from('chat_contacts')
                .select('unread');
            if (error) throw error;
            return (data || []).reduce((sum, c) => sum + (Number(c.unread) || 0), 0);
        } catch (e) {
            return 0;
        }
    }

    setTyping(contactId, typing) {
        const me = this.currentUserId();
        if (window.ZukaSupabase && window.ZukaSupabase.broadcast) {
            window.ZukaSupabase.broadcast('chat_typing', { contactId, by: me || 'me', typing });
        }
        this.emitTyping({ contactId, by: me || 'me', typing });
    }

    onTyping(cb) {
        this.typingListeners.push(cb);
    }

    emitTyping(payload) {
        this.typingListeners.forEach(cb => {
            try { cb(payload); } catch (e) { /* ignore */ }
        });
    }

    onMessage(cb) {
        this.messageListeners.push(cb);
    }

    emitMessage(payload) {
        this.messageListeners.forEach(cb => {
            try { cb(payload); } catch (e) { /* ignore */ }
        });
    }

    initRealtime() {
        if (window.ZukaSupabase && window.ZukaSupabase.subscribe) {
            window.ZukaSupabase.subscribe('new_chat_message', (msg) => this.emitMessage(msg));
            window.ZukaSupabase.subscribe('chat_typing', (t) => {
                this.typingState[t.contactId] = t.typing;
                this.emitTyping(t);
            });
        }

        if (!window.supabaseClient) return;

        try {
            this.realtimeChannel = window.supabaseClient
                .channel('zuka-messages-realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, (payload) => {
                    const me = this.currentUserId();
                    const row = payload.new || {};
                    if (me && row.sender_id !== me && row.receiver_id !== me) return;
                    this.emitMessage(this.mapMessage(row, me || row.receiver_id));
                })
                .subscribe();
        } catch (e) {
            console.error("Realtime subscription for messages failed:", e);
        }
    }
}

window.ZukaChat = new ZukaChatEngine();
