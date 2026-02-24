// Stylize codeblock
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('div.highlight, figure.highlight').forEach((element) => {
        const codeElement = element.querySelector('.rouge-code');
        let language = '';
        
        if (codeElement) {
            const codeClasses = codeElement.className.split(' ');
            const langClass = codeClasses.find(c => c.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
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
        
        const header = document.createElement('div');
        header.className = 'code-header';
        
        const noLineNumbersLanguages = ['console', 'shell', 'bash', 'sh', 'zsh', 'powershell'];
        if (noLineNumbersLanguages.includes(language)) {
            element.classList.add('no-line-numbers');
        }
        
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
        
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fa-solid fa-copy"></i>';
        button.type = 'button';
        button.title = 'Copy code';
        
        element.insertBefore(header, element.firstChild);
        header.appendChild(button);
        
        button.addEventListener('click', () => copyCode(element, button));
    });
});

function copyCode(element, button) {
    const codeBlock = element.querySelector('.rouge-code') || element.querySelector('code');
    const text = codeBlock.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => button.innerHTML = '<i class="fa-solid fa-copy"></i>', 2000);
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        button.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => button.innerHTML = '<i class="fa-solid fa-copy"></i>', 2000);
    });
}

// Tree diagram converter for language-tree code blocks
function convertTreeBlocks() {
  // Find all code elements with language-tree class
  const treeCodes = document.querySelectorAll('code.language-tree, code.lang-tree');
  
  treeCodes.forEach(codeElement => {
    const content = codeElement.textContent;
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) return;
    
    // Parse lines and their indentation levels
    const parsedLines = lines.map(line => {
      // Get the leading whitespace count
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      return { indent, text: trimmed };
    });
    
    // Build tree structure
    const result = [];
    const stack = []; // stores { indent, isLast }
    
    parsedLines.forEach((item, index) => {
      // Pop stack items that have less or equal indentation
      while (stack.length > 0 && stack[stack.length - 1].indent >= item.indent) {
        stack.pop();
      }
      
      // Determine if this item is the last in its parent
      let isLast = false;
      const nextItem = parsedLines[index + 1];
      if (!nextItem || nextItem.indent < item.indent) {
        isLast = true;
      } else if (nextItem && nextItem.indent === item.indent) {
        isLast = false;
      } else {
        // Next item has greater indent, need to check if it's the last at current level
        // Find items at same indent level after this
        const remainingAtLevel = parsedLines.slice(index + 1).findIndex(l => l.indent <= item.indent);
        isLast = remainingAtLevel === -1;
      }
      
      // Build the tree prefix
      let prefix = '';
      stack.forEach((s, i) => {
        prefix += s.isLast ? '    ' : '│   ';
      });
      
      // Add the tree branch character only if indent > 0 (root level has no prefix)
      if (item.indent > 0) {
        prefix += isLast ? '└── ' : '├── ';
      }
      
      result.push(prefix + item.text);
      
      // Push current to stack for children
      stack.push({ indent: item.indent, isLast });
    });
    
    const treeContent = result.join('\n');
    
    // Get the parent pre element
    const preElement = codeElement.closest('pre');
    
    // Create the HTML wrapper structure
    const wrapper = document.createElement('div');
    wrapper.className = 'language-plaintext highlighter-rouge';
    
    wrapper.innerHTML = `
      <div class="highlight">
        <pre class="highlight"><code><table class="rouge-table"><tbody><tr><td class="rouge-code"><pre>${escapeHtml(treeContent)}</pre></td></tr></tbody></table></code></pre>
      </div>
    `;
    
    // Replace the pre element with our wrapper
    if (preElement) {
      preElement.replaceWith(wrapper);
    }
  });
}

// Escape HTML special characters
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Run on DOMContentLoaded
document.addEventListener("DOMContentLoaded", convertTreeBlocks);
document.addEventListener("DOMContentLoaded", convertTreeBlocks);