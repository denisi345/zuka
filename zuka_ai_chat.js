/**
 * ZUKA Super App - ZUKA AI Messenger Contact (zuka_ai_chat.js)
 * Implements a natural, friendly chat contact named "ZUKA AI" inside Messenger.
 * DEFAULT Language: English (US), with full multi-lingual support (Kiswahili, French, Spanish, Arabic).
 * Helps write viral posts, tells jokes, gives advice, translates languages, solves questions.
 */

class ZukaAIChatService {
    constructor() {
        this.contactInfo = {
            id: 'zuka_ai_contact',
            username: 'zuka_ai',
            full_name: 'ZUKA AI 🤖',
            avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
            is_verified: true,
            status: 'Active now (Online)',
            bio: 'Your personal intelligent assistant on ZUKA. Ask me anything in English, Kiswahili, or any language!'
        };

        this.initHistory();
    }

    initHistory() {
        let history = window.ZukaDB.get('ai_chat_messages');
        const lang = window.ZukaI18n ? window.ZukaI18n.getLanguage() : 'en';

        if (history.length === 0) {
            const welcomeMsg = (lang === 'sw')
                ? 'Habari rafiki yangu! Mimi ni **ZUKA AI** 🤖, msaidizi wako rasmi hapa ZUKA.\n\nNaweza kukusaidia:\n✨ Kuandika posti nzuri zenye kuvutia likes nyingi\n😂 Kukupa vichekesho na burudani\n🌍 Kutafsiri lugha (Kiswahili ⇄ English)\n📚 Kusaidia maswali ya masomo au ushauri wa kimaisha\n\nNiambie, leo nikusaidie nini?'
                : 'Hi there! I am **ZUKA AI** 🤖, your smart personal assistant on ZUKA.\n\nI can help you with:\n✨ Writing engaging, high-reach posts & captions\n😂 Telling jokes and fun stories\n🌍 Translating between languages (English ⇄ Kiswahili, etc.)\n📚 Homework help, creative ideas, and daily advice\n\nHow can I help you today?';

            history = [
                {
                    id: 'ai_msg_0',
                    sender: 'ai',
                    message: welcomeMsg,
                    created_at: new Date(Date.now() - 3600000).toISOString()
                }
            ];
            window.ZukaDB.set('ai_chat_messages', history);
        }
    }

    getMessages() {
        return window.ZukaDB.get('ai_chat_messages');
    }

    clearHistory() {
        window.ZukaDB.set('ai_chat_messages', []);
        this.initHistory();
    }

    async reply(userText) {
        const text = userText.trim();
        const lower = text.toLowerCase();

        // Save user message
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
        const isSwahiliInput = /habari|mambo|niaje|vipi|asante|chekesho|vichekesho|ushauri|posti|tafsiri/.test(lower);
        const currentLang = window.ZukaI18n ? window.ZukaI18n.getLanguage() : 'en';

        // Jokes
        if (lower.includes('joke') || lower.includes('chekesho') || lower.includes('funny')) {
            if (isSwahiliInput || currentLang === 'sw') {
                return "Haha! Mwalimu alimuuliza Juma: 'Kwa nini hujaandika homework yako?' Juma akajibu: 'Mwalimu, daftari langu liliamua kuchukua likizo fupi ya kisaikolojia!' 😂";
            }
            return "Why do programmers prefer dark mode? Because light attracts bugs! 😂💻 Here's another: Why did the computer catch a cold? Because it left its Windows open! 🤣";
        }

        // Post writing help
        if (lower.includes('post') || lower.includes('caption') || lower.includes('write') || lower.includes('andika')) {
            if (isSwahiliInput || currentLang === 'sw') {
                return `Hapa kuna wazo zuri la posti litakalowavutia marafiki zako ZUKA: 🚀\n\n"Mafanikio ya kweli hayaji kwa kulalamika, bali kwa kuchukua hatua madhubuti kila siku. Anza kidogo lakini usikome kamwe! 💪✨\n\n#Maisha #Motisha #ZukaCommunity #KaziKazi"`;
            }
            return `Here is a high-engagement post idea crafted for you: 🚀\n\n"Success isn't about giant leaps; it's about the small, intentional steps you take every single day. Keep showing up, keep building, and trust the process! 💪✨\n\n#DailyMotivation #GrowthMindset #ZukaCommunity #Inspiration"`;
        }

        // Translation
        if (lower.includes('translate') || lower.includes('tafsiri')) {
            if (lower.includes('karibu')) return `'Karibu' in English translates to: **'Welcome'** or **'You're welcome'**.`;
            if (lower.includes('hello')) return `'Hello' in Kiswahili translates to: **'Habari'** or **'Jambo'**.`;
            return `I'm ready to translate! Send me any sentence in English, Swahili, French, Spanish, or Arabic.`;
        }

        // Advice
        if (lower.includes('advice') || lower.includes('ushauri') || lower.includes('tip')) {
            if (isSwahiliInput || currentLang === 'sw') {
                return `Ushauri wangu kwako leo: Chukua muda wa kupumua na kupanga vipaumbele vyako. Jiunge na vikundi vya ZUKA vinavyohusiana na malengo yako ujifunze kutoka kwa wengine! 💡`;
            }
            return `Here's my piece of advice for you today: Focus on consistency over intensity. Also, join relevant ZUKA Groups to network with people who share your aspirations and can elevate your journey! 🌟`;
        }

        // Greetings
        if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey') || lower.includes('mambo') || lower.includes('habari')) {
            if (isSwahiliInput || currentLang === 'sw') {
                return `Poa sana! Mambo vipi rafiki? Nipo hapa kukusaidia chochote unachohitaji kwenye ZUKA! 🔥`;
            }
            return `Hello there! Wonderful to chat with you. How can I assist you on ZUKA today? 😊`;
        }

        // Default
        if (isSwahiliInput || currentLang === 'sw') {
            return `Asante kwa ujumbe wako! Kwenye ZUKA, nipo hapa kuhakikisha unapata uzoefu bora zaidi. Niambie chochote nami nitakusaidia mara moja! 🌟`;
        }
        return `Thank you for your message! As your ZUKA AI assistant, I'm here to make your experience seamless. Whether you need a caption, translation, advice, or quick answer, just let me know! 🌟`;
    }
}

window.ZukaAIChat = new ZukaAIChatService();
