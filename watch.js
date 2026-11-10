/**
 * ZUKA Super App - Watch Engine (watch.js)
 * Implements Facebook Video / For You feed with vertical swipe, comments, likes, saves, and shares.
 * 100% English (US) - No Fake Videos, No Fake Counts, No Fake Comments
 */

class ZukaWatchEngine {
    constructor() {
        this.initVideos();
    }

    initVideos() {
        let videos = window.ZukaDB.get('watch_videos');
        if (!videos) {
            videos = [];
            window.ZukaDB.set('watch_videos', videos);
        }
    }

    getVideos(category = 'All') {
        const videos = window.ZukaDB.get('watch_videos') || [];
        if (!category || category === 'All') return videos;
        return videos.filter(v => v.category === category || (category === 'Saved' && v.is_saved));
    }

    addVideo({ title, videoUrl, thumbnailUrl, audioTrack, category }) {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('You must log in first to upload a video.');
        if (!videoUrl) throw new Error('Video URL is required.');

        const newVideo = {
            id: 'vid_' + Date.now().toString(36),
            title: title || '',
            creator_id: currentUser.id,
            creator_name: currentUser.full_name,
            creator_avatar: currentUser.avatar_url || '',
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl || '',
            audio_track: audioTrack || '',
            category: category || 'General',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            is_liked: false,
            is_saved: false,
            is_following: false,
            comments: [],
            created_at: new Date().toISOString()
        };

        const videos = window.ZukaDB.get('watch_videos') || [];
        videos.unshift(newVideo);
        window.ZukaDB.set('watch_videos', videos);
        return newVideo;
    }

    toggleLikeVideo(videoId) {
        const videos = window.ZukaDB.get('watch_videos') || [];
        const v = videos.find(item => item.id === videoId);
        if (v) {
            v.is_liked = !v.is_liked;
            v.likes_count += v.is_liked ? 1 : -1;
            window.ZukaDB.set('watch_videos', videos);
            return v;
        }
        return null;
    }

    toggleFollow(videoId) {
        const videos = window.ZukaDB.get('watch_videos') || [];
        const v = videos.find(item => item.id === videoId);
        if (v) {
            v.is_following = !v.is_following;
            window.ZukaDB.set('watch_videos', videos);
            return v.is_following;
        }
        return false;
    }

    toggleSave(videoId) {
        const videos = window.ZukaDB.get('watch_videos') || [];
        const v = videos.find(item => item.id === videoId);
        if (v) {
            v.is_saved = !v.is_saved;
            window.ZukaDB.set('watch_videos', videos);
            return v.is_saved;
        }
        return false;
    }

    addComment(videoId, commentText) {
        if (!commentText || !commentText.trim()) return null;
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('You must log in first to comment.');
        const videos = window.ZukaDB.get('watch_videos') || [];
        const v = videos.find(item => item.id === videoId);
        if (!v) return null;

        if (!v.comments) v.comments = [];
        const newC = {
            id: 'c_' + Date.now(),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_avatar: currentUser.avatar_url || '',
            text: commentText.trim(),
            time: 'Just now',
            created_at: new Date().toISOString()
        };
        v.comments.push(newC);
        v.comments_count = (v.comments_count || 0) + 1;
        window.ZukaDB.set('watch_videos', videos);
        return newC;
    }

    deleteVideo(videoId) {
        let videos = window.ZukaDB.get('watch_videos') || [];
        videos = videos.filter(v => v.id !== videoId);
        window.ZukaDB.set('watch_videos', videos);
    }
}

window.ZukaWatch = new ZukaWatchEngine();
