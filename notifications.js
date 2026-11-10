/**
 * ZUKA Super App - Notifications Engine (notifications.js)
 * Implements real-time notification drawer, badge count, and alert triggers.
 */

class ZukaNotificationsEngine {
    constructor() {
        this.initNotifications();
    }

    initNotifications() {
        let notifs = window.ZukaDB.get('notifications');
        if (notifs.length === 0) {
            notifs = [
                {
                    id: 'notif_1',
                    actor_name: 'Sarah Kimaro',
                    actor_avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
                    content: 'amependa chapisho lako jipya: "Karibu kwenye ZUKA..."',
                    type: 'like',
                    is_read: false,
                    time: 'Dakika 15 zilizopita'
                },
                {
                    id: 'notif_2',
                    actor_name: 'Kelvin Mushi',
                    actor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
                    content: 'amekualika kujiunga na kundi la "Wapenzi wa Teknolojia"',
                    type: 'group_invite',
                    is_read: false,
                    time: 'Saa 1 iliyopita'
                },
                {
                    id: 'notif_3',
                    actor_name: 'ZUKA AI 🤖',
                    actor_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
                    content: 'ina ripoti mpya ya uchambuzi wa marafiki zako leo',
                    type: 'ai_alert',
                    is_read: true,
                    time: 'Jana'
                }
            ];
            window.ZukaDB.set('notifications', notifs);
        }
    }

    getNotifications() {
        return window.ZukaDB.get('notifications');
    }

    getUnreadCount() {
        const notifs = this.getNotifications();
        return notifs.filter(n => !n.is_read).length;
    }

    markAllAsRead() {
        const notifs = this.getNotifications();
        notifs.forEach(n => n.is_read = true);
        window.ZukaDB.set('notifications', notifs);
    }

    send({ userId, actorName, actorAvatar, type, content }) {
        const notifs = this.getNotifications();
        const newNotif = {
            id: 'n_' + Date.now(),
            user_id: userId,
            actor_name: actorName,
            actor_avatar: actorAvatar,
            type,
            content,
            is_read: false,
            time: 'Sasa hivi',
            created_at: new Date().toISOString()
        };
        notifs.unshift(newNotif);
        window.ZukaDB.set('notifications', notifs);
        return newNotif;
    }
}

window.ZukaNotifications = new ZukaNotificationsEngine();
