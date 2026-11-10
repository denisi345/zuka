/**
 * ZUKA - Reels Engine (reels.js)
 * 100% English - No Fake Reels, No Fake Likes, No Fake Comments
 */

class ZukaReelsEngine {
    constructor() {
        this.initReels();
    }

    initReels() {
        let reels = window.ZukaDB.get('reels');
        if (!reels) {
            reels = [];
            window.ZukaDB.set('reels', reels);
        }
    }

    getReels() {
        return window.ZukaDB.get('reels') || [];
    }

    toggleLikeReel(reelId) {
        const reels = window.ZukaDB.get('reels') || [];
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return null;
        reel.is_liked = !reel.is_liked;
        reel.likes_count += reel.is_liked ? 1 : -1;
        window.ZukaDB.set('reels', reels);
        return reel;
    }

    toggleFollowCreator(reelId) {
        const reels = window.ZukaDB.get('reels') || [];
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return false;
        reel.is_following = !reel.is_following;
        window.ZukaDB.set('reels', reels);
        return reel.is_following;
    }

    toggleSave(reelId) {
        const reels = window.ZukaDB.get('reels') || [];
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return false;
        reel.is_saved = !reel.is_saved;
        window.ZukaDB.set('reels', reels);
        return reel.is_saved;
    }

    addComment(reelId, commentText) {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        const reels = window.ZukaDB.get('reels') || [];
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return null;

        if (!reel.comments) reel.comments = [];
        const newC = {
            id: 'cr_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'You',
            user_avatar: currentUser ? currentUser.avatar_url : '',
            text: commentText,
            time: 'Just now'
        };
        reel.comments.push(newC);
        reel.comments_count = (reel.comments_count || 0) + 1;
        window.ZukaDB.set('reels', reels);
        return newC;
    }

    async createReel({ videoUrl, caption, audioTrack }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create a reel.');

        if (caption) {
            const scan = window.ZukaAIModerator.scanContent(caption, currentUser.id);
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`Reel blocked by AI: ${scan.reason}`);
            }
        }

        const newReel = {
            id: 'reel_' + Date.now().toString(36),
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

        const reels = window.ZukaDB.get('reels') || [];
        reels.unshift(newReel);
        window.ZukaDB.set('reels', reels);
        return newReel;
    }
}

window.ZukaReels = new ZukaReelsEngine();
