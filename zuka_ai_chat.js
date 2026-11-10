/**
 * ZUKA Super App - ZUKA AI Messenger Contact (zuka_ai_chat.js)
 * Implements a natural, friendly chat contact named "ZUKA AI" inside Messenger.
 * 100% English (US)
 */

class ZukaAIChatService {
    constructor() {
        this.contactInfo = {
            id: 'zuka_ai_contact',
            username: 'zuka_ai',
            full_name: 'ZUKA AI',
            avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            is_verified: true,
            status: 'Active now (Online)',
            bio: 'Your personal intelligent assistant on ZUKA. Ask me anything!'
        };

        this.initHistory();
    }

    initHistory() {
        let history = window.ZukaDB.get('ai_chat_messages') || [];

        if (history.length === 0) {
            history = [
                {
                    id: 'ai_msg_0',
                    sender: 'ai',
                    message: 'Hi there! I am **ZUKA AI**, your smart personal assistant on ZUKA.\n\nI can help you with:\n- Writing engaging, high-reach posts & captions\n- Telling jokes and fun stories\n- Translating between languages\n- Homework help, creative ideas, and daily advice\n\nHow can I help you today?',
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }
            ];
            window.ZukaDB.set('ai_chat_messages', history);
        }
    }

    getMessages() {
        return window.ZukaDB.get('ai_chat_messages') || [];
    }

    clearHistory() {
        window.ZukaDB.set('ai_chat_messages', []);
        this.initHistory();
    }

    async reply(userText) {
        const text = userText.trim();
        const lower = text.toLowerCase();

        const userMsg = {
            id: 'msg_u_' + Date.now(),
            sender: 'user',
            message: text,
            created_at: new Date().toISOString()
        };
        const history = this.getMessages();
        history.push(userMsg);
        window.ZukaDB.set('ai_chat_messages', history);

        let aiReplyText = '';

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.reply) {
                    aiReplyText = data.reply;
                }
            }
        } catch (e) {
            // Local conversational fallback
        }

        if (!aiReplyText) {
            aiReplyText = this.generateLocalResponse(lower, text);
        }

        const aiMsg = {
            id: 'msg_ai_' + Date.now(),
            sender: 'ai',
            message: aiReplyText,
            created_at: new Date().toISOString()
        };
        history.push(aiMsg);
        window.ZukaDB.set('ai_chat_messages', history);

        return aiMsg;
    }

    generateLocalResponse(lower, original) {
        if (lower.includes('joke') || lower.includes('funny')) {
            return "Why do programmers prefer dark mode? Because light attracts bugs! Here's another: Why did the computer catch a cold? Because it left its Windows open!";
        }

        if (lower.includes('post') || lower.includes('caption') || lower.includes('write')) {
            return `Here is a high-engagement post idea crafted for you:\n\n"Success isn't about giant leaps; it's about the small, intentional steps you take every single day. Keep showing up, keep building, and trust the process!\n\n#DailyMotivation #GrowthMindset #ZukaCommunity #Inspiration"`;
        }

        if (lower.includes('translate')) {
            if (lower.includes('hello')) return `'Hello' in Kiswahili translates to: **'Habari'** or **'Jambo'**.`;
            return `I'm ready to translate! Send me any sentence in English, Swahili, French, Spanish, or Arabic.`;
        }

        if (lower.includes('advice') || lower.includes('tip')) {
            return `Here's my piece of advice for you today: Focus on consistency over intensity. Also, join relevant ZUKA Groups to network with people who share your aspirations and can elevate your journey!`;
        }

        if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
            return `Hello there! Wonderful to chat with you. How can I assist you on ZUKA today?`;
        }

        return `Thank you for your message! As your ZUKA AI assistant, I'm here to make your experience seamless. Whether you need a caption, translation, advice, or quick answer, just let me know!`;
    }
}

window.ZukaAIChat = new ZukaAIChatService();
