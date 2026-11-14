/**
 * ZUKA - Group Chat Engine (group_chat.js)
 * 100% English - No Fake Groups, No Fake Messages
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaGroupChatEngine {
    constructor() {
        this.initGroupChats();
    }

    initGroupChats() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getGroupChats() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: chats, error } = await window.supabaseClient
            .from('messages')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error("Error fetching group chats from Supabase:", error);
            return [];
        }

        return chats || [];
    }

    async getGroupChatByCommunity(groupId) {
        if (!window.supabaseClient) return null;

        const { data: chat, error } = await window.supabaseClient
            .from('messages')
            .select('*')
            .eq('group_id', groupId)
            .maybeSingle();

        if (error) {
            console.error("Error finding target community group chat:", error);
            return null;
        }

        return chat;
    }

    async createGroupChatForCommunity(group) {
        if (!window.supabaseClient) return;

        try {
            const { data: exists, error: checkError } = await window.supabaseClient
                .from('messages')
                .select('id')
                .eq('group_id', group.id)
                .maybeSingle();

            if (checkError) throw checkError;

            if (!exists) {
                const newChat = {
                    name: `Chat for ${group.name}`,
                    group_id: group.id,
                    avatar: group.cover_url || '',
                    is_community_chat: true,
                    members_count: 1,
                    is_muted: false,
                    created_at: new Date().toISOString()
                };

                const { data: chatData, error: insertError } = await window.supabaseClient
                    .from('messages')
                    .insert([newChat])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Log a baseline greeting record directly into the sub messages table
                const initMsg = {
                    chat_id: chatData.id,
                    user_name: 'ZUKA Bot',
                    text: `Group chat for ${group.name} is now open!`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    created_at: new Date().toISOString()
                };

                await window.supabaseClient
                    .from('group_messages')
                    .insert([initMsg]);
            }
        } catch (e) {
            console.error("Failed to establish remote community group chat container:", e);
        }
    }

    async sendGroupMessage(chatId, text) {
        if (!window.supabaseClient) throw new Error('Supabase client is not initialized.');

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        if (window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Message blocked in Group Chat: ${scan.reason}`);
            }
        }

        const newMsg = {
            chat_id: chatId,
            user_name: currentUser ? currentUser.full_name : 'Member',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('group_messages')
            .insert([newMsg])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async toggleMute(chatId) {
        if (!window.supabaseClient) return false;

        const { data: chat, error: fetchError } = await window.supabaseClient
            .from('messages')
            .select('is_muted')
            .eq('id', chatId)
            .maybeSingle();

        if (fetchError || !chat) return false;

        const nextMuteState = !chat.is_muted;

        const { error: updateError } = await window.supabaseClient
            .from('messages')
            .update({ is_muted: nextMuteState })
            .eq('id', chatId);

        if (updateError) throw updateError;
        return nextMuteState;
    }

    async deleteMessageInGroup(chatId, msgId) {
        if (!window.supabaseClient) return;

        const { error } = await window.supabaseClient
            .from('group_messages')
            .delete()
            .eq('id', msgId)
            .eq('chat_id', chatId);

        if (error) {
            console.error("Error executing server-side deletion row targeting message:", error);
        }
    }
}

window.ZukaGroupChat = new ZukaGroupChatEngine();
