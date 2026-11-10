/**
 * ZUKA Super App - Watch Engine (watch.js)
 * Implements Facebook Video / For You feed with vertical swipe, comments, likes, saves, and shares.
 * 100% English (US)
 */

class ZukaWatchEngine {
    constructor() {
        this.initVideos();
    }

    initVideos() {
        let videos = window.ZukaDB.get('watch_videos');
        // Force refresh if previous storage had Swahili strings
        const hasSwahili = videos.some(v => v.title && (v.title.includes('Makala') || v.title.includes('Mlima') || v.category === 'Michezo'));
        if (videos.length === 0 || hasSwahili) {
            videos = [
                {
                    id: 'vid_01',
                    title: 'Breathtaking Aerial Expedition: Exploring Majestic Mountain Peaks & African Safari Horizons',
                    creator_id: 'usr_sarah_02',
                    creator_name: 'Wild Africa Expeditions',
                    creator_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42407-large.mp4',
                    thumbnail_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=900',
                    audio_track: 'Wilderness Horizons - Cinematic Strings 🎵',
                    category: 'Documentary',
                    likes_count: 14200,
                    comments_count: 840,
                    shares_count: 3200,
                    is_liked: false,
                    is_saved: false,
                    is_following: false,
                    comments: [
                        { id: 'c1', user_name: 'David Miller', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', text: 'This cinematography is absolute world-class! Truly spectacular footage.', time: '2h ago' },
                        { id: 'c2', user_name: 'Grace Taylor', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'Added to my bucket list immediately! ❤️', time: '45m ago' }
                    ]
                },
                {
                    id: 'vid_02',
                    title: 'Championship Moments: Unbelievable Plays & Electrifying Stadium Atmosphere Under the Lights 🏆',
                    creator_id: 'usr_alex_03',
                    creator_name: 'Pro Arena Sports',
                    creator_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-stadium-lights-and-fans-screaming-40751-large.mp4',
                    thumbnail_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900',
                    audio_track: 'Arena Anthem - Bass Boosted Mix ⚡',
                    category: 'Sports',
                    likes_count: 28900,
                    comments_count: 1540,
                    shares_count: 6100,
                    is_liked: false,
                    is_saved: false,
                    is_following: true,
                    comments: [
                        { id: 'c3', user_name: 'Marcus Vance', user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', text: 'Nothing beats that stadium roar in overtime! Unmatched energy.', time: '3h ago' }
                    ]
                },
                {
                    id: 'vid_03',
                    title: 'Culinary Masterclass: Handcrafting Artisanal Gourmet Pasta with Chef Antonio 🍝',
                    creator_id: 'usr_chef_08',
                    creator_name: 'Chef Fatma Kitchen',
                    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-with-great-mastery-42861-large.mp4',
                    thumbnail_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900',
                    audio_track: 'Acoustic Bistro - Warm Sunday Vibes 🍳',
                    category: 'Food',
                    likes_count: 36500,
                    comments_count: 2180,
                    shares_count: 8400,
                    is_liked: false,
                    is_saved: false,
                    is_following: false,
                    comments: [
                        { id: 'c4', user_name: 'Sophia Chen', user_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', text: 'The dough technique here is flawless! Tried this tonight and it turned out amazing.', time: '1h ago' }
                    ]
                },
                {
                    id: 'vid_04',
                    title: 'Night Coding Symphony: Building Next-Gen High-Speed Cloud Architecture in Dark Mode ⚡',
                    creator_id: 'usr_tech_07',
                    creator_name: 'Silicon Lab Beats',
                    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-in-a-dark-room-43308-large.mp4',
                    thumbnail_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=900',
                    audio_track: 'Midnight Lo-Fi - Synthetic Dreams 🎧',
                    category: 'Technology',
                    likes_count: 19800,
                    comments_count: 940,
                    shares_count: 4200,
                    is_liked: false,
                    is_saved: false,
                    is_following: true,
                    comments: [
                        { id: 'c5', user_name: 'Kevin O\'Connor', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', text: 'Cleanest mechanical keyboard sound ever recorded. Pure focus fuel.', time: '5h ago' }
                    ]
                }
            ];
            window.ZukaDB.set('watch_videos', videos);
        }
    }

    getVideos(category = 'All') {
        const videos = window.ZukaDB.get('watch_videos');
        if (!category || category === 'All') return videos;
        return videos.filter(v => v.category === category || (category === 'Saved' && v.is_saved));
    }

    toggleLikeVideo(videoId) {
        const videos = window.ZukaDB.get('watch_videos');
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
        const videos = window.ZukaDB.get('watch_videos');
        const v = videos.find(item => item.id === videoId);
        if (v) {
            v.is_following = !v.is_following;
            window.ZukaDB.set('watch_videos', videos);
            return v.is_following;
        }
        return false;
    }

    toggleSave(videoId) {
        const videos = window.ZukaDB.get('watch_videos');
        const v = videos.find(item => item.id === videoId);
        if (v) {
            v.is_saved = !v.is_saved;
            window.ZukaDB.set('watch_videos', videos);
            return v.is_saved;
        }
        return false;
    }

    addComment(videoId, commentText) {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        const videos = window.ZukaDB.get('watch_videos');
        const v = videos.find(item => item.id === videoId);
        if (!v) return null;

        if (!v.comments) v.comments = [];
        const newC = {
            id: 'c_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'You',
            user_avatar: currentUser ? currentUser.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            text: commentText,
            time: 'Just now'
        };
        v.comments.push(newC);
        v.comments_count = (v.comments_count || 0) + 1;
        window.ZukaDB.set('watch_videos', videos);
        return newC;
    }
}

window.ZukaWatch = new ZukaWatchEngine();
