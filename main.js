// Instagram Message Unsend Script v6.0
// Automatically unsends all your messages in the currently open conversation.
// Supports: English, Czech

let del = true;

const UNSEND_LABELS = ['unsend', 'zrušit odeslání'];
const CONFIRM_DIALOG_LABELS = ['unsend message', 'zrušit odeslání zprávy'];

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Click an element using React internals (Instagram blocks standard .click())
function reactClick(el) {
    // 1. Direct __reactProps.onClick (fastest, most reliable)
    let propsKey = Object.keys(el).find(k => k.startsWith('__reactProps'));
    if (propsKey && el[propsKey].onClick) {
        el[propsKey].onClick({
            preventDefault() {},
            stopPropagation() {},
            nativeEvent: new MouseEvent('click'),
            target: el,
            currentTarget: el
        });
        return true;
    }

    // 2. Walk the React fiber tree to find onClick
    let fiberKey = Object.keys(el).find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    if (fiberKey) {
        let fiber = el[fiberKey];
        for (let i = 0; i < 15 && fiber; i++) {
            let props = fiber.memoizedProps || fiber.pendingProps;
            if (props && props.onClick) {
                props.onClick({
                    preventDefault() {},
                    stopPropagation() {},
                    nativeEvent: new MouseEvent('click'),
                    target: el,
                    currentTarget: el
                });
                return true;
            }
            fiber = fiber.return;
        }
    }

    // 3. Fallback: dispatch full pointer/mouse event sequence
    let rect = el.getBoundingClientRect();
    let opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: rect.x + rect.width / 2,
        clientY: rect.y + rect.height / 2,
        button: 0
    };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
    return false;
}

// Simulate hovering over an element to reveal action buttons
function hoverElement(el) {
    let rect = el.getBoundingClientRect();
    let cx = rect.x + rect.width * 0.8;
    let cy = rect.y + rect.height / 2;
    let opts = { bubbles: true, clientX: cx, clientY: cy };

    el.dispatchEvent(new PointerEvent('pointerenter', opts));
    el.dispatchEvent(new PointerEvent('pointerover', opts));
    el.dispatchEvent(new PointerEvent('pointermove', opts));
    el.dispatchEvent(new MouseEvent('mouseenter', opts));
    el.dispatchEvent(new MouseEvent('mouseover', opts));
    el.dispatchEvent(new MouseEvent('mousemove', opts));
}

// ── DOM Finders ──

// Find the scrollable chat container on the right side of the screen
function findChatContainer() {
    let best = null;
    let bestScore = -1;

    for (let div of document.querySelectorAll('div')) {
        let style = window.getComputedStyle(div);
        let rect = div.getBoundingClientRect();

        let isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll');
        let hasContent = div.scrollHeight > div.clientHeight + 50;
        let isLargeEnough = rect.height > 200 && rect.width > 200;

        if (!isScrollable || !hasContent || !isLargeEnough) continue;

        // Score by position and size — prefer the right-side panel
        let score = 0;
        if (rect.x > 200) score += 10;
        if (rect.x > 400) score += 5;
        if (rect.width > 400) score += 5;
        if (rect.height > 500) score += 5;
        score += Math.min(div.scrollHeight / 500, 10);

        if (score > bestScore) {
            bestScore = score;
            best = div;
        }
    }
    return best;
}

// Drill into single-child wrapper divs to reach the actual message list
function findMessageList(container) {
    let el = container;
    for (let i = 0; i < 10; i++) {
        if (el.children.length > 2) break;
        let bestChild = null;
        for (let child of el.children) {
            if (child.tagName === 'DIV') {
                if (!bestChild || child.children.length > bestChild.children.length) {
                    bestChild = child;
                }
            }
        }
        if (!bestChild) break;
        el = bestChild;
    }
    return el;
}

// Get visible message elements from the message list
function getMessages(container) {
    let list = findMessageList(container);
    return Array.from(list.children).filter(child => {
        return child.tagName === 'DIV' && child.getBoundingClientRect().height > 20;
    });
}

