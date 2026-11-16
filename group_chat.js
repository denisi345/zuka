/**
 * ZukaGroupChatEngine - ZUKA Messenger Group Chat Engine (group_chat.js)
 * 100% English - No Fake Groups, No Fake Messages
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 */

class ZukaGroupChatEngine {
    constructor() {
        this.groupChatsCache = [];
        this.messageListeners = [];
        this.initGroupChats();
    }

    initGroupChats() {
        this.initRealtime();
    }

    async getGroupChats() {
        if (!window.supabaseClient) return [];

        try {
            const { data: chats, error } = await window.supabaseClient
                .from('group_chats')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const cleanChats = chats || [];
            for (const chat of cleanChats) {
                chat.members_count = await this.getMembersCount(chat.id);
            }
            this.groupChatsCache = cleanChats;
            return cleanChats;
        } catch (e) {
            console.error("Error fetching group chats from Supabase:", e);
            return [];
        }
    }

    async getMembersCount(chatId) {
        if (!window.supabaseClient) return 1;
        try {
            const { count, error } = await window.supabaseClient
                .from('group_chat_members')
                .select('user_id', { count: 'exact', head: true })
                .eq('chat_id', chatId);
            if (error) throw error;
            return count || 1;
        } catch (e) {
            return 1;
        }
    }

    async getGroupChatByCommunity(groupId) {
        if (!window.supabaseClient) return null;

        try {
            const { data: chat, error } = await window.supabaseClient
                .from('group_chats')
                .select('*')
                .eq('group_id', groupId)
                .maybeSingle();

            if (error) throw error;
            return chat || null;
        } catch (e) {
            console.error("Error finding target community group chat:", e);
            return null;
        }
    }

    async createGroupChatForCommunity(group) {
        if (!window.supabaseClient) return null;

        try {
            const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

            const { data: exists, error: checkError } = await window.supabaseClient
                .from('group_chats')
                .select('id')
                .eq('group_id', group.id)
                .maybeSingle();

            if (checkError) throw checkError;

            if (exists) return exists;

            const newChat = {
                name: `Chat for ${group.name}`,
                icon_url: group.cover_url || '',
                group_id: group.id,
                created_by: currentUser ? currentUser.id : null,
                is_muted: false,
                created_at: new Date().toISOString()
            };

            const { data: chatData, error: insertError } = await window.supabaseClient
                .from('group_chats')
                .insert([newChat])
                .select()
                .single();

            if (insertError) throw insertError;

            if (currentUser) {
                await window.supabaseClient
                    .from('group_chat_members')
                    .insert([{
                        chat_id: chatData.id,
                        user_id: currentUser.id,
                        role: 'admin'
                    }]);
            }

            await this.sendGroupMessage(chatData.id, `Group chat for ${group.name} is now open!`);

            return chatData;
        } catch (e) {
            console.error("Failed to establish remote community group chat container:", e);
            return null;
        }
    }

    async joinGroupChat(chatId) {
        if (!window.supabaseClient) return null;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return null;

        try {
            const { data, error } = await window.supabaseClient
                .from('group_chat_members')
                .insert([{
                    chat_id: chatId,
                    user_id: currentUser.id,
                    role: 'member'
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            return null;
        }
    }

    async getChatMembers(chatId) {
        if (!window.supabaseClient) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('group_chat_members')
                .select('user_id, role, profiles(full_name, username, avatar_url)')
                .eq('chat_id', chatId);

            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async getGroupMessages(chatId) {
        if (!window.supabaseClient) return [];

        try {
            const { data, error } = await window.supabaseClient
                .from('group_chat_messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("Error fetching group messages from Supabase:", e);
            return [];
        }
    }

    async sendGroupMessage(chatId, text) {
        if (!window.supabaseClient) throw new Error('Supabase client is not initialized.');

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        if (text && window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Message blocked in Group Chat: ${scan.reason}`);
            }
        }

        const newMsg = {
            chat_id: chatId,
            sender_id: currentUser ? currentUser.id : null,
            content: text,
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('group_chat_messages')
            .insert([newMsg])
            .select()
            .single();

        if (error) throw error;

        if (window.ZukaSupabase && window.ZukaSupabase.broadcast) {
            window.ZukaSupabase.broadcast('new_group_message', data);
        }

        return data;
    }

    async toggleMute(chatId) {
        if (!window.supabaseClient) return false;

        const { data: chat, error: fetchError } = await window.supabaseClient
            .from('group_chats')
            .select('is_muted')
            .eq('id', chatId)
            .maybeSingle();

        if (fetchError || !chat) return false;

        const nextMuteState = !chat.is_muted;

        const { error: updateError } = await window.supabaseClient
            .from('group_chats')
            .update({ is_muted: nextMuteState })
            .eq('id', chatId);

        if (updateError) throw updateError;
        return nextMuteState;
    }

    async deleteMessageInGroup(chatId, msgId) {
        if (!window.supabaseClient) return;

        const { error } = await window.supabaseClient
            .from('group_chat_messages')
            .delete()
            .eq('id', msgId)
            .eq('chat_id', chatId);

        if (error) {
            console.error("Error executing server-side deletion row targeting message:", error);
        }
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
            window.ZukaSupabase.subscribe('new_group_message', (msg) => this.emitMessage(msg));
        }

        if (!window.supabaseClient) return;

        try {
            window.supabaseClient
                .channel('zuka-group-messages-realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_chat_messages'
                }, (payload) => {
                    this.emitMessage(payload.new || {});
                })
                .subscribe();
        } catch (e) {
            console.error("Realtime subscription for group messages failed:", e);
        }
    }
}

window.ZukaGroupChat = new ZukaGroupChatEngine();
