/**
 * ZUKA Super App - Reels Engine (reels.js)
 * Implements Facebook-style Vertical short videos (Reels), audio tracks, like, comments, creator follow.
 * 100% English (US)
 */

class ZukaReelsEngine {
    constructor() {
        this.initReels();
    }

    initReels() {
        let reels = window.ZukaDB.get('reels');
        // Force refresh if previous storage had Swahili strings
        const hasSwahili = reels.some(r => r.caption && (r.caption.includes('Ubunifu') || r.caption.includes('harufu') || r.caption.includes('siri')));
        if (reels.length === 0 || hasSwahili) {
            reels = [
                {
                    id: 'reel_01',
                    user_id: 'usr_sarah_02',
                    creator_name: 'Sarah Kimaro',
                    creator_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-african-girl-dancing-in-traditional-dress-41584-large.mp4',
                    caption: 'Celebrating vibrant culture and energetic rhythm! Dance is the universal language of happiness 💃✨ #ZukaReels #DanceVibes #Culture',
                    audio_track: 'Heritage Grooves - Afrobeat Rhythms 🎵',
                    likes_count: 14200,
                    comments_count: 890,
                    shares_count: 3100,
                    is_liked: false,
                    is_saved: false,
                    is_following: false,
                    comments: [
                        { id: 'cr1', user_name: 'Elena Rostova', user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', text: 'The energy in this reel is unmatched! Pure joy 🔥👏', time: '1h ago' },
                        { id: 'cr2', user_name: 'Marcus Bell', user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', text: 'Loved the choreography! Where can I learn this?', time: '30m ago' }
                    ]
                },
                {
                    id: 'reel_02',
                    user_id: 'usr_tech_07',
                    creator_name: 'ZUKA Tech Labs',
                    creator_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-typing-on-a-keyboard-in-a-dark-room-43308-large.mp4',
                    caption: 'Here is the #1 secret to writing clean code at 100x speed without bugs! ⚡ Save this reel for later! #CodingTips #Developers #Tech',
                    audio_track: 'Night Drive Lo-Fi Chill Beats 🎧',
                    likes_count: 28400,
                    comments_count: 1740,
                    shares_count: 6200,
                    is_liked: false,
                    is_saved: true,
                    is_following: true,
                    comments: [
                        { id: 'cr3', user_name: 'Daniel Wu', user_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', text: 'This shortcut changed my entire development workflow. Thank you!', time: '2h ago' }
                    ]
                },
                {
                    id: 'reel_03',
                    user_id: 'usr_chef_08',
                    creator_name: 'Chef Fatma',
                    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-chef-preparing-a-dish-with-great-mastery-42861-large.mp4',
                    caption: 'How to make authentic golden spiced aromatic biryani from scratch in under 30 minutes! 🍗🥘 #Recipes #CookingHacks #Foodie',
                    audio_track: 'Kitchen Grooves - Relaxing Acoustic Beats 🍳',
                    likes_count: 39500,
                    comments_count: 3120,
                    shares_count: 9400,
                    is_liked: false,
                    is_saved: false,
                    is_following: false,
                    comments: [
                        { id: 'cr4', user_name: 'Chloe Bennett', user_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', text: 'My mouth is literally watering! Saving this for Sunday dinner 🤤', time: '4h ago' }
                    ]
                },
                {
                    id: 'reel_04',
                    user_id: 'usr_dj_09',
                    creator_name: 'DJ Nova Live',
                    creator_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
                    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-dj-controlling-the-mixer-at-a-party-43384-large.mp4',
                    caption: 'When the drop hits at 2 AM and the whole festival comes alive! 🔊⚡ Turn your volume UP! #EDM #MusicProducer #FestivalVibes',
                    audio_track: 'Neon Horizons - Festival Mainstage Drop 🎛️',
                    likes_count: 51200,
                    comments_count: 4210,
                    shares_count: 12500,
                    is_liked: false,
                    is_saved: false,
                    is_following: false,
                    comments: [
                        { id: 'cr5', user_name: 'Sam Brooks', user_avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', text: 'That transition was insane! Track ID please!! 🔥', time: '1h ago' }
                    ]
                }
            ];
            window.ZukaDB.set('reels', reels);
        }
    }

    getReels() {
        return window.ZukaDB.get('reels');
    }

    toggleLikeReel(reelId) {
        const reels = window.ZukaDB.get('reels');
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return null;
        reel.is_liked = !reel.is_liked;
        reel.likes_count += reel.is_liked ? 1 : -1;
        window.ZukaDB.set('reels', reels);
        return reel;
    }

    toggleFollowCreator(reelId) {
        const reels = window.ZukaDB.get('reels');
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return false;
        reel.is_following = !reel.is_following;
        window.ZukaDB.set('reels', reels);
        return reel.is_following;
    }

    toggleSave(reelId) {
        const reels = window.ZukaDB.get('reels');
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return false;
        reel.is_saved = !reel.is_saved;
        window.ZukaDB.set('reels', reels);
        return reel.is_saved;
    }

    addComment(reelId, commentText) {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        const reels = window.ZukaDB.get('reels');
        const reel = reels.find(r => r.id === reelId);
        if (!reel) return null;

        if (!reel.comments) reel.comments = [];
        const newC = {
            id: 'cr_' + Date.now(),
            user_name: currentUser ? currentUser.full_name : 'You',
            user_avatar: currentUser ? currentUser.avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
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
                throw new Error(`🚫 Reel blocked by AI: ${scan.reason}`);
            }
        }

        const newReel = {
            id: 'reel_' + Date.now().toString(36),
            user_id: currentUser.id,
            creator_name: currentUser.full_name,
            creator_avatar: currentUser.avatar_url,
            video_url: videoUrl,
            caption: caption || 'New Reel on ZUKA! 🔥',
            audio_track: audioTrack || 'Original Audio 🎵',
            likes_count: 0,
            comments_count: 0,
            shares_count: 0,
            is_liked: false,
            is_saved: false,
            is_following: false,
            comments: [],
            created_at: new Date().toISOString()
        };

        const reels = window.ZukaDB.get('reels');
        reels.unshift(newReel);
        window.ZukaDB.set('reels', reels);
        return newReel;
    }
}

window.ZukaReels = new ZukaReelsEngine();
