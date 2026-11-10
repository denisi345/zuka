/**
 * ZUKA Super App - Audio & Video Calls Engine (calls.js)
 * Implements WebRTC audio & video calling modal, camera preview, ringtone, and mute toggles.
 */

class ZukaCallsEngine {
    constructor() {
        this.activeStream = null;
        this.callType = 'video'; // 'voice' or 'video'
        this.callState = 'idle'; // 'calling', 'connected', 'ended'
        this.contactName = 'Sarah Kimaro';
        this.audioCtx = null;
    }

    async startCall(contactName = 'Sarah Kimaro', type = 'video') {
        this.contactName = contactName;
        this.callType = type;
        this.callState = 'calling';

        // Play synthetic ringtone
        this.playRingTone();

        const modal = document.getElementById('zuka-call-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('call-contact-name').innerText = contactName;
            document.getElementById('call-type-label').innerText = type === 'video' ? 'Simu ya Video ya ZUKA...' : 'Simu ya Sauti ya ZUKA...';
        }

        // Try getting local camera/mic stream
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
            console.log("Camera/Mic stream notice (normal if in sandbox or no permission):", err);
        }

        // Simulate contact answering after 3.5 seconds
        setTimeout(() => {
            if (this.callState === 'calling') {
                this.callState = 'connected';
                this.stopRingTone();
                const typeLabel = document.getElementById('call-type-label');
                if (typeLabel) typeLabel.innerText = '00:01 • Imeunganishwa (HD Voice)';
                this.startTimer();
            }
        }, 3500);
    }

    startTimer() {
        let seconds = 1;
        this.timerInterval = setInterval(() => {
            seconds++;
            const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
            const secs = String(seconds % 60).padStart(2, '0');
            const typeLabel = document.getElementById('call-type-label');
            if (typeLabel && this.callState === 'connected') {
                typeLabel.innerText = `${mins}:${secs} • Imeunganishwa (HD Voice)`;
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
        } catch (e) {
            // Audio context disabled
        }
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
