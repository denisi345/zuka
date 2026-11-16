/**
 * ZUKA - Dating Engine (dating.js)
 * 100% English - No Fake Profiles, No Fake Matches
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 */

class ZukaDatingEngine {
    constructor() {
        this.initDatingProfiles();
    }

    async initDatingProfiles() {
        if (!window.supabaseClient) return;
        try {
            const { data, error } = await window.supabaseClient
                .from('dating_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            this.profiles = data || [];
        } catch (e) {
            console.error("Error initializing dating profiles:", e);
            this.profiles = [];
        }
    }

    async getProfiles() {
        if (!window.supabaseClient) return [];
        try {
            const { data, error } = await window.supabaseClient
                .from('dating_profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error("Error fetching dating profiles:", e);
            return [];
        }
    }

    async likeProfile(profileId) {
        if (!window.supabaseClient) return null;
        try {
            const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
            const { data, error } = await window.supabaseClient
                .from('matches')
                .insert([{
                    user1_id: currentUser ? currentUser.id : null,
                    user2_id: profileId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            console.error("Error liking dating profile:", e);
            return null;
        }
    }

    async passProfile(profileId) {
        if (!window.supabaseClient) return false;
        try {
            const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
            if (!currentUser) return false;
            const { error } = await window.supabaseClient
                .from('dating_profiles')
                .update({ is_passed: true })
                .eq('id', profileId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Error passing dating profile:", e);
            return false;
        }
    }
}

window.ZukaDating = new ZukaDatingEngine();