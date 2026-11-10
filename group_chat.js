/**
 * ZUKA - Group Chat Engine (group_chat.js)
 * 100% English - No Fake Groups, No Fake Messages
 */

class ZukaGroupChatEngine {
    constructor() {
        this.initGroupChats();
    }

    initGroupChats() {
        let groupChats = window.ZukaDB.get('group_chats');
        if (!groupChats) {
            groupChats = [];
            window.ZukaDB.set('group_chats', groupChats);
        }
    }

    getGroupChats() {
        return window.ZukaDB.get('group_chats') || [];
    }

    getGroupChatByCommunity(groupId) {
        const chats = this.getGroupChats();
        return chats.find(c => c.group_id === groupId);
    }

    createGroupChatForCommunity(group) {
        const chats = this.getGroupChats();
        const exists = chats.some(c => c.group_id === group.id);
        if (!exists) {
            chats.push({
                id: 'gc_' + group.id,
                name: `Chat for ${group.name}`,
                group_id: group.id,
                avatar: group.cover_url || '',
                is_community_chat: true,
                members_count: 1,
                is_muted: false,
                messages: [
                    { id: 'gm_init', user_name: 'ZUKA Bot', text: `Group chat for ${group.name} is now open!`, time: 'Just now' }
                ]
            });
            window.ZukaDB.set('group_chats', chats);
        }
    }

    sendGroupMessage(chatId, text) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`Message blocked in Group Chat: ${scan.reason}`);
        }

        const chats = this.getGroupChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const newMsg = {
            id: 'gm_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'Member',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (!chat.messages) chat.messages = [];
        chat.messages.push(newMsg);
        window.ZukaDB.set('group_chats', chats);
        return newMsg;
    }

    toggleMute(chatId) {
        const chats = this.getGroupChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.is_muted = !chat.is_muted;
            window.ZukaDB.set('group_chats', chats);
            return chat.is_muted;
        }
    }

    deleteMessageInGroup(chatId, msgId) {
        const chats = this.getGroupChats();
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages = (chat.messages || []).filter(m => m.id !== msgId);
            window.ZukaDB.set('group_chats', chats);
        }
    }
}

window.ZukaGroupChat = new ZukaGroupChatEngine();
