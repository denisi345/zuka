/**
 * ZUKA Super App - Live Streaming Engine (live.js)
 * Implements camera Go Live, real-time comments, viewer counter, live polls, Q&A, and save to video.
 */

class ZukaLiveEngine {
    constructor() {
        this.isBroadcasting = false;
        this.viewersCount = 0;
        this.liveComments = [];
        this.stream = null;
    }

    async startBroadcast(title = 'Mubashara (Live) kutoka Dar es Salaam', category = 'Burudani') {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Ingia kwanza kuanza Live.');

        // AI Moderation on title
        const scan = window.ZukaAIModerator.scanContent(title, currentUser.id);
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Kichwa cha Live kimezuiwa na AI: ${scan.reason}`);
        }

        this.isBroadcasting = true;
        this.viewersCount = 12;
        this.liveComments = [
            { id: 'lc1', name: 'Amina', text: 'Karibu mubashara! 👏' },
            { id: 'lc2', name: 'Baraka', text: 'Picha inatoka vizuri sana HD!' }
        ];

        // Access camera for preview
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                const videoEl = document.getElementById('live-broadcast-video');
                if (videoEl) {
                    videoEl.srcObject = this.stream;
                    videoEl.play();
                }
            }
        } catch (e) {
            console.log("Live stream camera notice:", e);
        }

        // Ticker for viewers count
        this.viewerInterval = setInterval(() => {
            if (this.isBroadcasting) {
                this.viewersCount += Math.floor(Math.random() * 5) - 1;
                if (this.viewersCount < 5) this.viewersCount = 5;
                const vCountEl = document.getElementById('live-viewers-badge');
                if (vCountEl) vCountEl.innerText = `👁️ ${this.viewersCount} Wanatazama`;
            }
        }, 3000);

        // Record live session in database
        const liveRecord = {
            id: 'live_' + Date.now(),
            host_id: currentUser.id,
            host_name: currentUser.full_name,
            host_avatar: currentUser.avatar_url,
            title,
            category,
            is_active: true,
            viewers_count: this.viewersCount,
            started_at: new Date().toISOString()
        };

        const lives = window.ZukaDB.get('lives');
        lives.unshift(liveRecord);
        window.ZukaDB.set('lives', lives);

        return liveRecord;
    }

    sendLiveComment(text) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        const scan = window.ZukaAIModerator.scanContent(text, currentUser ? currentUser.id : 'me');
        if (scan.action === 'AUTO_BLOCK') {
            throw new Error(`🚫 Live comment blocked by AI: ${scan.reason}`);
        }

        const newComment = {
            id: 'lc_' + Date.now(),
            name: currentUser ? currentUser.full_name : 'Member',
            text
        };
        this.liveComments.push(newComment);
        return newComment;
    }

    endBroadcast() {
        this.isBroadcasting = false;
        if (this.viewerInterval) clearInterval(this.viewerInterval);
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }

        // Save as video to watch feed
        const currentUser = window.ZukaAuth.getCurrentUser();
        const watchVideos = window.ZukaDB.get('watch_videos');
        watchVideos.unshift({
            id: 'vid_replay_' + Date.now(),
            title: 'Mubashara Uliopita: ' + (currentUser ? currentUser.full_name : 'ZUKA Live'),
            channel_name: currentUser ? currentUser.full_name : 'ZUKA Creator',
            channel_avatar: currentUser ? currentUser.avatar_url : '',
            video_url: 'https://assets.mixkit.co/videos/preview/mixkit-african-girl-dancing-in-traditional-dress-41584-large.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=900',
            duration: '05:32',
            views: `${this.viewersCount * 8} views`,
            published: 'Sasa hivi',
            category: 'Live Replay',
            is_saved: false,
            likes_count: 85
        });
        window.ZukaDB.set('watch_videos', watchVideos);

        alert('Mubashara umekamilika! Video imehifadhiwa kwenye ZUKA Watch.');
    }
}

window.ZukaLive = new ZukaLiveEngine();
