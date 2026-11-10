/**
 * ZUKA - Friends Engine (friends.js)
 * 100% English - No Fake Requests, No Fake Suggestions
 */

class ZukaFriendsEngine {
    constructor() {
        this.initFriends();
    }

    initFriends() {
        let requests = window.ZukaDB.get('friend_requests');
        if (!requests) {
            requests = [];
            window.ZukaDB.set('friend_requests', requests);
        }
    }

    getRequests() {
        const requests = window.ZukaDB.get('friend_requests') || [];
        return requests.filter(r => r.status === 'pending');
    }

    acceptRequest(requestId) {
        const requests = window.ZukaDB.get('friend_requests') || [];
        const req = requests.find(r => r.id === requestId);
        if (req) {
            req.status = 'accepted';
            window.ZukaDB.set('friend_requests', requests);

            const currentUser = window.ZukaAuth.getCurrentUser();
            if (currentUser) {
                if (!currentUser.close_friends) currentUser.close_friends = [];
                if (!currentUser.close_friends.includes(req.sender_id)) {
                    currentUser.close_friends.push(req.sender_id);
                }
                window.ZukaAuth.setCurrentUser(currentUser);
            }
            return true;
        }
        return false;
    }

    declineRequest(requestId) {
        let requests = window.ZukaDB.get('friend_requests') || [];
        requests = requests.filter(r => r.id !== requestId);
        window.ZukaDB.set('friend_requests', requests);
        return true;
    }

    getSuggestions() {
        const currentUser = window.ZukaAuth ? window.ZukaAuth.getCurrentUser() : null;
        if (!currentUser) return [];

        const allUsers = window.ZukaDB.get('users') || [];
        const requests = window.ZukaDB.get('friend_requests') || [];
        const requestedIds = requests.map(r => r.sender_id);

        return allUsers
            .filter(u => u.id !== currentUser.id)
            .filter(u => !(currentUser.close_friends || []).includes(u.id))
            .filter(u => !requestedIds.includes(u.id))
            .map(u => ({
                id: u.id,
                name: u.full_name || u.username || '',
                avatar: u.avatar_url || '',
                mutual: '',
                work: u.work || ''
            }));
    }
}

window.ZukaFriends = new ZukaFriendsEngine();
