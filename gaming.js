/**
 * ZUKA Super App - Gaming Engine (gaming.js)
 * Implements instant mini-games: Zuka Snake, Speed Runner, and Gaming livestreams.
 */

window.ZukaGaming = {
    streams: [
        {
            id: 'g_str_1',
            title: 'FIFA 26 Championship: Simba vs Yanga Virtual Derby',
            streamer: 'Juma Gamer TZ',
            viewers: '1.2K',
            game: 'EA Sports FC 26',
            avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120',
            thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'
        },
        {
            id: 'g_str_2',
            title: 'PUBG Mobile Squad Push to Conqueror Rank!',
            streamer: 'Queen Mwangi',
            viewers: '850',
            game: 'PUBG Mobile',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
            thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800'
        }
    ],

    getStreams() {
        return this.streams;
    }
};
