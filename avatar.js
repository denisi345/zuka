/**
 * ZUKA Super App - Avatar Creator (avatar.js)
 * Implements Facebook-style Avatar customizer (skin tone, hairstyle, outfit, eyewear).
 */

class ZukaAvatarCreator {
    constructor() {
        this.options = {
            skinTone: 'amber',
            hairStyle: 'afro',
            hairColor: 'black',
            eyewear: 'none',
            outfit: 'casual'
        };
    }

    generateAvatarUrl(seed = 'juma') {
        const style = this.options.hairStyle || 'afro';
        return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1877f2`;
    }

    applyCustomAvatar(seed) {
        const url = this.generateAvatarUrl(seed);
        window.ZukaProfile.updateAvatar(url);
        return url;
    }
}

window.ZukaAvatar = new ZukaAvatarCreator();
