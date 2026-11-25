/**
 * ZUKA - Messenger & Chat Engine (chat.js)
 * 100% English - No Fake Contacts, No Fake Messages, No Auto-Reply
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaChatEngine {
    constructor() {
        this.activeContactId = 'zuka_ai_contact';
        this.initContacts();
        this.initMessages();
    }

    initContacts() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    initMessages() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getContacts() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        // Fetch dynamic chat contacts row data from the remote database
        const { data: contacts, error } = await window.supabaseClient
            .from('chat_contacts')
            .select('*')
            .order('last_time', { ascending: false });

        if (error) {
            console.error("Error fetching chat contacts from Supabase:", error);
            return [];
        }

        // Always ensure ZUKA AI sits as a citable runtime baseline fallback contact
        const cleanContacts = contacts || [];
        if (!cleanContacts.some(c => c.id === 'zuka_ai_contact')) {
            cleanContacts.unshift({
                id: 'zuka_ai_contact',
                name: 'ZUKA AI',
                avatar: '',
                is_ai: true,
                is_online: true,
                last_msg: '',
                last_time: '',
                unread: 0,
                theme: '#1877F2'
            });
        }

        return cleanContacts;
    }

    async getMessages(contactId) {
        if (contactId === 'zuka_ai_contact' && window.ZukaAIChat) {
            return window.ZukaAIChat.getMessages().map(m => ({
                id: m.id,
                sender_id: m.sender === 'user' ? 'me' : 'zuka_ai_contact',
                text: m.message,
                status: 'seen',
                time: ''
            }));
        }

        if (!window.supabaseClient) return [];

        const { data: messages, error } = await window.supabaseClient
            .from('messages')
            .select('*')
            .eq('chat_id', contactId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching message history from Supabase:", error);
            return [];
        }

        return messages || [];
    }

    async sendMessage({ contactId, text, mediaUrl, voiceUrl, isPay = false, payAmount = 0 }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        if (text && window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Message blocked by AI Moderation: ${scan.reason}`);
            }
        }

        if (contactId === 'zuka_ai_contact' && window.ZukaAIChat) {
            await window.ZukaAIChat.reply(text);
            return;
        }

        const newMsg = {
            chat_id: contactId,
            sender_id: currentUser ? currentUser.id : 'me',
            text: text || '',
            media_url: mediaUrl || null,
            voice_url: voiceUrl || null,
            is_pay: !!isPay,
            pay_amount: payAmount || 0,
            status: 'delivered',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        };

        // 1. Insert message record directly into the live remote database table
        const { data: savedMsg, error: msgError } = await window.supabaseClient
            .from('messages')
            .insert([newMsg])
            .select()
            .single();

        if (msgError) throw msgError;

        // 2. Perform an atomic update on the contact summary tracking entry row cells
        const lastMessageSnippet = isPay ? `Sent TZS ${Number(payAmount).toLocaleString()}` : (text || 'File / Photo');
        
        await window.supabaseClient
            .from('chat_contacts')
            .update({
                last_msg: lastMessageSnippet,
                last_time: new Date().toISOString()
            })
            .eq('id', contactId);

        if (window.ZukaSupabase && window.ZukaSupabase.broadcast) {
            window.ZukaSupabase.broadcast('new_chat_message', savedMsg);
        }

        return savedMsg;
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
}

window.ZukaChat = new ZukaChatEngine();
