/**
 * ZUKA - Authentication & Account Management (auth.js)
 * 100% English - No Demo User, No Fake Data
 */

class ZukaAuthService {
    constructor() {
        this.initDefaultUser();
    }

    initDefaultUser() {
        // Do NOT create a fake user. User must sign up / log in.
        // If no user is logged in, stay logged out.
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
        if (!full_name || !username || !password) {
            throw new Error('Please fill in all required fields.');
        }

        const cleanUsername = username.replace('@', '').toLowerCase();
        const users = window.ZukaDB.get('users') || [];
        if (users.some(u => u.username === cleanUsername)) {
            throw new Error('This username is already taken. Please choose another.');
        }

        const newUser = {
            id: 'usr_' + Date.now().toString(36),
            full_name,
            username: cleanUsername,
            email: email || '',
            phone: phone || '',
            password_hash: password,
            avatar_url: '',
            cover_url: '',
            bio: '',
            location: '',
            work: '',
            education: '',
            relationship: '',
            is_verified: false,
            is_professional_mode: false,
            is_locked: false,
            two_factor_enabled: false,
            stars_balance: 0,
            followers_count: 0,
            following_count: 0,
            close_friends: [],
            favorites: [],
            blocked_users: [],
            muted_users: [],
            language: 'en',
            created_at: new Date().toISOString()
        };

        if (window.ZukaAIModerator) {
            window.ZukaAIModerator.checkFakeAccount(newUser);
        }

        await window.ZukaSupabase.insert('users', newUser);
        this.setCurrentUser(newUser);
        return newUser;
    }

    async login(identifier, password, twoFactorCode) {
        const users = window.ZukaDB.get('users') || [];
        const cleanId = identifier.trim().toLowerCase();

        const user = users.find(u => 
            (u.email && u.email.toLowerCase() === cleanId) || 
            (u.phone && u.phone === identifier.trim()) || 
            (u.username && u.username.toLowerCase() === cleanId)
        );

        if (!user) {
            throw new Error('The email or phone number you entered is not connected to an account.');
        }

        if (user.is_banned) {
            throw new Error('This account has been suspended by the ZUKA Owner for violating Community Standards.');
        }

        if (user.two_factor_enabled) {
            const code = twoFactorCode || prompt('Enter 2FA Security Code:');
            if (!code) {
                throw new Error('2FA security code is required.');
            }
            if (user.two_factor_code && code !== user.two_factor_code) {
                throw new Error('Invalid 2FA security code.');
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
