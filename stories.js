/**
 * ZUKA - 24h Stories Engine (stories.js)
 * 100% English - No Fake Stories, No Fake Viewers
 */

class ZukaStoriesEngine {
    constructor() {
        this.initStories();
    }

    initStories() {
        let stories = window.ZukaDB.get('stories');
        if (!stories) {
            stories = [];
            window.ZukaDB.set('stories', stories);
        }
    }

    getStories() {
        return window.ZukaDB.get('stories') || [];
    }

    async createStory({ mediaUrl, caption, musicTrack }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create a story.');

        if (caption) {
            const scan = window.ZukaAIModerator.scanContent(caption, currentUser.id);
            if (scan.action === 'AUTO_BLOCK') {
                throw new Error(`Story blocked: ${scan.reason}`);
            }
        }

        if (mediaUrl) {
            const imgCheck = window.ZukaAIModerator.checkImage(mediaUrl);
            if (imgCheck.action === 'AUTO_BLOCK') {
                throw new Error('Explicit image blocked in Story.');
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
            music_track: musicTrack || '',
            viewers_count: 0,
            viewers_list: [],
            expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            created_at: new Date().toISOString()
        };

        const stories = window.ZukaDB.get('stories') || [];
        stories.unshift(newStory);
        window.ZukaDB.set('stories', stories);
        return newStory;
    }

    deleteStory(storyId) {
        let stories = window.ZukaDB.get('stories') || [];
        stories = stories.filter(s => s.id !== storyId);
        window.ZukaDB.set('stories', stories);
    }
}

window.ZukaStories = new ZukaStoriesEngine();
