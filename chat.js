/**
 * ZUKA - Messenger & Chat Engine (chat.js)
 * 100% English - No Fake Contacts, No Fake Messages, No Auto-Reply
 */

class ZukaChatEngine {
    constructor() {
        this.activeContactId = 'zuka_ai_contact';
        this.initContacts();
        this.initMessages();
    }

    initContacts() {
        let contacts = window.ZukaDB.get('chat_contacts');
        if (!contacts) {
            contacts = [
                {
                    id: 'zuka_ai_contact',
                    name: 'ZUKA AI',
                    avatar: '',
                    is_ai: true,
                    is_online: true,
                    last_msg: '',
                    last_time: '',
                    unread: 0,
                    theme: '#1877F2'
                }
            ];
            window.ZukaDB.set('chat_contacts', contacts);
        }
    }

    initMessages() {
        let messages = window.ZukaDB.get('messages');
        if (!messages) {
            messages = [];
            window.ZukaDB.set('messages', messages);
        }
    }

    getContacts() {
        return window.ZukaDB.get('chat_contacts') || [];
    }

    getMessages(contactId) {
        if (contactId === 'zuka_ai_contact') {
            return window.ZukaAIChat.getMessages().map(m => ({
                id: m.id,
                sender_id: m.sender === 'user' ? 'me' : 'zuka_ai_contact',
                text: m.message,
                status: 'seen',
                time: ''
            }));
        }

        const messages = window.ZukaDB.get('messages') || [];
        return messages.filter(m => m.chat_id === contactId);
    }

    async sendMessage({ contactId, text, mediaUrl, voiceUrl, isPay = false, payAmount = 0 }) {
        const currentUser = window.ZukaAuth.getCurrentUser();

        if (text) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`Message blocked by AI Moderation: ${scan.reason}`);
            }
        }

        if (contactId === 'zuka_ai_contact') {
            await window.ZukaAIChat.reply(text);
            return;
        }

        const newMsg = {
            id: 'm_' + Date.now(),
            chat_id: contactId,
            sender_id: 'me',
            text: text || '',
            media_url: mediaUrl || null,
            voice_url: voiceUrl || null,
            is_pay: !!isPay,
            pay_amount: payAmount || 0,
            status: 'delivered',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        };

        const messages = window.ZukaDB.get('messages') || [];
        messages.push(newMsg);
        window.ZukaDB.set('messages', messages);

        const contacts = window.ZukaDB.get('chat_contacts') || [];
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contact.last_msg = isPay ? `Sent TZS ${Number(payAmount).toLocaleString()}` : (text || 'File / Photo');
            contact.last_time = 'Now';
            window.ZukaDB.set('chat_contacts', contacts);
        }

        window.ZukaSupabase.broadcast('new_chat_message', newMsg);

        return newMsg;
    }

    deleteMessage(msgId) {
        let messages = window.ZukaDB.get('messages') || [];
        messages = messages.filter(m => m.id !== msgId);
        window.ZukaDB.set('messages', messages);
    }
}

window.ZukaChat = new ZukaChatEngine();
