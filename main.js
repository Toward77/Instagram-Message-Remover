// Instagram Message Deletion Script v4 - SIMPLE
// 1. Click the 3-dot menu
// 2. Click "Unsend"
// 3. Confirm "Unsend"

let del = true;

const UNSEND_TEXT_VARIANTS = [
    'unsend',
    'remove for you',
    'delete for you'
];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Click and wait until the menu is actually visible
async function clickAndWaitForMenu(button, checkFn, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`    Attempt ${attempt + 1}/${maxAttempts}...`);
        
        // Ensure button is visible before clicking
        button.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        await delay(100);
        
        // Click
        button.click();
        
        // Wait briefly
        await delay(800);
        
        // Check if menu appeared
        if (checkFn()) {
            console.log(`    ✓ Menu opened`);
            return true;
        }
        
        console.log(`    ✗ Menu did not open, retrying...`);
        await delay(300);
    }
    
    console.log(`    ✗ Failed after ${maxAttempts} attempts`);
    return false;
}

function normalizeText(text) {
    return (text || '').trim().toLowerCase();
}

function isVisible(el) {
    if (!el) return false;
    let style = window.getComputedStyle(el);
    let rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0);
}

function matchesUnsendText(text) {
    let normalized = normalizeText(text);
    return UNSEND_TEXT_VARIANTS.some((variant) => normalized.includes(variant));
}

function getConversationWindow() {
    let divs = document.querySelectorAll('div');
    for (let div of divs) {
        if (div.scrollHeight > div.clientHeight + 50 && div.querySelector('[role="row"]')) {
            return div;
        }
    }
    return null;
}

// Find the 3-dot button (3 circles in SVG)
function findThreeDotsButton(messageElement) {
    // Find all SVGs with exactly 3 circles
    let allSvgs = messageElement.querySelectorAll('svg');
    
    for (let svg of allSvgs) {
        let circles = svg.querySelectorAll('circle');
        if (circles.length === 3) {
            // Find closest clickable parent
            let clickable = svg.closest('[role="button"]');
            if (!clickable) {
                // Try parent element with tabindex or button fallback
                clickable = svg.closest('div[tabindex], button');
            }
            if (!clickable) {
                // Fallback to direct parent
                clickable = svg.parentElement;
            }
            
            // Skip links
            if (clickable && !clickable.closest('a') && clickable.tagName !== 'A') {
                return clickable;
            }
        }
    }
    return null;
}

// Find "More options" in menu (kept for fallback diagnostics)
function findMoreOptionsButton() {
    let allElements = document.querySelectorAll('[role="menuitem"], div[tabindex="0"]');
    
    for (let el of allElements) {
        if (el.tagName === 'A' || el.closest('a')) continue;
        
        let style = window.getComputedStyle(el);
        let rect = el.getBoundingClientRect();
        if (style.display === 'none' || rect.width === 0) continue;
        
        let text = (el.innerText || el.textContent || '').toLowerCase();
        if (text.includes('more') && text.includes('option')) {
            return el;
        }
    }
    return null;
}

// Find "Unsend" option in menu
function findUnsendOption() {
    // Instagram changes DOM structure often, so check multiple clickable element types
    let allElements = document.querySelectorAll('button, [role="button"], [role="menuitem"], div[tabindex="0"], span');
    
    for (let el of allElements) {
        if (el.tagName === 'A' || el.closest('a')) continue;
        
        if (!isVisible(el)) continue;
        
        let text = el.innerText || el.textContent || '';
        if (matchesUnsendText(text)) {
            // If this is a span, find a clickable parent
            if (el.tagName === 'SPAN') {
                return el.closest('button, [role="button"], [role="menuitem"], div[tabindex="0"]') || el;
            }
            return el;
        }
    }
    return null;
}

// Is this my message? (messages on the right side)
function isMyMessage(messageElement) {
    let row = messageElement.closest('[role="row"]') || messageElement;
    let rect = row.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    return centerX > window.innerWidth / 2;
}

