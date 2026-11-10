/**
 * ZUKA Super App - Group Chat Engine (group_chat.js)
 * Implements dedicated automatic group chats for communities and user-created friend group chats.
 */

class ZukaGroupChatEngine {
    constructor() {
        this.initGroupChats();
    }

    initGroupChats() {
        let groupChats = window.ZukaDB.get('group_chats');
        if (groupChats.length === 0) {
            groupChats = [
                {
                    id: 'gc_wajasiriamali',
                    name: 'Soga ya Wajasiriamali TZ 💼',
                    group_id: 'grp_01',
                    avatar: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=150',
                    is_community_chat: true,
                    members_count: 42,
                    is_muted: false,
                    messages: [
                        { id: 'gm1', user_name: 'Sarah Kimaro', text: 'Karibuni wanachama wapya kwenye soga yetu!', time: '10:30' },
                        { id: 'gm2', user_name: 'Kelvin Mushi', text: 'Je kuna mtu mwenye uzoefu wa kusajili biashara BRELA mtandaoni?', time: '11:15' },
                        { id: 'gm3', user_name: 'Juma Salum', text: 'Ndio Kelvin, mfumo mpya wa OBRS unachukua chini ya masaa 24 kama una TIN na NIDA tayari.', time: '11:20' }
                    ]
                }
            ];
            window.ZukaDB.set('group_chats', groupChats);
        }
    }

    getGroupChats() {
        return window.ZukaDB.get('group_chats');
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
                name: `Soga ya ${group.name}`,
                group_id: group.id,
                avatar: group.cover_url,
                is_community_chat: true,
                members_count: 1,
                is_muted: false,
                messages: [
                    { id: 'gm_init', user_name: 'ZUKA Bot', text: `Soga ya kikundi cha ${group.name} imefunguliwa rasmi!`, time: 'Sasa hivi' }
                ]
            });
            window.ZukaDB.set('group_chats', chats);
        }
    }

    sendGroupMessage(chatId, text) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Ujumbe umezuiwa kwenye Group Chat: ${scan.reason}`);
        }

        const chats = this.getGroupChats();
        const chat = chats.find(c => c.id === chatId);
        if (!chat) return;

        const newMsg = {
            id: 'gm_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'Mwanachama',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

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
            chat.messages = chat.messages.filter(m => m.id !== msgId);
            window.ZukaDB.set('group_chats', chats);
        }
    }
}

window.ZukaGroupChat = new ZukaGroupChatEngine();
