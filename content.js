(function() {
    let lastAppliedSpeed = 1.0;

    // Load initial speed from storage
    chrome.storage.local.get(['youtubeSpeed'], (data) => {
        if (data.youtubeSpeed) {
            lastAppliedSpeed = data.youtubeSpeed;
            applySpeed(lastAppliedSpeed);
        }
    });

    function applySpeed(speed) {
        const video = document.querySelector('video');
        if (video) {
            video.playbackRate = speed;
            lastAppliedSpeed = speed;
            return true;
        }
        return false;
    }

    // Handle messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'setSpeed') {
            const success = applySpeed(request.speed);
            sendResponse({ success: success });
        } else if (request.action === 'getSpeed') {
            const video = document.querySelector('video');
            sendResponse({ speed: video ? video.playbackRate : lastAppliedSpeed });
        }
        return true;
    });

    // Observer to re-apply speed when video element is added or changed (SPA navigation)
    const observer = new MutationObserver(() => {
        const video = document.querySelector('video');
        if (video && video.playbackRate !== lastAppliedSpeed) {
            video.playbackRate = lastAppliedSpeed;
            
            // Re-apply on play as well, sometimes YouTube resets it
            video.removeEventListener('play', onPlayApply);
            video.addEventListener('play', onPlayApply);
        }
    });

    function onPlayApply() {
        if (this.playbackRate !== lastAppliedSpeed) {
            this.playbackRate = lastAppliedSpeed;
        }
    }

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check and periodic poll for edge cases
    setInterval(() => {
        const video = document.querySelector('video');
        if (video && video.playbackRate !== lastAppliedSpeed) {
            video.playbackRate = lastAppliedSpeed;
        }
    }, 2000);

})();
