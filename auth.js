/**
 * ZUKA Super App - Authentication & Account Management (auth.js)
 * Signup, Login, Logout, 2FA, Profile Lock, Professional Mode, Close Friends, Block/Mute/Report.
 * DEFAULT Language: English (US)
 */

class ZukaAuthService {
    constructor() {
        this.initDefaultUser();
    }

    initDefaultUser() {
        let user = this.getCurrentUser();
        if (!user) {
            // Seed a high quality default profile in English (US)
            user = {
                id: 'usr_juma_01',
                full_name: 'John Miller',
                username: 'johnmiller',
                email: 'john@zuka.com',
                phone: '+1 415 555 0198',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
                bio: 'Digital creator & tech enthusiast 🚀 | Living life to the fullest ✨',
                location: 'San Francisco, CA',
                work: 'Software Engineer & Creator',
                education: 'Stanford University',
                relationship: 'Single',
                is_verified: true,
                is_professional_mode: true,
                is_locked: false,
                two_factor_enabled: false,
                stars_balance: 450,
                followers_count: 1240,
                following_count: 380,
                close_friends: [],
                favorites: [],
                blocked_users: [],
                muted_users: [],
                language: 'en',
                created_at: new Date().toISOString()
            };
            this.setCurrentUser(user);

            // Ensure it is in users DB
            const allUsers = window.ZukaDB.get('users');
            if (!allUsers.some(u => u.id === user.id)) {
                allUsers.push(user);
                window.ZukaDB.set('users', allUsers);
            }
        }
    }

    getCurrentUser() {
        try {
            const raw = localStorage.getItem('zuka_current_user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    setCurrentUser(user) {
        localStorage.setItem('zuka_current_user', JSON.stringify(user));
        if (user && user.id) {
            window.ZukaDB.update('users', user.id, user);
        }
    }

    async signup({ full_name, username, email, phone, password }) {
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        if (!full_name || !username || !password) {
            throw new Error(isSwahili ? 'Tafadhali jaza taarifa zote muhimu.' : 'Please fill in all required fields.');
        }

        const cleanUsername = username.replace('@', '').toLowerCase();
        const users = window.ZukaDB.get('users');
        if (users.some(u => u.username === cleanUsername)) {
            throw new Error(isSwahili ? 'Jina hili la mtumiaji (username) limeshatumika tayari.' : 'This username is already taken. Please choose another.');
        }

        const newUser = {
            id: 'usr_' + Date.now().toString(36),
            full_name,
            username: cleanUsername,
            email: email || '',
            phone: phone || '',
            password_hash: password,
            avatar_url: `https://api.dicebear.com/7.x/micah/svg?seed=${cleanUsername}`,
            cover_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
            bio: isSwahili ? 'Nimejiunga na ZUKA hivi punde!' : 'Just joined ZUKA! Excited to connect.',
            location: 'United States',
            work: 'ZUKA Member',
            education: '',
            relationship: 'Single',
            is_verified: false,
            is_professional_mode: false,
            is_locked: false,
            two_factor_enabled: false,
            stars_balance: 50,
            followers_count: 0,
            following_count: 0,
            close_friends: [],
            favorites: [],
            blocked_users: [],
            muted_users: [],
            language: window.ZukaI18n ? window.ZukaI18n.getLanguage() : 'en',
            created_at: new Date().toISOString()
        };

        if (window.ZukaAIModerator) {
            window.ZukaAIModerator.checkFakeAccount(newUser);
        }

        await window.ZukaSupabase.insert('users', newUser);
        this.setCurrentUser(newUser);
        return newUser;
    }

    async login(identifier, password) {
        const isSwahili = window.ZukaI18n && window.ZukaI18n.getLanguage() === 'sw';
        const users = window.ZukaDB.get('users');
        const cleanId = identifier.trim().toLowerCase();

        const user = users.find(u => 
            (u.email && u.email.toLowerCase() === cleanId) || 
            (u.phone && u.phone === identifier.trim()) || 
            (u.username && u.username.toLowerCase() === cleanId)
        );

        if (!user) {
            throw new Error(isSwahili ? 'Akaunti haijapatikana kwa taarifa hizo.' : 'The email or phone number you entered isn’t connected to an account.');
        }

        if (user.is_banned) {
            throw new Error(isSwahili ? 'Akaunti hii imesimamishwa na Mmiliki wa ZUKA.' : 'This account has been suspended by the ZUKA Owner for violating Community Standards.');
        }

        if (user.two_factor_enabled) {
            const promptMsg = isSwahili ? 'Weka nambari ya uthibitisho ya 2FA (Demo: 1974):' : 'Enter 2FA Security Code (Demo: 1974):';
            const code = prompt(promptMsg);
            if (code !== '1974') {
                throw new Error(isSwahili ? 'Nambari ya 2FA si sahihi.' : 'Invalid 2FA security code.');
            }
        }

        this.setCurrentUser(user);
        return user;
    }

    logout() {
        localStorage.removeItem('zuka_current_user');
        window.location.href = '/index.html';
    }

    toggleProfileLock() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.is_locked = !user.is_locked;
        this.setCurrentUser(user);
        return user.is_locked;
    }

    toggleProfessionalMode() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.is_professional_mode = !user.is_professional_mode;
        this.setCurrentUser(user);
        return user.is_professional_mode;
    }

    toggle2FA() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.two_factor_enabled = !user.two_factor_enabled;
        this.setCurrentUser(user);
        return user.two_factor_enabled;
    }

    updateProfile(updates) {
        const user = this.getCurrentUser();
        if (!user) return;
        const updated = { ...user, ...updates };
        this.setCurrentUser(updated);
        return updated;
    }

    blockUser(userId) {
        const user = this.getCurrentUser();
        if (!user.blocked_users) user.blocked_users = [];
        if (!user.blocked_users.includes(userId)) {
            user.blocked_users.push(userId);
            this.setCurrentUser(user);
            window.ZukaSupabase.insert('blocks', { blocker_id: user.id, blocked_id: userId });
        }
    }

    muteUser(userId) {
        const user = this.getCurrentUser();
        if (!user.muted_users) user.muted_users = [];
        if (!user.muted_users.includes(userId)) {
            user.muted_users.push(userId);
            this.setCurrentUser(user);
        }
    }

    toggleCloseFriend(userId) {
        const user = this.getCurrentUser();
        if (!user.close_friends) user.close_friends = [];
        const idx = user.close_friends.indexOf(userId);
        if (idx === -1) {
            user.close_friends.push(userId);
        } else {
            user.close_friends.splice(idx, 1);
        }
        this.setCurrentUser(user);
        return user.close_friends.includes(userId);
    }
}

window.ZukaAuth = new ZukaAuthService();