// Check if a message was sent by the current user (blue bubble on the right)
function isSentByMe(messageEl) {
    for (let div of messageEl.querySelectorAll('div')) {
        let bg = window.getComputedStyle(div).backgroundColor;
        if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') continue;

        let rect = div.getBoundingClientRect();
        if (rect.width < 30 || rect.height < 15) continue;

        let match = bg.match(/\d+/g);
        if (!match) continue;
        let [r, g, b] = match.map(Number);

        // Instagram sent messages use a blue/purple background
        if (b > 150 && r < 150 && rect.x + rect.width > window.innerWidth * 0.55) {
            return true;
        }
    }

    // Fallback: position-based check (right-aligned content)
    let containerRect = messageEl.getBoundingClientRect();
    for (let div of messageEl.querySelectorAll('div')) {
        let rect = div.getBoundingClientRect();
        if (rect.width > 30 && rect.height > 15 && rect.width < containerRect.width * 0.9) {
            if (rect.x + rect.width > containerRect.x + containerRect.width * 0.7) {
                return true;
            }
        }
    }

    return false;
}

// Find the 3-dot (⋮) menu button near a message
function findDotsButton(messageEl) {
    // Search the message element and its nearby parents/siblings
    let searchAreas = [messageEl];
    if (messageEl.parentElement) {
        searchAreas.push(messageEl.parentElement);
        // Also check sibling elements (the button may render as a sibling)
        for (let sib of messageEl.parentElement.children) {
            if (sib !== messageEl) searchAreas.push(sib);
        }
    }

    for (let area of searchAreas) {
        for (let svg of area.querySelectorAll('svg')) {
            if (svg.querySelectorAll('circle').length === 3) {
                let clickable = svg.closest('[role="button"]') ||
                                svg.closest('div[tabindex]') ||
                                svg.closest('button') ||
                                svg.parentElement;

                if (clickable && clickable.tagName !== 'A' && !clickable.closest('a')) {
                    return clickable;
                }
            }
        }
    }
    return null;
}

// Find "Unsend" option in the context menu using exact text node matching
function findUnsendMenuItem() {
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
        let text = (node.textContent || '').trim().toLowerCase();
        if (!UNSEND_LABELS.includes(text)) continue;

        // Walk up to find the closest clickable interactive element
        let el = node.parentElement;
        for (let i = 0; i < 8 && el; i++) {
            let isClickable = el.tagName === 'BUTTON' ||
                              el.getAttribute('role') === 'button' ||
                              el.getAttribute('role') === 'menuitem' ||
                              el.getAttribute('tabindex') === '0';

            if (isClickable) {
                let elText = (el.innerText || '').trim().toLowerCase();
                if (UNSEND_LABELS.includes(elText)) {
                    let rect = el.getBoundingClientRect();
                    if (rect.width > 0) return el;
                }
            }
            el = el.parentElement;
        }
    }
    return null;
}

// Find the confirm button inside the confirmation dialog
// (distinguished from context menu by the question text)
function findConfirmButton() {
    for (let dialog of document.querySelectorAll('[role="dialog"]')) {
        let rect = dialog.getBoundingClientRect();
        if (rect.width === 0) continue;

        let dialogText = (dialog.innerText || '').toLowerCase();
        let isConfirmation = CONFIRM_DIALOG_LABELS.some(label => dialogText.includes(label));
        if (!isConfirmation) continue;

        // Look for <button> with matching text
        for (let btn of dialog.querySelectorAll('button')) {
            let text = (btn.innerText || '').trim().toLowerCase();
            if (UNSEND_LABELS.some(label => text.includes(label))) {
                return btn;
            }
        }

        // Fallback: div[role="button"]
        for (let btn of dialog.querySelectorAll('[role="button"]')) {
            let text = (btn.innerText || '').trim().toLowerCase();
            if (UNSEND_LABELS.includes(text)) {
                return btn;
            }
        }
    }
    return null;
}

// Close any open menu/dialog
function dismissMenu() {
    document.body.click();
    document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true
    }));
}

// ── Core Logic ──

