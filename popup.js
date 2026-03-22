document.addEventListener('DOMContentLoaded', async () => {
    const currentValSpan = document.getElementById('current-val');
    const customInput = document.getElementById('custom-input');
    const applyCustomBtn = document.getElementById('apply-custom');
    const statusMsg = document.getElementById('status-msg');
    const speedButtons = document.querySelectorAll('.speed-btn');

    // Load saved speed
    const data = await chrome.storage.local.get(['youtubeSpeed']);
    const savedSpeed = data.youtubeSpeed || 1.0;
    updateUI(savedSpeed);

    // Initial message to get current speed from content script if possible
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url?.includes('youtube.com')) {
            chrome.tabs.sendMessage(tab.id, { action: 'getSpeed' }, (response) => {
                if (response && response.speed) {
                    updateUI(response.speed);
                }
            });
        }
    } catch (e) {
        console.log('Content script not ready or not on YouTube');
    }

    // Preset buttons
    speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            applySpeed(speed);
        });
    });

    // Custom speed
    applyCustomBtn.addEventListener('click', () => {
        const speed = parseFloat(customInput.value);
        if (isNaN(speed) || speed < 1 || speed > 4) {
            showStatus('Please enter a value between 1 and 4', true);
            return;
        }
        applySpeed(speed);
    });

    async function applySpeed(speed) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.url?.includes('youtube.com')) {
                showStatus('Not a YouTube page', true);
                return;
            }

            chrome.tabs.sendMessage(tab.id, { action: 'setSpeed', speed: speed }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus('Error: Refresh the page', true);
                    return;
                }
                if (response && response.success) {
                    chrome.storage.local.set({ youtubeSpeed: speed });
                    updateUI(speed);
                    showStatus(`Speed set to ${speed}x`);
                } else {
                    showStatus('No video element found', true);
                }
            });
        } catch (error) {
            showStatus('Execution failed', true);
        }
    }

    function updateUI(speed) {
        currentValSpan.textContent = `${speed}x`;
        speedButtons.forEach(btn => {
            if (parseFloat(btn.dataset.speed) === speed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        if (![1, 1.5, 2, 2.5, 3, 4].includes(speed)) {
            customInput.value = speed;
        }
    }

    function showStatus(msg, isError = false) {
        statusMsg.textContent = msg;
        statusMsg.style.color = isError ? '#ff4444' : '#aaaaaa';
        setTimeout(() => {
            if (statusMsg.textContent === msg) statusMsg.textContent = '';
        }, 3000);
    }
});
