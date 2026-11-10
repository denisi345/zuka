/**
 * ZUKA - Notifications Engine (notifications.js)
 * 100% English - No Fake Notifications
 */

class ZukaNotificationsEngine {
    constructor() {
        this.initNotifications();
    }

    initNotifications() {
        let notifs = window.ZukaDB.get('notifications');
        if (!notifs) {
            notifs = [];
            window.ZukaDB.set('notifications', notifs);
        }
    }

    getNotifications() {
        return window.ZukaDB.get('notifications') || [];
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
            time: 'Just now',
            created_at: new Date().toISOString()
        };
        notifs.unshift(newNotif);
        window.ZukaDB.set('notifications', notifs);
        return newNotif;
    }
}

window.ZukaNotifications = new ZukaNotificationsEngine();
