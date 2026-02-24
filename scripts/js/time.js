// Local Time - Use config to set timezone and format
function updateLocalInfo() {
    const el = document.querySelector('.site-time');
    if (!el) return;
    
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
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: config.timeZone,
        hour: config.hour,
        minute: config.minute,
        second: config.second,
        hour12: config.hour12
    });
    
    el.textContent = formatter.format(now);
}

// Update immediately and every second
updateLocalInfo();
setInterval(updateLocalInfo, 1000);