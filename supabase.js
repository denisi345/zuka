/**
 * ZUKA Super App - Supabase Client & Universal Storage Engine
 * Connects to Supabase Database, Auth, Realtime, and Storage.
 * Includes local fallback for offline functionality.
 * 100% English - No Hardcoded Credentials, No Seeded Owner Account
 */

const DEFAULT_VITE_SUPABASE_URL = window.VITE_SUPABASE_URL || localStorage.getItem('ZUKA_SUPABASE_URL') || '';
const DEFAULT_VITE_SUPABASE_ANON_KEY = window.VITE_SUPABASE_ANON_KEY || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '';

let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient && DEFAULT_VITE_SUPABASE_URL && DEFAULT_VITE_SUPABASE_ANON_KEY) {
        try {
            supabaseClient = window.supabase.createClient(DEFAULT_VITE_SUPABASE_URL, DEFAULT_VITE_SUPABASE_ANON_KEY, {
                auth: { persistSession: true },
                realtime: { params: { eventsPerSecond: 10 } }
            });
        } catch (e) {
            console.warn('[ZUKA] Supabase initialization failed:', e);
        }
    }
}

initSupabase();

class ZukaLocalStore {
    constructor() {
        this.prefix = 'zuka_db_';
        this.initDefaults();
    }

    initDefaults() {
        const collections = [
            'users', 'posts', 'comments', 'likes', 'stories', 'reels', 'messages',
            'groups', 'group_members', 'group_rules', 'group_chats', 'pages', 'products',
            'lives', 'events', 'jobs', 'fundraisers', 'dating_profiles', 'notifications',
            'reports', 'ai_flags', 'ai_logs', 'owner_actions', 'zuka_owners', 'news_posts',
            'ai_chat_messages', 'saved_items', 'verification_requests'
        ];

        collections.forEach(col => {
            if (!localStorage.getItem(this.prefix + col)) {
                localStorage.setItem(this.prefix + col, JSON.stringify([]));
            }
        });
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
            console.error('Storage error:', e);
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

window.ZukaSupabase = {
    client: supabaseClient,

    isLiveSupabase() {
        return !!supabaseClient;
    },

    setCredentials(url, key) {
        localStorage.setItem('VITE_SUPABASE_URL;https://fgocnybpjweezxwvycdt.supabase.co.";
        localStorage.setItem('VITE_SUPABASE_ANON_KEY;'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2NueWJwandlZXp4d3Z5Y2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODcyOTQsImV4cCI6MjEwODQ2MzI5NH0.mPeLgmZadGDw0MItQ0U-4FhzeeGrszMiddmXxf8Hhfo": 
                            
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
                console.warn('Supabase fetch fallback to local:', err);
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
                console.warn('Supabase insert fallback:', err);
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
                console.warn('Supabase update fallback:', err);
            }
        }
        return window.ZukaDB.update(table, id, updates);
    },

    async delete(table, id) {
        if (supabaseClient) {
            try {
                await supabaseClient.from(table).delete().eq('id', id);
            } catch (err) {
                console.warn('Supabase delete fallback:', err);
            }
        }
        return window.ZukaDB.delete(table, id);
    },

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
                console.warn('Storage upload fallback to dataURL:', e);
            }
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    },

    broadcast(channelName, payload) {
        window.dispatchEvent(new CustomEvent('zuka:realtime:' + channelName, { detail: payload }));
    },

    subscribe(channelName, callback) {
        window.addEventListener('zuka:realtime:' + channelName, (e) => callback(e.detail));
    }
};
