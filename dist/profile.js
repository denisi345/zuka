/**
 * ZUKA - User Profile Engine (profile.js)
 * 100% English - No Fake Data
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaProfileEngine {
    constructor() {}

    async getProfileData(userId) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        let targetUser = currentUser;

        // 1. Fetch target user profile from Supabase if a specific userId is provided
        if (userId && (!currentUser || currentUser.id !== userId)) {
            const { data: fetchedUser, error: userError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (userError) console.error("Error fetching user profile:", userError);
            if (fetchedUser) targetUser = fetchedUser;
        }

        if (!targetUser) {
            return { user: null, posts: [], photos: [], videos: [] };
        }

        // 2. Fetch all posts belonging to the target user from Supabase
        const { data: posts, error: postsError } = await window.supabaseClient
            .from('posts')
            .select('*')
            .eq('user_id', targetUser.id)
            .order('created_at', { ascending: false });

        if (postsError) {
            console.error("Error fetching user posts:", postsError);
        }

        const cleanPosts = posts || [];
        const photos = cleanPosts.filter(p => p.media_url && p.media_type === 'image');
        const videos = cleanPosts.filter(p => p.media_url && p.media_type === 'video');

        return {
            user: targetUser,
            posts: cleanPosts,
            photos,
            videos
        };
    }

    async updateBio(newBio) {
        return await window.ZukaAuth.updateProfile({ bio: newBio });
    }

    async updateDetails({ location, work, education, relationship }) {
        return await window.ZukaAuth.updateProfile({ location, work, education, relationship });
    }

    async updateAvatar(avatarUrl) {
        return await window.ZukaAuth.updateProfile({ avatar_url: avatarUrl });
    }

    async updateCover(coverUrl) {
        return await window.ZukaAuth.updateProfile({ cover_url: coverUrl });
    }

    async requestVerification(category, reason, documentUrl) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) {
            throw new Error('Please log in first to submit a Blue Tick verification request.');
        }

        const newReq = {
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            category,
            reason,
            document_url: documentUrl || '',
            status: 'pending',
            created_at: new Date().toISOString()
        };

        // Insert the blue tick verification request directly into the remote database table
        const { error: insertError } = await window.supabaseClient
            .from('verification_requests')
            .insert([newReq]);

        if (insertError) throw insertError;
        return newReq;
    }
}

window.ZukaProfile = new ZukaProfileEngine();
