// Local Time
function updateLocalInfo() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const el = document.querySelector('.site-time');
    if (el) {
        el.innerHTML = formatter.format(now);
    }
}

updateLocalInfo();
setInterval(updateLocalInfo, 1000);

// Stylize codeblock
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('div.highlight, figure.highlight').forEach((element) => {
        // Try to find the language from the code element
        const codeElement = element.querySelector('.rouge-code');
        let language = '';
        
        if (codeElement) {
            // Try to get language from class on code element (e.g., .language-cpp)
            const codeClasses = codeElement.className.split(' ');
            const langClass = codeClasses.find(c => c.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                // Try to get from parent element (e.g., .highlighter-rouge with .language-cpp)
                const parentElement = element.parentElement;
                if (parentElement) {
                    const parentClasses = parentElement.className.split(' ');
                    const parentLangClass = parentClasses.find(c => c.startsWith('language-'));
                    if (parentLangClass) {
                        language = parentLangClass.replace('language-', '');
                    }
                }
            }
        }
        
        // Create the code header
        const header = document.createElement('div');
        header.className = 'code-header';
        
        // Add class to hide line numbers for console, shell, bash
        const noLineNumbersLanguages = [
            'console',
            'shell',
            'bash',
            'sh',
            'zsh',
            'powershell'
        ];
        if (noLineNumbersLanguages.includes(language)) {
            element.classList.add('no-line-numbers');
        }
        
        // Create language label with </> icon (only for code, not plain text)
        const languageLabel = document.createElement('span');
        languageLabel.className = 'code-language';

        if (language) {
            if (language === 'plaintext' || language === 'text') {
                languageLabel.innerHTML = language;
            } else if (['shell', 'powershell'].includes(language)) {
                languageLabel.innerHTML = '<span class="window-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></span> ' + language;
            } else if (['console', 'bash', 'sh', 'zsh'].includes(language)) {
                languageLabel.innerHTML = '<i class="fa-solid fa-terminal"></i> ' + language;
            } else {
                languageLabel.innerHTML = '<i class="fa-solid fa-code"></i> ' + language;
            }
        }

        header.appendChild(languageLabel);
        
        // Create the copy button
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fa-solid fa-copy"></i>';
        button.type = 'button';
        button.title = 'Copy code';
        
        // Insert the header at the beginning of the element
        element.insertBefore(header, element.firstChild);
        
        // Add the copy button to the header
        header.appendChild(button);
        
        button.addEventListener('click', () => {
            copyCode(element, button);
        });
    });
});

// Copy code function
function copyCode(element, button) {
    const codeBlock = element.querySelector('.rouge-code') || element.querySelector('code');
    const text = codeBlock.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
            button.innerHTML = '<i class="fa-solid fa-copy"></i>';
        }, 2000);
    }).catch((err) => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers or HTTP
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            button.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                button.innerHTML = '<i class="fa-solid fa-copy"></i>';
            }, 2000);
        } catch (e) {
            console.error('Fallback copy failed: ', e);
        }
        document.body.removeChild(textarea);
    });
}