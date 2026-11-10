/**
 * ZUKA Super App - Events Engine (events.js)
 * Implements Facebook-style Events: Create event, Going/Interested RSVP, Location/Date, Invites.
 */

class ZukaEventsEngine {
    constructor() {
        this.initEvents();
    }

    initEvents() {
        let events = window.ZukaDB.get('events');
        if (events.length === 0) {
            events = [
                {
                    id: 'evt_01',
                    title: 'Tamasha la Teknolojia na Ubunifu Tanzania (TechFest 2026)',
                    description: 'Kukutana kwa wabunifu, waanzilishi wa startups, na makampuni makubwa ya teknolojia.',
                    date: 'Jumamosi, 15 Machi 2026 saa 3:00 Asubuhi',
                    location: 'Mlimani City Conference Centre, Dar es Salaam',
                    cover_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900',
                    creator_name: 'ZUKA Community Team',
                    going_count: 640,
                    interested_count: 1200,
                    user_status: null
                },
                {
                    id: 'evt_02',
                    title: 'Mkutano wa Wajasiriamali na Uwekezaji wa Kibiashara',
                    description: 'Jifunze namna ya kupata mitaji na kukuza biashara yako Afrika Mashariki.',
                    date: 'Ijumaa ijayo saa 8:00 Mchana',
                    location: 'Serena Hotel, Dar es Salaam',
                    cover_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900',
                    creator_name: 'Wafanyabiashara TZ',
                    going_count: 310,
                    interested_count: 850,
                    user_status: null
                }
            ];
            window.ZukaDB.set('events', events);
        }
    }

    getEvents() {
        return window.ZukaDB.get('events');
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
        const newEvt = {
            id: 'evt_' + Date.now().toString(36),
            title,
            description,
            date,
            location,
            cover_url: coverUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=900',
            creator_name: currentUser ? currentUser.full_name : 'Mwanachama',
            going_count: 1,
            interested_count: 0,
            user_status: 'going',
            created_at: new Date().toISOString()
        };
        const events = this.getEvents();
        events.unshift(newEvt);
        window.ZukaDB.set('events', events);
        return newEvt;
    }
}

window.ZukaEvents = new ZukaEventsEngine();
