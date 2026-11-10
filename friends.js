/**
 * ZUKA Super App - Friends Engine (friends.js)
 * Implements Friend requests accept/reject, Friends list, Suggestions, and Following.
 */

class ZukaFriendsEngine {
    constructor() {
        this.initFriends();
    }

    initFriends() {
        let requests = window.ZukaDB.get('friend_requests');
        if (requests.length === 0) {
            requests = [
                {
                    id: 'fr_1',
                    sender_id: 'usr_amina_04',
                    sender_name: 'Amina Rashid',
                    sender_avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
                    mutual_friends: 14,
                    status: 'pending'
                },
                {
                    id: 'fr_2',
                    sender_id: 'usr_baraka_03',
                    sender_name: 'Baraka John',
                    sender_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
                    mutual_friends: 8,
                    status: 'pending'
                }
            ];
            window.ZukaDB.set('friend_requests', requests);
        }
    }

    getRequests() {
        return window.ZukaDB.get('friend_requests').filter(r => r.status === 'pending');
    }

    acceptRequest(requestId) {
        const requests = window.ZukaDB.get('friend_requests');
        const req = requests.find(r => r.id === requestId);
        if (req) {
            req.status = 'accepted';
            window.ZukaDB.set('friend_requests', requests);

            // Add to close friends/friends
            const currentUser = window.ZukaAuth.getCurrentUser();
            if (currentUser) {
                if (!currentUser.close_friends) currentUser.close_friends = [];
                currentUser.close_friends.push(req.sender_id);
                window.ZukaAuth.setCurrentUser(currentUser);
            }
            return true;
        }
    }

    declineRequest(requestId) {
        let requests = window.ZukaDB.get('friend_requests');
        requests = requests.filter(r => r.id !== requestId);
        window.ZukaDB.set('friend_requests', requests);
        return true;
    }

    getSuggestions() {
        return [
            {
                id: 'sug_1',
                name: 'David Mollel',
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
                mutual: 'Marafiki 6 wa pamoja',
                work: 'Mhandisi wa IT'
            },
            {
                id: 'sug_2',
                name: 'Grace Mlay',
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
                mutual: 'Marafiki 12 wa pamoja',
                work: 'Mjasiriamali'
            }
        ];
    }
}

window.ZukaFriends = new ZukaFriendsEngine();
