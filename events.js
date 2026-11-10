/**
 * ZUKA - Events Engine (events.js)
 * 100% Real Data Only - No Demo, No Fake Events
 * 100% English
 */

class ZukaEventsEngine {
    constructor() {
        this.initEvents();
    }

    initEvents() {
        let events = window.ZukaDB.get('events');
        if (!events) {
            events = [];
            window.ZukaDB.set('events', events);
        }
    }

    getEvents() {
        return window.ZukaDB.get('events') || [];
    }

    rsvp(eventId, status = 'going') {
        const events = this.getEvents();
        const ev = events.find(e => e.id === eventId);
        if (ev) {
            if (ev.user_status === status) {
                ev.user_status = null;
                ev[status + '_count'] -= 1;
            } else {
                if (ev.user_status) ev[ev.user_status + '_count'] -= 1;
                ev.user_status = status;
                ev[status + '_count'] += 1;
            }
            window.ZukaDB.set('events', events);
            return ev;
        }
    }

    async createEvent({ title, description, date, location, coverUrl }) {
        const currentUser = window.ZukaAuth.getCurrentUser();
        if (!currentUser) throw new Error('Please log in first to create an event.');
        const newEvt = {
            id: 'evt_' + Date.now().toString(36),
            title,
            description,
            date,
            location,
            cover_url: coverUrl || '',
            creator_name: currentUser ? currentUser.full_name : 'Member',
            going_count: 0,
            interested_count: 0,
            user_status: null,
            created_at: new Date().toISOString()
        };
        const events = this.getEvents();
        events.unshift(newEvt);
        window.ZukaDB.set('events', events);
        return newEvt;
    }
}

window.ZukaEvents = new ZukaEventsEngine();
