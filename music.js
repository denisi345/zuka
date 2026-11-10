/**
 * ZUKA Super App - Music Engine (music.js)
 * Implements music tracks picker for Stories, Reels, and Posts.
 */

window.ZukaMusic = {
    tracks: [
        { id: 'trk_1', title: 'Komasava (Remix)', artist: 'Diamond Platnumz ft. Jason Derulo', duration: '03:14', genre: 'Bongo Flava' },
        { id: 'trk_2', title: 'Single Again', artist: 'Harmonize', duration: '02:58', genre: 'Afrobeats' },
        { id: 'trk_3', title: 'Dodo', artist: 'Alikiba', duration: '03:45', genre: 'Bongo Flava' },
        { id: 'trk_4', title: 'Kizunguzungu', artist: 'Rayvanny', duration: '03:05', genre: 'Pop' },
        { id: 'trk_5', title: 'Sura Yako', artist: 'Sauti Sol', duration: '03:10', genre: 'East Africa' },
        { id: 'trk_6', title: 'Lo-Fi Chill Beats', artist: 'ZUKA Sounds', duration: '02:30', genre: 'Acoustic' }
    ],

    getTracks() {
        return this.tracks;
    }
};
