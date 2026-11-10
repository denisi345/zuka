/**
 * ZUKA - Audio & Video Calls Engine (calls.js)
 * 100% English - No Demo Contact
 */

class ZukaCallsEngine {
    constructor() {
        this.activeStream = null;
        this.callType = 'video';
        this.callState = 'idle';
        this.contactName = '';
        this.audioCtx = null;
    }

    async startCall(contactName = '', type = 'video') {
        if (!contactName) throw new Error('Please select a contact to call.');
        this.contactName = contactName;
        this.callType = type;
        this.callState = 'calling';

        this.playRingTone();

        const modal = document.getElementById('zuka-call-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('call-contact-name').innerText = contactName;
            document.getElementById('call-type-label').innerText = type === 'video' ? 'ZUKA Video Call...' : 'ZUKA Voice Call...';
        }

        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: type === 'video',
                    audio: true
                });
                this.activeStream = stream;
                const videoEl = document.getElementById('local-call-video');
                if (videoEl && type === 'video') {
                    videoEl.srcObject = stream;
                    videoEl.play();
                }
            }
        } catch (err) {
            console.log("Camera/Mic permission denied:", err);
        }
    }

    onCallAnswered() {
        if (this.callState === 'calling') {
            this.callState = 'connected';
            this.stopRingTone();
            const typeLabel = document.getElementById('call-type-label');
            if (typeLabel) typeLabel.innerText = '00:01 - Connected';
            this.startTimer();
        }
    }

    startTimer() {
        let seconds = 1;
        this.timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            const typeLabel = document.getElementById('call-type-label');
            if (typeLabel && this.callState === 'connected') {
                typeLabel.innerText = `${mins}:${secs} - Connected`;
            }
        }, 1000);
    }

    endCall() {
        this.callState = 'ended';
        this.stopRingTone();
        if (this.timerInterval) clearInterval(this.timerInterval);

        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
            this.activeStream = null;
        }

        const modal = document.getElementById('zuka-call-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    toggleMute() {
        if (this.activeStream) {
            const audioTrack = this.activeStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return !audioTrack.enabled;
            }
        }
        return false;
    }

    playRingTone() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                this.currentOsc = osc;
            }
        } catch (e) {}
    }

    stopRingTone() {
        try {
            if (this.currentOsc) {
                this.currentOsc.stop();
                this.currentOsc = null;
            }
            if (this.audioCtx) {
                this.audioCtx.close();
                this.audioCtx = null;
            }
        } catch (e) {}
    }
}

window.ZukaCalls = new ZukaCallsEngine();
