/**
 * ZUKA - Authentication & Account Management (auth.js)
 * 100% English - No Demo User, No Fake Data
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
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

    async setCurrentUser(user) {
        localStorage.setItem('zuka_current_user', JSON.stringify(user));
        if (user && user.id && window.supabase) {
            try {
                // Sync user profile data to the Supabase 'users' table
                await window.supabase
                    .from('users')
                    .update(user)
                    .eq('id', user.id);
            } catch (e) {
                console.error("Failed to sync profile update to Supabase:", e);
            }
        }
    }

    async signup({ full_name, username, email, phone, password }) {
        if (!full_name || !username || !password || !email) {
            throw new Error('Please fill in all required fields. Email is mandatory for Supabase Auth.');
        }

        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const cleanUsername = username.replace('@', '').toLowerCase();

        // 1. Check if username is already taken in the Supabase database
        const { data: existingUser, error: checkError } = await window.supabase
            .from('users')
            .select('username')
            .eq('username', cleanUsername)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) {
            throw new Error('This username is already taken. Please choose another.');
        }

        // 2. Register the user via official Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Signup failed. Please try again.');

        // 3. Create the user profile record in the 'users' table
        const newUser = {
            id: authData.user.id, // Using the unique UUID provided by Supabase Auth
            full_name,
            username: cleanUsername,
            email: email.toLowerCase(),
            phone: phone || '',
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

        // Store profile data into the remote database
        const { error: dbError } = await window.supabase
            .from('users')
            .insert([newUser]);

        if (dbError) throw dbError;

        await this.setCurrentUser(newUser);
        return newUser;
    }

    async login(identifier, password, twoFactorCode) {
        if (!window.supabase) {
            throw new Error('Supabase client is not initialized.');
        }

        const cleanId = identifier.trim().toLowerCase();
        let targetEmail = cleanId;

        // 1. Resolve identifier to email if the user enters a username or phone
        if (!cleanId.includes('@')) {
            const { data: profile, error: searchError } = await window.supabase
                .from('users')
                .select('email')
                .or(`username.eq.${cleanId},phone.eq.${cleanId}`)
                .maybeSingle();

            if (searchError) throw searchError;
            if (!profile || !profile.email) {
                throw new Error('The username, email, or phone number you entered is not connected to an account.');
            }
            targetEmail = profile.email;
        }

        // 2. Perform authentication using Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password
        });

        if (authError) throw authError;

        // 3. Retrieve full user profile records from the 'users' table
        const { data: userProfile, error: profileError } = await window.supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

        if (profileError) throw profileError;
        if (!userProfile) throw new Error('User profile record not found.');

        if (userProfile.is_banned) {
            await window.supabase.auth.signOut();
            throw new Error('This account has been suspended by the ZUKA Owner for violating Community Standards.');
        }

        // 4. Handle 2FA verification if enabled on the user profile
        if (userProfile.two_factor_enabled) {
            const code = twoFactorCode || prompt('Enter 2FA Security Code:');
            if (!code) {
                await window.supabase.auth.signOut();
                throw new Error('2FA security code is required.');
            }
            if (userProfile.two_factor_code && code !== userProfile.two_factor_code) {
                await window.supabase.auth.signOut();
                throw new Error('Invalid 2FA security code.');
            }
        }

        await this.setCurrentUser(userProfile);
        return userProfile;
    }

    async logout() {
        localStorage.removeItem('zuka_current_user');
        if (window.supabase) {
            await window.supabase.auth.signOut();
        }
        window.location.href = '/index.html';
    }

    async toggleProfileLock() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.is_locked = !user.is_locked;
        await this.setCurrentUser(user);
        return user.is_locked;
    }

    async toggleProfessionalMode() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.is_professional_mode = !user.is_professional_mode;
        await this.setCurrentUser(user);
        return user.is_professional_mode;
    }

    async toggle2FA() {
        const user = this.getCurrentUser();
        if (!user) return;
        user.two_factor_enabled = !user.two_factor_enabled;
        await this.setCurrentUser(user);
        return user.two_factor_enabled;
    }

    async updateProfile(updates) {
        const user = this.getCurrentUser();
        if (!user) return;
        const updated = { ...user, ...updates };
        await this.setCurrentUser(updated);
        return updated;
    }

    async blockUser(userId) {
        const user = this.getCurrentUser();
        if (!user) return;
        if (!user.blocked_users) user.blocked_users = [];
        if (!user.blocked_users.includes(userId)) {
            user.blocked_users.push(userId);
            await this.setCurrentUser(user);
            
            if (window.supabase) {
                await window.supabase
                    .from('blocks')
                    .insert([{ blocker_id: user.id, blocked_id: userId }]);
            }
        }
    }

    async muteUser(userId) {
        const user = this.getCurrentUser();
        if (!user) return;
        if (!user.muted_users) user.muted_users = [];
        if (!user.muted_users.includes(userId)) {
            user.muted_users.push(userId);
            await this.setCurrentUser(user);
        }
    }

    async toggleCloseFriend(userId) {
        const user = this.getCurrentUser();
        if (!user) return false;
        if (!user.close_friends) user.close_friends = [];
        const idx = user.close_friends.indexOf(userId);
        if (idx === -1) {
            user.close_friends.push(userId);
        } else {
            user.close_friends.splice(idx, 1);
        }
        await this.setCurrentUser(user);
        return user.close_friends.includes(userId);
    }
}

window.ZukaAuth = new ZukaAuthService();
