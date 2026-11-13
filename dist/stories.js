/**
 * ZUKA - 24h Stories Engine (stories.js)
 * 100% English - No Fake Stories, No Fake Viewers
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaStoriesEngine {
    constructor() {
        this.initStories();
    }

    initStories() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    /**
     * Fetch active non-expired stories directly via Supabase filters
     */
    async getStories() {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const nowIso = new Date().toISOString();

        // Query entries that have an expiration timestamp strictly ahead of the current runtime moment
        const { data: stories, error } = await window.supabase
            .from('stories')
            .select('*')
            .gt('expires_at', nowIso)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching live stories from Supabase:", error);
            return [];
        }

        return stories || [];
    }

    /**
     * Create a new 24h story entry record and commit it directly to the remote database
     */
    async createStory({ mediaUrl, caption, musicTrack }) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('Please log in first to create a story.');

        if (caption && window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(caption, currentUser.id);
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Story blocked: ${scan.reason}`);
            }
        }

        if (mediaUrl && window.ZukaAIModerator) {
            const imgCheck = window.ZukaAIModerator.checkImage(mediaUrl);
            if (imgCheck && imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('Explicit image blocked in Story.');
            }
        }

        const now = Date.now();
        const newStory = {
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_avatar: currentUser.avatar_url,
            media_url: mediaUrl,
            media_type: 'image',
            caption: caption || '',
            music_track: musicTrack || '',
            viewers_count: 0,
            viewers_list: [],
            expires_at: new Date(now + 24 * 3600 * 1000).toISOString(), // Exactly 24 hours lifecycle limits
            created_at: new Date(now).toISOString()
        };

        const { data, error } = await window.supabase
            .from('stories')
            .insert([newStory])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete an active story row entry from the database repository using an explicit identifier target
     */
    async deleteStory(storyId) {
        if (!window.supabase) return;

        const { error } = await window.supabase
            .from('stories')
            .delete()
            .eq('id', storyId);

        if (error) {
            console.error("Error performing database row deletion for story item:", error);
        }
    }
}

window.ZukaStories = new ZukaStoriesEngine();