async function deleteMessages(messages) {
    console.log(`\n━━━ Processing ${messages.length} messages ━━━`);
    let deleted = 0;
    let skipped = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!del) {
            console.log("🛑 Stopped");
            break;
        }
        
        console.log(`\n[${messages.length - i}/${messages.length}]`);
        let msg = messages[i];
        
        let rect = msg.getBoundingClientRect();
        if (rect.height < 30) {
            skipped++;
            continue;
        }
        
        if (!isMyMessage(msg)) {
            console.log("  ⏭ Other user's message");
            continue;
        }
        
        if (rect.top < 100) {
            msg.scrollIntoView({ block: 'center', behavior: 'smooth' });
            await delay(300);
        }
        
        msg.dispatchEvent(new MouseEvent('mouseover', { view: window, bubbles: true }));
        await delay(400);
        
        let btn = findThreeDotsButton(msg);
        if (!btn) {
            let parent = msg.parentElement;
            for (let j = 0; j < 3; j++) {
                if (!parent) break;
                btn = findThreeDotsButton(parent);
                if (btn) break;
                parent = parent.parentElement;
            }
        }
        
        if (!btn) {
            console.log("  ✗ 3-dot button not found");
            skipped++;
            continue;
        }
        
        console.log("  🖱 Clicking 3-dot button...");
        let menuOpened = await clickAndWaitForMenu(btn, () => {
            return findUnsendOption() !== null;
        });
        
        if (!menuOpened) {
            console.log("  ✗ Menu did not open");
            document.body.click();
            await delay(300);
            skipped++;
            continue;
        }
        
        // Step 1: Find and click "Unsend"
        let deleteBtn = findUnsendOption();
        if (!deleteBtn) {
            console.log("  ✗ 'Unsend' option not found in menu");
            document.body.click();
            await delay(300);
            skipped++;
            continue;
        }
        
        console.log("  🖱 Clicking 'Unsend'...");
        deleteBtn.click();
        await delay(800);
        
        // Step 2: Wait and confirm "Unsend"
        let confirmBtn = findUnsendOption();
        if (confirmBtn) {
            console.log("  ✓ Confirming 'Unsend'...");
            confirmBtn.click();
            await delay(500);
        } else {
            console.log("  ⚠ Confirmation button not found");
        }
        
        console.log("  ✅ Deleted");
        deleted++;
        await delay(400);
    }
    
    console.log(`\n━━━ Summary ━━━`);
    console.log(`✅ Deleted: ${deleted}`);
    console.log(`⏭ Skipped: ${skipped}`);
}

async function loadChat() {
    console.log("Loading chat history...");
    let window = getConversationWindow();
    
    if (!window) {
        console.error("❌ Conversation window not found");
        return;
    }
    
    let lastScrollTop = window.scrollTop;
    let samePositionTime = 0;
    let iterations = 0;

    while (del && iterations < 1000) {
        window.scrollTo(0, 0);
        await delay(300);
        iterations++;

        if (window.scrollTop === lastScrollTop) {
            samePositionTime += 300;
        } else {
            samePositionTime = 0;
            console.log(`Loading... (${window.scrollTop})`);
        }

        if (samePositionTime >= 3000) {
            console.log("✓ Reached the top");
            break;
        }

        lastScrollTop = window.scrollTop;
    }
    
    window.scrollTo(0, window.scrollHeight);
    await delay(200);
    console.log("Starting deletion...");
    await deleteChat();
}

