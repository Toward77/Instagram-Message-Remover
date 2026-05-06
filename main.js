// Instagram Message Deletion Script v5
// 1. Hover message to reveal action buttons
// 2. Click the 3-dot menu button
// 3. Click "Unsend" / "Zrušit odeslání" (supports many languages)
// 4. Confirm in the dialog

let del = true;

const UNSEND_TEXT_VARIANTS = [
    'unsend',
    'zrušit odeslání',
    'remove for you',
    'delete for you'
];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function realClick(el) {
    // Strategy 1: __reactProps direct onClick (most reliable for Instagram)
    let propsKey = Object.keys(el).find(k => k.startsWith('__reactProps'));
    if (propsKey && el[propsKey].onClick) {
        el[propsKey].onClick({ preventDefault: () => {}, stopPropagation: () => {}, nativeEvent: new MouseEvent('click'), target: el, currentTarget: el });
        return;
    }

    // Strategy 2: Walk React fiber tree for onClick
    let fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
    if (fiberKey) {
        let current = el[fiberKey];
        let depth = 0;
        while (current && depth < 15) {
            let props = current.memoizedProps || current.pendingProps;
            if (props && props.onClick) {
                props.onClick({ preventDefault: () => {}, stopPropagation: () => {}, nativeEvent: new MouseEvent('click'), target: el, currentTarget: el });
                return;
            }
            current = current.return;
            depth++;
        }
    }

    // Strategy 3: Fallback full event sequence
    let rect = el.getBoundingClientRect();
    let x = rect.x + rect.width / 2;
    let y = rect.y + rect.height / 2;
    let opts = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
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

// Find the chat scrollable container (right side panel, not the sidebar)
function getConversationWindow() {
    let divs = document.querySelectorAll('div');
    let best = null;
    let bestScore = 0;

    for (let div of divs) {
        let style = window.getComputedStyle(div);
        let rect = div.getBoundingClientRect();

        if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
            div.scrollHeight > div.clientHeight + 50 &&
            rect.height > 200 && rect.width > 200) {

            // Must be on the right side (not the conversation list sidebar)
            let score = 0;
            if (rect.x > 300) score += 10;
            if (rect.width > 400) score += 5;
            if (rect.height > 500) score += 5;
            // Prefer containers with more content
            score += Math.min(div.scrollHeight / 500, 10);

            if (score > bestScore) {
                bestScore = score;
                best = div;
            }
        }
    }
    return best;
}

// Get the inner message list container (drill past single-child wrappers)
function getMessageList(chatWindow) {
    let inner = chatWindow;
    let depth = 0;
    while (inner.children.length <= 2 && depth < 10) {
        let bestChild = null;
        for (let child of inner.children) {
            if (child.tagName === 'DIV') {
                if (!bestChild || child.children.length > bestChild.children.length) {
                    bestChild = child;
                }
            }
        }
        if (!bestChild) break;
        inner = bestChild;
        depth++;
    }
    return inner;
}

// Get all message elements from the chat
function getMessages(chatWindow) {
    let messageList = getMessageList(chatWindow);
    return Array.from(messageList.children).filter(child => {
        let rect = child.getBoundingClientRect();
        return child.tagName === 'DIV' && rect.height > 15;
    });
}

// Click and wait until the expected result appears
async function clickAndWaitForMenu(button, checkFn, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`    Attempt ${attempt + 1}/${maxAttempts}...`);

        button.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        await delay(100);

        realClick(button);
        await delay(800);

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

// Find the 3-dot button (SVG with 3 circles or aria-label match)
function findThreeDotsButton(messageElement) {
    // Strategy 1: SVG with exactly 3 circles (the ⋮ icon)
    let allSvgs = messageElement.querySelectorAll('svg');
    for (let svg of allSvgs) {
        let circles = svg.querySelectorAll('circle');
        if (circles.length === 3) {
            let clickable = svg.closest('[role="button"]') ||
                            svg.closest('div[tabindex], button') ||
                            svg.parentElement;

            if (clickable && !clickable.closest('a') && clickable.tagName !== 'A') {
                return clickable;
            }
        }
    }

    // Strategy 2: aria-label containing "more options" / "další možnosti" etc.
    let allBtns = messageElement.querySelectorAll('[role="button"], button');
    for (let btn of allBtns) {
        let label = (btn.getAttribute('aria-label') || '').toLowerCase();
        if (label.includes('more') || label.includes('další') || label.includes('option') || label.includes('možnost') || label.includes('más') || label.includes('plus') || label.includes('mehr')) {
            if (!btn.closest('a') && btn.tagName !== 'A') {
                return btn;
            }
        }
    }

    return null;
}

