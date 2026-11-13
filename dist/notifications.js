/**
 * ZUKA - Notifications Engine (notifications.js)
 * 100% English - No Fake Notifications
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaNotificationsEngine {
    constructor() {
        this.initNotifications();
    }

    initNotifications() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getNotifications() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return [];

        const { data: notifications, error } = await window.supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications from Supabase:", error);
            return [];
        }

        return notifications || [];
    }

    async getUnreadCount() {
        if (!window.supabaseClient) return 0;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return 0;

        const { count, error } = await window.supabaseClient
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);

        if (error) {
            console.error("Error counting unread notifications:", error);
            return 0;
        }

        return count || 0;
    }

    async markAllAsRead() {
        if (!window.supabaseClient) return;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return;

        const { error } = await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', currentUser.id)
            .eq('is_read', false);

        if (error) {
            console.error("Error marking notifications as read:", error);
        }
    }

    async send({ userId, actorName, actorAvatar, type, content }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const newNotif = {
            user_id: userId,
            actor_name: actorName,
            actor_avatar: actorAvatar,
            type,
            content,
            is_read: false,
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('notifications')
            .insert([newNotif])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

window.ZukaNotifications = new ZukaNotificationsEngine();
