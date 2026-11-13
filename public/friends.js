/**
 * ZUKA - Friends Engine (friends.js)
 * 100% English - No Fake Requests, No Fake Suggestions
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaFriendsEngine {
    constructor() {
        this.initFriends();
    }

    initFriends() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getRequests() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return [];

        const { data: requests, error } = await window.supabaseClient
            .from('friend_requests')
            .select('*')
            .eq('recipient_id', currentUser.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching friend requests:", error);
            return [];
        }

        return requests || [];
    }

    async acceptRequest(requestId) {
        if (!window.supabaseClient) return false;

        // 1. Fetch request details to resolve the sender's identity
        const { data: req, error: fetchError } = await window.supabaseClient
            .from('friend_requests')
            .select('sender_id, status')
            .eq('id', requestId)
            .maybeSingle();

        if (fetchError || !req) return false;

        // 2. Perform an atomic database status change
        const { error: updateError } = await window.supabaseClient
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (currentUser) {
            if (!currentUser.close_friends) currentUser.close_friends = [];
            if (!currentUser.close_friends.includes(req.sender_id)) {
                currentUser.close_friends.push(req.sender_id);
            }
            await window.ZukaAuth.setCurrentUser(currentUser);
        }
        return true;
    }

    async declineRequest(requestId) {
        if (!window.supabaseClient) return false;

        const { error } = await window.supabaseClient
            .from('friend_requests')
            .delete()
            .eq('id', requestId);

        if (error) {
            console.error("Error performing database row deletion for friend request:", error);
            return false;
        }
        return true;
    }

    async getSuggestions() {
        if (!window.supabaseClient) return [];

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return [];

        try {
            // 1. Fetch all users from Supabase
            const { data: allUsers, error: usersError } = await window.supabaseClient
                .from('users')
                .select('id, full_name, username, avatar_url, work');

            if (usersError) throw usersError;

            // 2. Fetch relevant friend requests to calculate exclusions
            const { data: requests, error: requestsError } = await window.supabaseClient
                .from('friend_requests')
                .select('sender_id, recipient_id')
                .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`);

            if (requestsError) throw requestsError;

            // Map all IDs involved in existing requests
            const mappedIds = (requests || []).flatMap(r => [r.sender_id, r.recipient_id]);
            const closeFriendsList = currentUser.close_friends || [];

            return (allUsers || [])
                .filter(u => u.id !== currentUser.id)
                .filter(u => !closeFriendsList.includes(u.id))
                .filter(u => !mappedIds.includes(u.id))
                .map(u => ({
                    id: u.id,
                    name: u.full_name || u.username || '',
                 avatar: u.avatar_url || '',
                    mutual: '',
                    work: u.work || ''
                }));

        } catch (e) {
            console.error("Error computing user social suggestions:", e);
            return [];
        }
    }
}

window.ZukaFriends = new ZukaFriendsEngine();