// Find "Unsend" option in the context menu
function findUnsendOption() {
    let allElements = document.querySelectorAll('button, [role="button"], [role="menuitem"], div[tabindex="0"], div[tabindex="-1"], span');

    for (let el of allElements) {
        if (el.tagName === 'A' || el.closest('a')) continue;
        if (!isVisible(el)) continue;

        let text = el.innerText || el.textContent || '';
        if (matchesUnsendText(text)) {
            if (el.tagName === 'SPAN') {
                return el.closest('button, [role="button"], [role="menuitem"], div[tabindex="0"], div[tabindex="-1"]') || el;
            }
            return el;
        }
    }
    return null;
}

// Find confirm button inside a dialog
function findConfirmButton() {
    let dialogs = document.querySelectorAll('[role="dialog"]');
    for (let dialog of dialogs) {
        let rect = dialog.getBoundingClientRect();
        if (rect.width === 0) continue;

        let buttons = dialog.querySelectorAll('button, [role="button"]');
        for (let btn of buttons) {
            let text = (btn.innerText || btn.textContent || '').trim().toLowerCase();
            if (matchesUnsendText(text)) {
                return btn;
            }
        }
    }

    // Fallback: find any visible unsend button
    return findUnsendOption();
}

// Is this my message? Check by looking for colored (sent) message bubbles
function isMyMessage(messageElement) {
    // Strategy 1: Check for sent message bubble colors (Instagram uses a blue/purple for sent)
    let allDivs = messageElement.querySelectorAll('div');
    for (let div of allDivs) {
        let style = window.getComputedStyle(div);
        let bg = style.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            let rect = div.getBoundingClientRect();
            if (rect.width > 30 && rect.height > 15) {
                // Parse RGB values
                let match = bg.match(/\d+/g);
                if (match) {
                    let [r, g, b] = match.map(Number);
                    // Sent messages typically have a blue/purple background (r < 150, b > 150)
                    // Received messages are usually grey (r ≈ g ≈ b, all similar values)
                    let isBlue = b > 150 && r < 150;
                    let isGrey = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && r > 30 && r < 100;

                    if (isBlue && rect.x + rect.width > window.innerWidth * 0.6) {
                        return true;
                    }
                }
            }
        }
    }

    // Strategy 2: Fallback to position-based check (right-aligned = sent)
    let row = messageElement;
    let rect = row.getBoundingClientRect();
    // Check if the message content is on the right side
    let innerDivs = messageElement.querySelectorAll('div');
    for (let div of innerDivs) {
        let dr = div.getBoundingClientRect();
        if (dr.width > 30 && dr.height > 15 && dr.width < rect.width * 0.9) {
            // This is likely a message bubble, check its position
            if (dr.x + dr.width > rect.x + rect.width * 0.7) {
                return true;
            }
        }
    }

    return false;
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
        if (rect.height < 15) {
            skipped++;
            continue;
        }

        if (!isMyMessage(msg)) {
            console.log("  ⏭ Not my message");
            continue;
        }

        // Scroll into view if needed
        if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
            msg.scrollIntoView({ block: 'center', behavior: 'smooth' });
            await delay(400);
        }

        // Hover over the message to reveal action buttons
        let msgRect = msg.getBoundingClientRect();
        let cx = msgRect.x + msgRect.width * 0.8;
        let cy = msgRect.y + msgRect.height / 2;

        msg.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: cx, clientY: cy }));
        msg.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: cx, clientY: cy }));
        msg.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: cx, clientY: cy }));
        msg.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
        msg.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
        msg.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
        await delay(500);

        // Find the 3-dot button
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

        // Step 1: Click "Unsend"
        let deleteBtn = findUnsendOption();
        if (!deleteBtn) {
            console.log("  ✗ 'Unsend' option not found in menu");
            document.body.click();
            await delay(300);
            skipped++;
            continue;
        }

        console.log("  🖱 Clicking 'Unsend'...");
        realClick(deleteBtn);
        await delay(500);

        // Step 2: Confirm in dialog (retry until dialog appears)
        let confirmBtn = null;
        for (let attempt = 0; attempt < 6; attempt++) {
            confirmBtn = findConfirmButton();
            if (confirmBtn) break;
            await delay(500);
        }

        if (confirmBtn) {
            console.log("  ✓ Confirming unsend...");
            realClick(confirmBtn);
            await delay(500);
        } else {
            console.log("  ⚠ Confirmation button not found (message may still be deleted)");
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
    let chatWindow = getConversationWindow();

    if (!chatWindow) {
        console.error("❌ Conversation window not found. Make sure you have a chat open.");
        return;
    }

    let lastScrollTop = chatWindow.scrollTop;
    let samePositionTime = 0;
    let iterations = 0;

    while (del && iterations < 1000) {
        chatWindow.scrollTo(0, 0);
        await delay(300);
        iterations++;

        if (chatWindow.scrollTop === lastScrollTop) {
            samePositionTime += 300;
        } else {
            samePositionTime = 0;
            console.log(`Loading... (${chatWindow.scrollTop})`);
        }

        if (samePositionTime >= 3000) {
            console.log("✓ Reached the top");
            break;
        }

        lastScrollTop = chatWindow.scrollTop;
    }

    chatWindow.scrollTo(0, chatWindow.scrollHeight);
    await delay(200);
    console.log("Starting deletion...");
    await deleteChat();
}

