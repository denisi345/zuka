/**
 * ZUKA Super App - Supabase Client & Universal Storage Engine
 * Connects directly to Supabase Database, Auth, Realtime, and Storage.
 */

const DEFAULT_VITE_SUPABASE_URL = window.VITE_SUPABASE_URL || "https://fgocnybpjweezxwvycdt.supabase.co";
const DEFAULT_VITE_SUPABASE_ANON_KEY = window.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb2NueWJwandlZXp4d3Z5Y2R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4ODcyOTQsImV4cCI6MjEwODQ2MzI5NH0.mPeLgmZadGDw0MItQ0U-4FhzeeGrszMiddmXxf8Hhfo";

let supabaseClient = null;

function initSupabase() {
    const sdk = window.supabase;
    if (sdk && typeof sdk.createClient === 'function' && DEFAULT_VITE_SUPABASE_URL && DEFAULT_VITE_SUPABASE_ANON_KEY) {
        try {
            supabaseClient = sdk.createClient(DEFAULT_VITE_SUPABASE_URL, DEFAULT_VITE_SUPABASE_ANON_KEY, {
                auth: { persistSession: true },
                realtime: { params: { eventsPerSecond: 10 } }
            });
            window.supabaseClient = supabaseClient;
            window.supabaseInstance = supabaseClient;
        } catch (e) {
            console.error('[ZUKA] Supabase initialization failed:', e);
        }
    } else {
        console.error('[ZUKA] Supabase JS SDK not loaded. Check the <script> tag in HTML.');
    }
}

initSupabase();

window.ZukaSupabase = {
    client: supabaseClient,

    isLiveSupabase() {
        return !!supabaseClient;
    },

    async select(table, filter = {}) {
        if (!supabaseClient) throw new Error('Supabase client is not initialized.');
        let query = supabaseClient.from(table).select('*');
        Object.keys(filter).forEach(k => {
            query = query.eq(k, filter[k]);
        });
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    async insert(table, record) {
        if (!supabaseClient) throw new Error('Supabase client is not initialized.');
        const { data, error } = await supabaseClient.from(table).insert([record]).select();
        if (error) throw error;
        return data && data.length ? data : null;
    },

    async update(table, id, updates) {
        if (!supabaseClient) throw new Error('Supabase client is not initialized.');
        const { data, error } = await supabaseClient.from(table).update(updates).eq('id', id).select();
        if (error) throw error;
        return data && data.length ? data : null;
    },

    async delete(table, id) {
        if (!supabaseClient) throw new Error('Supabase client is not initialized.');
        const { error } = await supabaseClient.from(table).delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    async uploadFile(bucket, file) {
        if (!supabaseClient) throw new Error('Supabase client is not initialized.');
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const { data, error } = await supabaseClient.storage.from(bucket).upload(fileName, file);
        if (error) throw error;
        const { data: publicUrlData } = supabaseClient.storage.from(bucket).getPublicUrl(fileName);
        return publicUrlData.publicUrl;
    },

    broadcast(channelName, payload) {
        window.dispatchEvent(new CustomEvent('zuka:realtime:' + channelName, { detail: payload }));
    },

    subscribe(channelName, callback) {
        window.addEventListener('zuka:realtime:' + channelName, (e) => callback(e.detail));
    }
};
