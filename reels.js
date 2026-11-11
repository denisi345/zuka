/**
 * ZUKA - Reels Engine (reels.js)
 * 100% English - No Fake Reels, No Fake Likes, No Fake Comments
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaReelsEngine {
    constructor() {
        this.initReels();
    }

    initReels() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getReels() {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: reels, error } = await window.supabase
            .from('reels')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching reels from Supabase:", error);
            return [];
        }

        return reels || [];
    }

    async toggleLikeReel(reelId) {
        if (!window.supabase) return null;

        const { data: reel, error: fetchError } = await window.supabase
            .from('reels')
            .select('is_liked, likes_count')
            .eq('id', reelId)
            .maybeSingle();

        if (fetchError || !reel) return null;

        const nextLikedStatus = !reel.is_liked;
        const nextLikesCount = reel.likes_count + (nextLikedStatus ? 1 : -1);

        const { data: updatedReel, error: updateError } = await window.supabase
            .from('reels')
            .update({ 
                is_liked: nextLikedStatus, 
                likes_count: Math.max(0, nextLikesCount) 
            })
            .eq('id', reelId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedReel;
    }

    async toggleFollowCreator(reelId) {
        if (!window.supabase) return false;

        const { data: reel, error: fetchError } = await window.supabase
            .from('reels')
            .select('is_following')
            .eq('id', reelId)
            .maybeSingle();

        if (fetchError || !reel) return false;

        const nextFollowStatus = !reel.is_following;

        const { error: updateError } = await window.supabase
            .from('reels')
            .update({ is_following: nextFollowStatus })
            .eq('id', reelId);

        if (updateError) throw updateError;
        return nextFollowStatus;
    }

    async toggleSave(reelId) {
        if (!window.supabase) return false;

        const { data: reel, error: fetchError } = await window.supabase
            .from('reels')
            .select('is_saved')
            .eq('id', reelId)
            .maybeSingle();

        if (fetchError || !reel) return false;

        const nextSaveStatus = !reel.is_saved;

        const { error: updateError } = await window.supabase
            .from('reels')
            .update({ is_saved: nextSaveStatus })
            .eq('id', reelId);

        if (updateError) throw updateError;
        return nextSaveStatus;
    }

    async addComment(reelId, commentText) {
        if (!window.supabase) return null;

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;

        const { data: reel, error: fetchError } = await window.supabase
            .from('reels')
            .select('comments, comments_count')
            .eq('id', reelId)
            .maybeSingle();

        if (fetchError || !reel) return null;

        const currentComments = reel.comments || [];
        const newC = {
            id: 'cr_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'You',
            user_avatar: currentUser ? currentUser.avatar_url : '',
            text: commentText,
            created_at: new Date().toISOString()
        };

        currentComments.push(newC);
        const nextCommentsCount = (reel.comments_count || 0) + 1;

        const { error: updateError } = await window.supabase
            .from('reels')
            .update({ 
                comments: currentComments, 
                comments_count: nextCommentsCount 
            })
            .eq('id', reelId);

        if (updateError) throw updateError;
        return newC;
    }

    async createReel({ videoUrl, caption, audioTrack }) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create a reel.');

        if (caption && window.ZukaAIModerator) {
            const scan = window.ZukaAIModerator.scanContent(caption, currentUser.id);
            if (scan && scan.action === 'AUTO_BLOCK') {
                throw new Error(`Reel blocked by AI: ${scan.reason}`);
            }
        }

        const newReel = {
            user_id: currentUser.id,
            creator_name: currentUser.full_name,
            creator_avatar: currentUser.avatar_url,
            video_url: videoUrl,
            caption: caption || '',
            audio_track: audioTrack || 'Original Audio',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            is_liked: false,
            is_saved: false,
            is_following: false,
            comments: [],
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabase
            .from('reels')
            .insert([newReel])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

window.ZukaReels = new ZukaReelsEngine();