async function deleteChat() {
    let iterations = 0;
    
    try {
        while (del && iterations < 500) {
            let window = getConversationWindow();
            if (!window) {
                console.error("❌ Conversation window lost");
                break;
            }
            
            let messages = window.querySelectorAll('[role="row"]');
            if (messages.length === 0) {
                console.log("✓ No more messages");
                break;
            }
            
            console.log(`\nCycle ${iterations + 1}: ${messages.length} rows`);
            await deleteMessages(messages);
            
            if (window.scrollTop <= 1) {
                console.log("✓ Reached the top");
                break;
            }
            
            iterations++;
            await delay(300);
        }
        console.log("\n🎉 DONE");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

function stopDelete() {
    del = false;
    console.log("🛑 Deletion stopped");
}

async function testDeleteOne() {
    console.log("\n━━━ Single-message delete test ━━━");
    let window = getConversationWindow();
    if (!window) {
        console.log("❌ Conversation window not found");
        return;
    }
    
    let messages = window.querySelectorAll('[role="row"]');
    if (messages.length === 0) {
        console.log("❌ No messages found");
        return;
    }
    
    let oldDel = del;
    del = true;
    await deleteMessages([messages[messages.length - 1]]);
    del = oldDel;
    console.log("\n━━━ Test complete ━━━");
}

async function debugMessage() {
    console.log("\n━━━━━━━ MESSAGE DEBUG ━━━━━━━");
    let chatWindow = getConversationWindow();
    if (!chatWindow) {
        console.log("❌ Conversation window not found");
        return;
    }
    
    let messages = chatWindow.querySelectorAll('[role="row"]');
    if (messages.length === 0) {
        console.log("❌ No messages");
        return;
    }
    
    let msg = messages[messages.length - 1];
    console.log("Last message:", msg);
    
    // Hover the message to reveal action buttons
    msg.dispatchEvent(new MouseEvent('mouseover', { view: globalThis, bubbles: true }));
    await delay(500);
    
    console.log("\n📋 All buttons in the message:");
    let buttons = msg.querySelectorAll('[role="button"]');
    buttons.forEach((btn, i) => {
        let label = btn.getAttribute('aria-label') || '(no label)';
        let svg = btn.querySelector('svg');
        let circles = svg ? svg.querySelectorAll('circle').length : 0;
        console.log(`  ${i + 1}. "${label}" - SVG circles: ${circles}`);
    });
    
    console.log("\n🔍 Looking for 3-dot button...");
    let threeDotsBtn = findThreeDotsButton(msg);
    if (threeDotsBtn) {
        console.log("✅ Found 3-dot button:", threeDotsBtn);
        console.log("   aria-label:", threeDotsBtn.getAttribute('aria-label'));
        
        console.log("\n🖱 Clicking 3-dot button...");
        threeDotsBtn.click();
        await delay(700);
        
        console.log("\n📋 Looking for visible elements containing 'unsend':");
        let allElements = document.querySelectorAll('*');
        let foundCount = 0;
        allElements.forEach((el) => {
            let text = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (text.includes('unsend') && text.length < 100) {
                let style = window.getComputedStyle(el);
                let rect = el.getBoundingClientRect();
                let visible = style.display !== 'none' && style.visibility !== 'hidden';
                let hasSize = rect.width > 0 || rect.height > 0;
                
                if (visible && hasSize) {
                    foundCount++;
                    console.log(`  ${foundCount}. <${el.tagName}> "${text.substring(0, 50)}" (w:${Math.round(rect.width)}, h:${Math.round(rect.height)})`);
                    console.log(`     role="${el.getAttribute('role')}" tabindex="${el.getAttribute('tabindex')}"`);
                }
            }
        });
        
        console.log(`\nTotal elements containing 'unsend': ${foundCount}`);
        
        console.log("\n🔍 Looking for 'Unsend'...");
        let unsendBtn = findUnsendOption();
        if (unsendBtn) {
            console.log("✅ Found:", unsendBtn);
            console.log("   Text:", unsendBtn.innerText || unsendBtn.textContent);
        } else {
            console.log("❌ 'Unsend' not found");
        }
        
        // Close menu
        document.body.click();
    } else {
        console.log("❌ 3-dot button not found");
        
        console.log("\n🔍 Looking in parent elements...");
        let parent = msg.parentElement;
        for (let j = 0; j < 3; j++) {
            if (!parent) break;
            console.log(`  Parent ${j + 1}:`, parent);
            let btn = findThreeDotsButton(parent);
            if (btn) {
                console.log(`  ✅ Found in parent ${j + 1}`);
                break;
            }
            parent = parent.parentElement;
        }
    }
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

console.log("═══════════════════════════════════════════════════");
console.log("Instagram Script v4.0 - SIMPLE");
console.log("═══════════════════════════════════════════════════");
console.log("What it does:");
console.log("  1. Finds the 3-dot button (... icon)");
console.log("  2. Clicks 'Unsend'");
console.log("  3. Confirms 'Unsend'");
console.log("");
console.log("Commands:");
console.log("  debugMessage()  - 🔍 Shows what the script can detect");
console.log("  testDeleteOne() - Test on one message");
console.log("  loadChat()      - Load and delete all your messages");
console.log("  stopDelete()    - Stop deletion");
console.log("═══════════════════════════════════════════════════");
console.log("💡 RUN THIS FIRST: debugMessage()");
console.log("   It lists buttons and menu options found by the script");
console.log("═══════════════════════════════════════════════════");
