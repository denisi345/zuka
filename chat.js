/**
 * ZUKA Super App - Messenger & Chat Engine (chat.js)
 * Implements 1-to-1 chats, ZUKA AI contact, Realtime, Typing indicators, Voice Notes,
 * Media attachments, Themes, Disappearing messages, and ZUKA Pay Send Money.
 */

class ZukaChatEngine {
    constructor() {
        this.activeContactId = 'zuka_ai_contact';
        this.initContacts();
        this.initSampleMessages();
    }

    initContacts() {
        let contacts = window.ZukaDB.get('chat_contacts');
        if (contacts.length === 0) {
            contacts = [
                {
                    id: 'zuka_ai_contact',
                    name: 'ZUKA AI 🤖',
                    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
                    is_ai: true,
                    is_online: true,
                    last_msg: 'Habari rafiki yangu! Mimi ni ZUKA AI...',
                    last_time: 'Sasa hivi',
                    unread: 1,
                    theme: '#1877F2'
                },
                {
                    id: 'usr_sarah_02',
                    name: 'Sarah Kimaro',
                    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
                    is_ai: false,
                    is_online: true,
                    last_msg: 'Asante sana kwa ushauri wako!',
                    last_time: '14:20',
                    unread: 0,
                    theme: '#1877F2'
                },
                {
                    id: 'usr_kelvin_05',
                    name: 'Kelvin Mushi',
                    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
                    is_ai: false,
                    is_online: false,
                    last_msg: 'Tukutane ofisini kesho saa tatu asubuhi.',
                    last_time: 'Jana',
                    unread: 0,
                    theme: '#0084FF'
                },
                {
                    id: 'usr_amina_04',
                    name: 'Amina Rashid',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                    is_ai: false,
                    is_online: true,
                    last_msg: 'Picha za sherehe zimetoka vizuri sana!',
                    last_time: 'Jana',
                    unread: 0,
                    theme: '#FA3E3E'
                }
            ];
            window.ZukaDB.set('chat_contacts', contacts);
        }
    }

    initSampleMessages() {
        let messages = window.ZukaDB.get('messages');
        if (messages.length === 0) {
            messages = [
                {
                    id: 'm1',
                    chat_id: 'usr_sarah_02',
                    sender_id: 'usr_sarah_02',
                    text: 'Mambo Juma! Vipi maandalizi ya uzinduzi wa ZUKA?',
                    status: 'seen',
                    time: '14:15'
                },
                {
                    id: 'm2',
                    chat_id: 'usr_sarah_02',
                    sender_id: 'me',
                    text: 'Poa sana Sarah! Mambo yanakwenda vizuri sana, kila kitu kipo tayari. 🚀',
                    status: 'seen',
                    time: '14:18'
                },
                {
                    id: 'm3',
                    chat_id: 'usr_sarah_02',
                    sender_id: 'usr_sarah_02',
                    text: 'Asante sana kwa ushauri wako!',
                    status: 'seen',
                    time: '14:20'
                }
            ];
            window.ZukaDB.set('messages', messages);
        }
    }

    getContacts() {
        return window.ZukaDB.get('chat_contacts');
    }

    getMessages(contactId) {
        if (contactId === 'zuka_ai_contact') {
            return window.ZukaAIChat.getMessages().map(m => ({
                id: m.id,
                sender_id: m.sender === 'user' ? 'me' : 'zuka_ai_contact',
                text: m.message,
                status: 'seen',
                time: 'Sasa hivi'
            }));
        }

        const messages = window.ZukaDB.get('messages');
        return messages.filter(m => m.chat_id === contactId);
    }

    async sendMessage({ contactId, text, mediaUrl, voiceUrl, isPay = false, payAmount = 0 }) {
        const currentUser = window.ZukaAuth.getCurrentUser();

        // 1. Check AI Moderation on chat message
        if (text) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`🚫 Ujumbe umezuiwa na AI Moderation: ${scan.reason}`);
            }
        }

        // If chatting with ZUKA AI contact
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

        const messages = window.ZukaDB.get('messages');
        messages.push(newMsg);
        window.ZukaDB.set('messages', messages);

        // Update last message in contact list
        const contacts = window.ZukaDB.get('chat_contacts');
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contact.last_msg = isPay ? `💸 Ametuma TZS ${Number(payAmount).toLocaleString()}` : (text || 'Faili / Picha');
            contact.last_time = 'Sasa hivi';
            window.ZukaDB.set('chat_contacts', contacts);
        }

        // Broadcast realtime
        window.ZukaSupabase.broadcast('new_chat_message', newMsg);

        // Simulate friend auto-reply after 2.5s for realistic feel
        setTimeout(() => {
            this.simulateFriendReply(contactId);
        }, 2500);

        return newMsg;
    }

    simulateFriendReply(contactId) {
        const replies = [
            'Sawa nimekuelewa vizuri!',
            'Nipo njiani nakuja sasa hivi.',
            'Picha nzuri sana hiyo! 👏',
            'Tuwasiliane baadae kidogo nikiwa free.',
            'Asante sana kwa taarifa! 👍'
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];

        const replyMsg = {
            id: 'm_' + Date.now(),
            chat_id: contactId,
            sender_id: contactId,
            text: randomReply,
            status: 'delivered',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        };

        const messages = window.ZukaDB.get('messages');
        messages.push(replyMsg);
        window.ZukaDB.set('messages', messages);

        const contacts = window.ZukaDB.get('chat_contacts');
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
            contact.last_msg = randomReply;
            contact.last_time = 'Sasa hivi';
            window.ZukaDB.set('chat_contacts', contacts);
        }

        window.ZukaSupabase.broadcast('new_chat_message', replyMsg);
    }

    deleteMessage(msgId) {
        let messages = window.ZukaDB.get('messages');
        messages = messages.filter(m => m.id !== msgId);
        window.ZukaDB.set('messages', messages);
    }
}

window.ZukaChat = new ZukaChatEngine();
