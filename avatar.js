/**
 * ZUKA Super App - Avatar Creator (avatar.js)
 * Implements Avatar customizer (skin tone, hairstyle, outfit, eyewear).
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

    generateAvatarUrl(seed = 'user') {
        const customSeed = `${seed}-${this.options.skinTone}-${this.options.hairStyle}-${this.options.outfit}`;
        return `https://dicebear.com{encodeURIComponent(customSeed)}&backgroundColor=1877f2`;
    }

    async applyCustomAvatar(seed) {
        const url = this.generateAvatarUrl(seed);
        if (window.ZukaProfile && typeof window.ZukaProfile.updateAvatar === 'function') {
            await window.ZukaProfile.updateAvatar(url);
        } else {
            console.warn("ZukaProfile haijapakia bado.");
        }
        return url;
    }
}

window.ZukaAvatar = new ZukaAvatarCreator();
