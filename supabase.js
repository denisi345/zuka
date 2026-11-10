/**
 * ZUKA Super App - Supabase Client & Universal Storage Engine
 * Connects to Supabase Database, Auth, Realtime, and Storage.
 * Includes local fallback simulation to guarantee 100% offline & demo functionality.
 */

// Configure your Supabase Credentials here or via localStorage / environment
const DEFAULT_SUPABASE_URL = window.SUPABASE_URL || localStorage.getItem('ZUKA_SUPABASE_URL') || '';
const DEFAULT_SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || localStorage.getItem('ZUKA_SUPABASE_ANON_KEY') || '';

let supabaseClient = null;

// Initialize official @supabase/supabase-js client if credentials are present
function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient && DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
        try {
            supabaseClient = window.supabase.createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, {
                auth: { persistSession: true },
                realtime: { params: { eventsPerSecond: 10 } }
            });
            console.log("⚡ [ZUKA] Connected to official Supabase instance:", DEFAULT_SUPABASE_URL);
        } catch (e) {
            console.warn("⚠️ [ZUKA] Supabase initialization notice:", e);
        }
    }
}

initSupabase();

// In-Memory & LocalStorage DB mirror for ultra-fast, zero-breakage operations
class ZukaLocalStore {
    constructor() {
        this.prefix = 'zuka_db_';
        this.initDefaults();
    }

    initDefaults() {
        // Ensure core collections exist
        const collections = [
            'users', 'posts', 'comments', 'likes', 'stories', 'reels', 'messages',
            'groups', 'group_members', 'group_rules', 'group_chats', 'pages', 'products',
            'lives', 'events', 'jobs', 'fundraisers', 'dating_profiles', 'notifications',
            'reports', 'ai_flags', 'ai_logs', 'owner_actions', 'zuka_owners', 'news_posts',
            'ai_chat_messages', 'saved_items'
        ];

        collections.forEach(col => {
            if (!localStorage.getItem(this.prefix + col)) {
                localStorage.setItem(this.prefix + col, JSON.stringify([]));
            }
        });

        // Seed initial Owner if not present
        const owners = this.get('zuka_owners');
        if (owners.length === 0) {
            this.insert('zuka_owners', {
                id: 'owner-root-1974',
                owner_username: 'zuka_owner',
                password_hash: 'ZukaOwner1974!',
                role: 'owner',
                secret_key: 'zuka-mother-1974-key',
                created_at: new Date().toISOString()
            });
        }
    }

    get(collection) {
        try {
            const raw = localStorage.getItem(this.prefix + collection);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    set(collection, items) {
        try {
            localStorage.setItem(this.prefix + collection, JSON.stringify(items));
        } catch (e) {
            console.error("Storage error:", e);
        }
    }

    insert(collection, item) {
        const items = this.get(collection);
        if (!item.id) {
            item.id = 'zuka_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        }
        if (!item.created_at) {
            item.created_at = new Date().toISOString();
        }
        items.unshift(item);
        this.set(collection, items);
        return item;
    }

    update(collection, id, updates) {
        const items = this.get(collection);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
            this.set(collection, items);
            return items[index];
        }
        return null;
    }

    delete(collection, id) {
        let items = this.get(collection);
        items = items.filter(i => i.id !== id);
        this.set(collection, items);
        return true;
    }

    find(collection, filterFn) {
        const items = this.get(collection);
        return filterFn ? items.filter(filterFn) : items;
    }

    findOne(collection, filterFn) {
        const items = this.get(collection);
        return items.find(filterFn) || null;
    }
}

window.ZukaDB = new ZukaLocalStore();

// Universal Supabase Bridge
window.ZukaSupabase = {
    client: supabaseClient,

    isLiveSupabase() {
        return !!supabaseClient;
    },

    setCredentials(url, key) {
        localStorage.setItem('ZUKA_SUPABASE_URL', url);
        localStorage.setItem('ZUKA_SUPABASE_ANON_KEY', key);
        window.location.reload();
    },

    async select(table, filter = {}) {
        if (supabaseClient) {
            try {
                let query = supabaseClient.from(table).select('*');
                Object.keys(filter).forEach(k => {
                    query = query.eq(k, filter[k]);
                });
                const { data, error } = await query;
                if (!error && data) return data;
            } catch (err) {
                console.warn("Supabase fetch fallback to local:", err);
            }
        }
        return window.ZukaDB.find(table, item => {
            return Object.keys(filter).every(k => item[k] === filter[k]);
        });
    },

    async insert(table, record) {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from(table).insert([record]).select();
                if (!error && data && data.length) {
                    window.ZukaDB.insert(table, data[0]);
                    return data[0];
                }
            } catch (err) {
                console.warn("Supabase insert fallback:", err);
            }
        }
        return window.ZukaDB.insert(table, record);
    },

    async update(table, id, updates) {
        if (supabaseClient) {
            try {
                const { data, error } = await supabaseClient.from(table).update(updates).eq('id', id).select();
                if (!error && data && data.length) {
                    window.ZukaDB.update(table, id, data[0]);
                    return data[0];
                }
            } catch (err) {
                console.warn("Supabase update fallback:", err);
            }
        }
        return window.ZukaDB.update(table, id, updates);
    },

    async delete(table, id) {
        if (supabaseClient) {
            try {
                await supabaseClient.from(table).delete().eq('id', id);
            } catch (err) {
                console.warn("Supabase delete fallback:", err);
            }
        }
        return window.ZukaDB.delete(table, id);
    },

    // Storage file upload simulator & official Supabase storage
    async uploadFile(bucket, file) {
        if (supabaseClient) {
            try {
                const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const { data, error } = await supabaseClient.storage.from(bucket).upload(fileName, file);
                if (!error && data) {
                    const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
                    return publicUrlData.publicUrl;
                }
            } catch (e) {
                console.warn("Storage upload fallback to dataURL:", e);
            }
        }

        // Return Data URL fallback for immediate offline preview
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    // Realtime broadcaster
    broadcast(channelName, payload) {
        window.dispatchEvent(new CustomEvent('zuka:realtime:' + channelName, { detail: payload }));
    },

    subscribe(channelName, callback) {
        window.addEventListener('zuka:realtime:' + channelName, (e) => callback(e.detail));
    }
};
