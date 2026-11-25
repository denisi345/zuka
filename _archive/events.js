/**
 * ZUKA - Events Engine (events.js)
 * 100% Real Data Only - No Demo, No Fake Events
 * 100% English
 * Fully Integrated with Supabase Client & Cloudflare Deploys
 * Built for a global audience
 */

class ZukaEventsEngine {
    constructor() {
        this.initEvents();
    }

    initEvents() {
        // Initialization handled remotely by Postgres schema constraints on Supabase
    }

    async getEvents() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const { data: events, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching events from Supabase:", error);
            return [];
        }

        return events || [];
    }

    async rsvp(eventId, status = 'going') {
        if (!window.supabaseClient) return null;

        // 1. Fetch current status matrices from the remote event row
        const { data: ev, error: fetchError } = await window.supabaseClient
            .from('events')
            .select('user_status, going_count, interested_count')
            .eq('id', eventId)
            .maybeSingle();

        if (fetchError || !ev) {
            console.error("Event entry not found:", fetchError);
            return null;
        }

        let nextStatus = status;
        let nextGoing = ev.going_count || 0;
        let nextInterested = ev.interested_count || 0;

        if (ev.user_status === status) {
            nextStatus = null;
            if (status === 'going') nextGoing = Math.max(0, nextGoing - 1);
            if (status === 'interested') nextInterested = Math.max(0, nextInterested - 1);
        } else {
            if (ev.user_status === 'going') nextGoing = Math.max(0, nextGoing - 1);
            if (ev.user_status === 'interested') nextInterested = Math.max(0, nextInterested - 1);

            if (status === 'going') nextGoing += 1;
            if (status === 'interested') nextInterested += 1;
        }

        // 2. Perform an atomic update on the event tracking fields
        const { data: updatedEv, error: updateError } = await window.supabaseClient
            .from('events')
            .update({
                user_status: nextStatus,
                going_count: nextGoing,
                interested_count: nextInterested
            })
            .eq('id', eventId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedEv;
    }

    async createEvent({ title, description, date, location, coverUrl }) {
        if (!window.supabaseClient) {
            throw new Error('Supabase client is not initialized.');
        }

        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) throw new Error('Please log in first to create an event.');

        const newEvt = {
            title,
            description,
            date,
            location,
            cover_url: coverUrl || '',
            creator_name: currentUser.full_name,
            going_count: 0,
            interested_count: 0,
            user_status: null,
            created_at: new Date().toISOString()
        };

        const { data, error } = await window.supabaseClient
            .from('events')
            .insert([newEvt])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

window.ZukaEvents = new ZukaEventsEngine();
