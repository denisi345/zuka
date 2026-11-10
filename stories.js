/**
 * ZUKA Super App - 24h Stories Engine (stories.js)
 * Implements Facebook-style Story bar, viewer with progress bar, music, viewer list, reply, and highlights.
 */

class ZukaStoriesEngine {
    constructor() {
        this.initStories();
    }

    initStories() {
        let stories = window.ZukaDB.get('stories');
        if (stories.length === 0) {
            stories = [
                {
                    id: 'story_01',
                    user_id: 'usr_amina_04',
                    user_name: 'Amina Rashid',
                    user_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                    media_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800',
                    media_type: 'image',
                    caption: 'Safari ya Zanzibar leo! Bahari imetulia sana 🌊🏝️',
                    music_track: 'Diamond Platnumz - Komasava 🎵',
                    viewers_count: 84,
                    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
                },
                {
                    id: 'story_02',
                    user_id: 'usr_kelvin_05',
                    user_name: 'Kelvin Mushi',
                    user_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
                    media_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
                    media_type: 'image',
                    caption: 'Coding marathon usiku kucha! 💻🔥 #ZukaDevs',
                    music_track: 'Harmonize - Single Again 🎵',
                    viewers_count: 120,
                    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
                },
                {
                    id: 'story_03',
                    user_id: 'usr_neema_06',
                    user_name: 'Neema Mwangi',
                    user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
                    media_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
                    media_type: 'image',
                    caption: 'Mkesha wa sherehe za mwisho wa mwaka! 🥳✨',
                    music_track: 'Alikiba - Dodo 🎵',
                    viewers_count: 210,
                    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
                }
            ];
            window.ZukaDB.set('stories', stories);
        }
    }

    getStories() {
        return window.ZukaDB.get('stories');
    }

    async createStory({ mediaUrl, caption, musicTrack }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kutengeneza story.');

        // AI Moderation check
        if (caption) {
            const scan = window.ZukaAIModerator.scanContent(caption, currentUser.id);
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`🚫 Story imezuiwa: ${scan.reason}`);
            }
        }

        if (mediaUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(mediaUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('🚫 Picha ya uchi imezuiwa kwenye Story.');
            }
        }

        const newStory = {
            id: 'story_' + Date.now().toString(36),
            user_id: currentUser.id,
            user_name: currentUser.full_name,
            user_avatar: currentUser.avatar_url,
            media_url: mediaUrl,
            media_type: 'image',
            caption: caption || '',
            music_track: musicTrack || 'Muziki wa Asili',
            viewers_count: 1,
            viewers_list: ['Juma Salum'],
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            created_at: new Date().toISOString()
        };

        const stories = window.ZukaDB.get('stories');
        stories.unshift(newStory);
        window.ZukaDB.set('stories', stories);
        return newStory;
    }

    deleteStory(storyId) {
        let stories = window.ZukaDB.get('stories');
        stories = stories.filter(s => s.id !== storyId);
        window.ZukaDB.set('stories', stories);
    }
}

window.ZukaStories = new ZukaStoriesEngine();