async function unsendMessage(messageEl) {
    // Scroll the message into view
    let rect = messageEl.getBoundingClientRect();
    if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
        messageEl.scrollIntoView({ block: 'center', behavior: 'auto' });
        await delay(300);
    }

    // Step 1: Hover to reveal action buttons
    hoverElement(messageEl);
    await delay(600);

    // Step 2: Find and click the 3-dot button
    let dotsBtn = findDotsButton(messageEl);
    if (!dotsBtn) {
        // Retry hover with a longer wait
        hoverElement(messageEl);
        await delay(1000);
        dotsBtn = findDotsButton(messageEl);
    }
    if (!dotsBtn) {
        console.log('    ✗ 3-dot button not found');
        return false;
    }

    reactClick(dotsBtn);
    await delay(700);

    // Step 3: Find and click "Unsend" in the context menu
    let unsendBtn = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        unsendBtn = findUnsendMenuItem();
        if (unsendBtn) break;
        await delay(400);
    }
    if (!unsendBtn) {
        console.log('    ✗ "Unsend" not found in menu');
        dismissMenu();
        await delay(300);
        return false;
    }

    reactClick(unsendBtn);
    await delay(800);

    // Step 4: Find and click confirm button in the dialog
    let confirmBtn = null;
    for (let attempt = 0; attempt < 8; attempt++) {
        confirmBtn = findConfirmButton();
        if (confirmBtn) break;
        await delay(400);
    }
    if (!confirmBtn) {
        console.log('    ⚠ Confirm dialog not found');
        dismissMenu();
        await delay(300);
        return false;
    }

    reactClick(confirmBtn);
    await delay(600);
    return true;
}

async function processMessages() {
    let totalDeleted = 0;
    let totalSkipped = 0;
    let cycles = 0;

    while (del && cycles < 500) {
        let container = findChatContainer();
        if (!container) {
            console.log('❌ Chat container not found');
            break;
        }

        let messages = getMessages(container);
        if (messages.length === 0) {
            console.log('✅ No more messages');
            break;
        }

        console.log(`\n── Cycle ${cycles + 1}: ${messages.length} messages ──`);

        let deletedThisCycle = 0;

        // Process from bottom to top
        for (let i = messages.length - 1; i >= 0; i--) {
            if (!del) {
                console.log('🛑 Stopped by user');
                return { deleted: totalDeleted, skipped: totalSkipped };
            }

            let msg = messages[i];
            let msgRect = msg.getBoundingClientRect();
            if (msgRect.height < 20) continue;

            if (!isSentByMe(msg)) {
                continue;
            }

            let preview = (msg.innerText || '').trim().substring(0, 30).replace(/\n/g, ' ');
            console.log(`  [${messages.length - i}] "${preview}..."`);

            let success = await unsendMessage(msg);
            if (success) {
                totalDeleted++;
                deletedThisCycle++;
                console.log('    ✅ Unsent');
            } else {
                totalSkipped++;
            }

            await delay(300);
        }

        if (deletedThisCycle === 0) {
            // Scroll up to load more messages
            container.scrollTo(0, Math.max(0, container.scrollTop - container.clientHeight));
            await delay(800);

            let newMessages = getMessages(container);
            if (newMessages.length === messages.length) {
                console.log('✅ No more messages to process');
                break;
            }
        }

        cycles++;
    }

    return { deleted: totalDeleted, skipped: totalSkipped };
}

async function scrollToTop() {
    console.log('⏫ Loading chat history...');
    let container = findChatContainer();
    if (!container) {
        console.error('❌ Chat container not found. Make sure a conversation is open.');
        return false;
    }

    let lastScrollTop = container.scrollTop;
    let staleTime = 0;

    for (let i = 0; i < 1000 && del; i++) {
        container.scrollTo(0, 0);
        await delay(300);

        if (container.scrollTop === lastScrollTop) {
            staleTime += 300;
        } else {
            staleTime = 0;
        }

        if (staleTime >= 3000) break;
        lastScrollTop = container.scrollTop;
    }

    console.log('✅ Reached the top');
    container.scrollTo(0, container.scrollHeight);
    await delay(300);
    return true;
}

// ── Public API ──

async function start() {
    del = true;
    console.log('🚀 Starting...');

    let loaded = await scrollToTop();
    if (!loaded) return;

    let result = await processMessages();
    console.log(`\n${'═'.repeat(40)}`);
    console.log(`✅ Deleted: ${result.deleted}`);
    console.log(`⏭  Skipped: ${result.skipped}`);
    console.log(`${'═'.repeat(40)}`);
}

function stop() {
    del = false;
    console.log('🛑 Stopping...');
}

// ── Auto-start ──

console.log('═'.repeat(50));
console.log('Instagram Unsend Script v6.0');
console.log('═'.repeat(50));
console.log('🇬🇧 English  🇨🇿 Čeština');
console.log('');
console.log('🚀 Auto-starting in 2 seconds...');
console.log('   Type stop() to cancel at any time');
console.log('═'.repeat(50));

setTimeout(() => start(), 2000);