async function deleteChat() {
    let iterations = 0;

    try {
        while (del && iterations < 500) {
            let chatWindow = getConversationWindow();
            if (!chatWindow) {
                console.error("❌ Conversation window lost");
                break;
            }

            let messages = getMessages(chatWindow);
            if (messages.length === 0) {
                console.log("✓ No more messages");
                break;
            }

            console.log(`\nCycle ${iterations + 1}: ${messages.length} messages`);
            await deleteMessages(messages);

            if (chatWindow.scrollTop <= 1) {
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
    let chatWindow = getConversationWindow();
    if (!chatWindow) {
        console.log("❌ Conversation window not found");
        return;
    }

    let messages = getMessages(chatWindow);
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

    let messages = getMessages(chatWindow);
    console.log(`Found ${messages.length} message elements`);

    if (messages.length === 0) {
        console.log("❌ No messages");
        return;
    }

    let msg = messages[messages.length - 1];
    let text = (msg.innerText || '').substring(0, 80);
    console.log(`Last message: "${text}"`);
    console.log(`  Is my message: ${isMyMessage(msg)}`);

    // Hover
    let rect = msg.getBoundingClientRect();
    let cx = rect.x + rect.width * 0.8;
    let cy = rect.y + rect.height / 2;

    msg.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: cx, clientY: cy }));
    msg.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, clientX: cx, clientY: cy }));
    msg.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: cx, clientY: cy }));
    msg.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: cx, clientY: cy }));
    msg.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: cx, clientY: cy }));
    msg.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: cx, clientY: cy }));
    await delay(600);

    console.log("\n📋 Buttons in the message:");
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

        console.log("\n📋 Looking for 'Unsend' option:");
        let unsendBtn = findUnsendOption();
        if (unsendBtn) {
            console.log("✅ Found:", unsendBtn);
            console.log("   Text:", (unsendBtn.innerText || unsendBtn.textContent || '').trim());
        } else {
            console.log("❌ 'Unsend' not found");
            console.log("   Visible menu items:");
            let menuItems = document.querySelectorAll('[role="menuitem"], [role="button"], div[tabindex="0"]');
            menuItems.forEach(el => {
                if (!isVisible(el)) return;
                let t = (el.innerText || '').trim();
                if (t.length > 0 && t.length < 80) {
                    console.log(`     - "${t}"`);
                }
            });
        }

        // Close menu
        document.body.click();
    } else {
        console.log("❌ 3-dot button not found");
        console.log("\n🔍 Looking in parent elements...");
        let parent = msg.parentElement;
        for (let j = 0; j < 3; j++) {
            if (!parent) break;
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
console.log("Instagram Script v5.0");
console.log("═══════════════════════════════════════════════════");
console.log("Supports: 🇬🇧 English, 🇨🇿 Čeština");
console.log("");
console.log("🚀 Auto-starting in 2 seconds...");
console.log("   Type stopDelete() to stop at any time");
console.log("═══════════════════════════════════════════════════");

setTimeout(() => loadChat(), 2000);
