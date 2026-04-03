// Local Time - Use config to set timezone and format
function updateLocalInfo() {
    const el = document.querySelector('.site-time');

    // Get config from data attribute or use defaults
    const defaultConfig = {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    let config = defaultConfig;
    const siteInfo = document.querySelector('.site-stat[data-time-config]');

    if (siteInfo) {
        try {
            const rawConfig = siteInfo.getAttribute('data-time-config');
            const parsed = JSON.parse(rawConfig);
            if (parsed) config = { ...defaultConfig, ...parsed };
        } catch (e) {
            console.warn('Failed to parse time config:', e);
        }
    }

    // Format current time with config
    const now = new Date();
    if (el) {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: config.timeZone,
            hour: config.hour,
            minute: config.minute,
            second: config.second,
            hour12: config.hour12
        });

        el.textContent = formatter.format(now);
    }

    // Update kaomoji based on time
    updateKaomoji(now, config.timeZone);
}


function updateKaomoji(now, timeZone) {
    const activeKaomoji = document.getElementById('kaomoji-active');
    const sleepKaomoji = document.getElementById('kaomoji-sleep');
    if (!activeKaomoji || !sleepKaomoji) return;

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });
        const parts = formatter.formatToParts(now);
        let hour = 0, minute = 0;
        for (const part of parts) {
            if (part.type === 'hour') hour = parseInt(part.value);
            if (part.type === 'minute') minute = parseInt(part.value);
        }

        const totalMinutes = hour * 60 + minute;
        // Active between 8:01 AM (481 min) to 8:00 PM (1200 min)
        const isActiveTime = totalMinutes >= 481 && totalMinutes <= 1200;

        if (isActiveTime) {
            activeKaomoji.classList.remove('hidden');
            sleepKaomoji.classList.add('hidden');
        } else {
            activeKaomoji.classList.add('hidden');
            sleepKaomoji.classList.remove('hidden');
        }
    } catch (e) {
        console.warn('Failed to determine kaomoji state:', e);
        // Default to active as requested
        activeKaomoji.classList.remove('hidden');
        sleepKaomoji.classList.add('hidden');
    }
}

// Update immediately and every second
updateLocalInfo();
setInterval(updateLocalInfo, 1000);
