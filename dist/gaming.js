/**
 * ZUKA - Gaming Engine (gaming.js)
 * 100% English - No Fake Streams, No Fake Viewers
 */

window.ZukaGaming = {
    streams: [],

    getStreams() {
        return this.streams || [];
    },

    addStream(stream) {
        if (!stream || !stream.title || !stream.streamer) return null;
        const newStream = {
            id: 'g_str_' + Date.now().toString(36),
            title: stream.title,
            streamer: stream.streamer,
            viewers: 0,
            game: stream.game || '',
            avatar: stream.avatar || '',
            thumbnail: stream.thumbnail || '',
            created_at: new Date().toISOString()
        };
        this.streams.unshift(newStream);
        return newStream;
    }
};
