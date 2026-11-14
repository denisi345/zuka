/**
 * ZUKA Super App - ZUKA AI Messenger Contact (zuka_ai_chat.js)
 * Implements a natural, friendly chat contact named "ZUKA AI" inside Messenger.
 * 100% English (US) - Fully Integrated with Supabase Client & Cloudflare Deploys
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

        this.defaultWelcomeMessage = {
            id: 'ai_msg_0',
            sender: 'ai',
            message: 'Hi there! I am **ZUKA AI**, your smart personal assistant on ZUKA.\n\nI can help you with:\n- Writing engaging, high-reach posts & captions\n- Telling jokes and fun stories\n- Translating between languages\n- Homework help, creative ideas, and daily advice\n\nHow can I help you today?',
            created_at: new Date().toISOString()
        };
    }

    /**
     * Fetch AI chat history for the currently logged-in user from Supabase
     */
    async getMessages() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!window.supabaseClient || !currentUser) {
            return [this.defaultWelcomeMessage];
        }

        try {
            const { data: messages, error } = await window.supabaseClient
                .from('ai_messages')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!messages || messages.length === 0) {
                return [this.defaultWelcomeMessage];
            }

            return messages;
        } catch (e) {
            console.error("Error fetching ZUKA AI chat history from Supabase:", e);
            return [this.defaultWelcomeMessage];
        }
    }

    /**
     * Clear AI chat history for the current user in Supabase
     */
    async clearHistory() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!window.supabaseClient || !currentUser) return;

        try {
            const { error } = await window.supabaseClient
                .from('ai_messages')
                .delete()
                .eq('user_id', currentUser.id);

            if (error) throw error;
        } catch (e) {
            console.error("Error clearing ZUKA AI chat history:", e);
        }
    }

    /**
     * Save user message to Supabase, fetch AI response, and save AI reply to Supabase
     */
    async reply(userText) {
        const text = userText.trim();
        const lower = text.toLowerCase();
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        const userMsg = {
            user_id: currentUser ? currentUser.id : null,
            sender: 'user',
            message: text,
            created_at: new Date().toISOString()
        };

        // 1. Save user message to Supabase if authenticated
        if (window.supabaseClient && currentUser) {
            const { error: userMsgError } = await window.supabaseClient
                .from('ai_messages')
                .insert([userMsg]);

            if (userMsgError) {
                console.error("Error saving user prompt to Supabase:", userMsgError);
            }
        }

        let aiReplyText = '';

        // 2. Attempt live backend AI endpoint first
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
            // Fallback to built-in intelligent response generator
        }

        if (!aiReplyText) {
            aiReplyText = this.generateLocalResponse(lower, text);
        }

        const aiMsg = {
            user_id: currentUser ? currentUser.id : null,
            sender: 'ai',
            message: aiReplyText,
            created_at: new Date().toISOString()
        };

        // 3. Save AI response to Supabase and return the saved record
        if (window.supabaseClient && currentUser) {
            const { data: savedAiMsg, error: aiMsgError } = await window.supabaseClient
                .from('ai_messages')
                .insert([aiMsg])
                .select()
                .single();

            if (!aiMsgError && savedAiMsg) {
                return savedAiMsg;
            }
        }

        return { id: 'msg_ai_' + Date.now(), ...aiMsg };
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
