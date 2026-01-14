// Instagram Message Deletion Script v4 - JEDNODUCHÝ
// 1. Klikni na 3 tečky
// 2. Klikni na "Zrušit odeslání"
// 3. Potvrď "Zrušit odeslání"

let del = true;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Klikni a počkej, až se menu opravdu zobrazí
async function clickAndWaitForMenu(button, checkFn, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        console.log(`    Pokus ${attempt + 1}/${maxAttempts}...`);
        
        // Ujisti se, že tlačítko je viditelné
        button.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        await delay(100);
        
        // Klikni
        button.click();
        
        // Počkej chvíli
        await delay(800);
        
        // Zkontroluj, jestli se menu objevilo
        if (checkFn()) {
            console.log(`    ✓ Menu se otevřelo`);
            return true;
        }
        
        console.log(`    ✗ Menu se neotevřelo, zkouším znovu...`);
        await delay(300);
    }
    
    console.log(`    ✗ Selhalo po ${maxAttempts} pokusech`);
    return false;
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

// Najdi tlačítko se 3 tečkami (3 circles v SVG)
function findThreeDotsButton(messageElement) {
    // Najdi všechny SVG s přesně 3 circles
    let allSvgs = messageElement.querySelectorAll('svg');
    
    for (let svg of allSvgs) {
        let circles = svg.querySelectorAll('circle');
        if (circles.length === 3) {
            // Najdi nejbližšího klikatelného rodiče
            let clickable = svg.closest('[role="button"]');
            if (!clickable) {
                // Zkus rodičovský element, který má tabindex nebo je div s event handlerem
                clickable = svg.closest('div[tabindex], button');
            }
            if (!clickable) {
                // Fallback - zkus rodičovský div
                clickable = svg.parentElement;
            }
            
            // Přeskoč odkazy
            if (clickable && !clickable.closest('a') && clickable.tagName !== 'A') {
                return clickable;
            }
        }
    }
    return null;
}

// Najdi "Další možnosti" v menu
function findMoreOptionsButton() {
    let allElements = document.querySelectorAll('[role="menuitem"], div[tabindex="0"]');
    
    for (let el of allElements) {
        if (el.tagName === 'A' || el.closest('a')) continue;
        
        let style = window.getComputedStyle(el);
        let rect = el.getBoundingClientRect();
        if (style.display === 'none' || rect.width === 0) continue;
        
        let text = (el.innerText || el.textContent || '').toLowerCase();
        if (text.includes('další') && text.includes('možnost')) {
            return el;
        }
    }
    return null;
}

// Najdi "Zrušit odeslání" v menu
function findUnsendOption() {
    // Hledať jakékoliv elementy s textem "Zrušit odeslání" (nejen button)
    let allElements = document.querySelectorAll('button, div[role="menuitem"], div[tabindex="0"], span');
    
    for (let el of allElements) {
        if (el.tagName === 'A' || el.closest('a')) continue;
        
        let style = window.getComputedStyle(el);
        let rect = el.getBoundingClientRect();
        // Zmírněná kontrola viditelnosti
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        if (rect.width === 0 && rect.height === 0) continue;
        
        let text = (el.innerText || el.textContent || '').toLowerCase();
        if (text.includes('zrušit') && text.includes('odesl')) {
            // Pokud je to span, zkus najít klikací rodič
            if (el.tagName === 'SPAN') {
                return el.closest('button, div[role="menuitem"], div[tabindex="0"]') || el;
            }
            return el;
        }
    }
    return null;
}

// Je to moje zpráva? (zprávy vpravo)
function isMyMessage(messageElement) {
    let row = messageElement.closest('[role="row"]') || messageElement;
    let rect = row.getBoundingClientRect();
    let centerX = rect.left + rect.width / 2;
    return centerX > window.innerWidth / 2;
}

async function deleteMessages(messages) {
    console.log(`\n━━━ Zpracovávám ${messages.length} zpráv ━━━`);
    let deleted = 0;
    let skipped = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        if (!del) {
            console.log("🛑 Zastaveno");
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
            console.log("  ⏭ Zpráva druhého uživatele");
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
            console.log("  ✗ 3 tečky nenalezeny");
            skipped++;
            continue;
        }
        
        console.log("  🖱 Klik na 3 tečky...");
        let menuOpened = await clickAndWaitForMenu(btn, () => {
            return findUnsendOption() !== null;
        });
        
        if (!menuOpened) {
            console.log("  ✗ Menu se neotevřelo");
            document.body.click();
            await delay(300);
            skipped++;
            continue;
        }
        
        // Krok 1: Najdi a klikni na "Zrušit odeslání"
        let deleteBtn = findUnsendOption();
        if (!deleteBtn) {
            console.log("  ✗ 'Zrušit odeslání' nenalezeno v menu");
            document.body.click();
            await delay(300);
            skipped++;
            continue;
        }
        
        console.log("  🖱 Klik na 'Zrušit odeslání'...");
        deleteBtn.click();
        await delay(800);
        
        // Krok 2: Počkat a potvrdit "Zrušit odeslání"
        let confirmBtn = findUnsendOption();
        if (confirmBtn) {
            console.log("  ✓ Potvrzuji 'Zrušit odeslání'...");
            confirmBtn.click();
            await delay(500);
        } else {
            console.log("  ⚠ Potvrzovací tlačítko nenalezeno");
        }
        
        console.log("  ✅ Smazáno!");
        deleted++;
        await delay(400);
    }
    
    console.log(`\n━━━ Souhrn ━━━`);
    console.log(`✅ Smazáno: ${deleted}`);
    console.log(`⏭ Přeskočeno: ${skipped}`);
}

async function loadChat() {
    console.log("Načítám historii chatu...");
    let window = getConversationWindow();
    
    if (!window) {
        console.error("❌ Nelze najít okno konverzace");
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
            console.log(`Načítám... (${window.scrollTop})`);
        }

        if (samePositionTime >= 3000) {
            console.log("✓ Dosažen začátek");
            break;
        }

        lastScrollTop = window.scrollTop;
    }
    
    window.scrollTo(0, window.scrollHeight);
    await delay(200);
    console.log("Zahajuji mazání...");
    deleteChat();
}

async function deleteChat() {
    let iterations = 0;
    
    try {
        while (del && iterations < 500) {
            let window = getConversationWindow();
            if (!window) {
                console.error("❌ Okno konverzace ztraceno");
                break;
            }
            
            let messages = window.querySelectorAll('[role="row"]');
            if (messages.length === 0) {
                console.log("✓ Žádné další zprávy");
                break;
            }
            
            console.log(`\nCyklus ${iterations + 1}: ${messages.length} řádků`);
            await deleteMessages(messages);
            
            if (window.scrollTop <= 1) {
                console.log("✓ Dosažen začátek");
                break;
            }
            
            iterations++;
            await delay(300);
        }
        console.log("\n🎉 HOTOVO!");
    } catch (error) {
        console.error("❌ Chyba:", error);
    }
}

function stopDelete() {
    del = false;
    console.log("🛑 Mazání zastaveno");
}

async function testDeleteOne() {
    console.log("\n━━━ Test smazání 1 zprávy ━━━");
    let window = getConversationWindow();
    if (!window) {
        console.log("❌ Okno konverzace nenalezeno");
        return;
    }
    
    let messages = window.querySelectorAll('[role="row"]');
    if (messages.length === 0) {
        console.log("❌ Žádné zprávy nenalezeny");
        return;
    }
    
    let oldDel = del;
    del = true;
    await deleteMessages([messages[messages.length - 1]]);
    del = oldDel;
    console.log("\n━━━ Test dokončen ━━━");
}

async function debugMessage() {
    console.log("\n━━━━━━━ DEBUG ZPRÁVY ━━━━━━━");
    let chatWindow = getConversationWindow();
    if (!chatWindow) {
        console.log("❌ Okno konverzace nenalezeno");
        return;
    }
    
    let messages = chatWindow.querySelectorAll('[role="row"]');
    if (messages.length === 0) {
        console.log("❌ Žádné zprávy");
        return;
    }
    
    let msg = messages[messages.length - 1];
    console.log("Poslední zpráva:", msg);
    
    // Najeď myší
    msg.dispatchEvent(new MouseEvent('mouseover', { view: globalThis, bubbles: true }));
    await delay(500);
    
    console.log("\n📋 Všechna tlačítka ve zprávě:");
    let buttons = msg.querySelectorAll('[role="button"]');
    buttons.forEach((btn, i) => {
        let label = btn.getAttribute('aria-label') || '(bez labelu)';
        let svg = btn.querySelector('svg');
        let circles = svg ? svg.querySelectorAll('circle').length : 0;
        console.log(`  ${i + 1}. "${label}" - SVG circles: ${circles}`);
    });
    
    console.log("\n🔍 Hledám 3 tečky...");
    let threeDotsBtn = findThreeDotsButton(msg);
    if (threeDotsBtn) {
        console.log("✅ Nalezeno tlačítko 3 tečky:", threeDotsBtn);
        console.log("   aria-label:", threeDotsBtn.getAttribute('aria-label'));
        
        console.log("\n🖱 Klikám na 3 tečky...");
        threeDotsBtn.click();
        await delay(700);
        
        console.log("\n📋 Hledám všechny elementy s textem 'zrušit':");
        let allElements = document.querySelectorAll('*');
        let foundCount = 0;
        allElements.forEach((el) => {
            let text = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (text.includes('zrušit') && text.length < 100) {
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
        
        console.log(`\nCelkem nalezeno elementů s 'zrušit': ${foundCount}`);
        
        console.log("\n🔍 Hledám 'Zrušit odeslání'...");
        let unsendBtn = findUnsendOption();
        if (unsendBtn) {
            console.log("✅ Nalezeno:", unsendBtn);
            console.log("   Text:", unsendBtn.innerText || unsendBtn.textContent);
        } else {
            console.log("❌ 'Zrušit odeslání' nenalezeno");
        }
        
        // Zavři menu
        document.body.click();
    } else {
        console.log("❌ 3 tečky nenalezeny");
        
        console.log("\n🔍 Hledám v rodičích...");
        let parent = msg.parentElement;
        for (let j = 0; j < 3; j++) {
            if (!parent) break;
            console.log(`  Rodič ${j + 1}:`, parent);
            let btn = findThreeDotsButton(parent);
            if (btn) {
                console.log(`  ✅ Nalezeno v rodiči ${j + 1}!`);
                break;
            }
            parent = parent.parentElement;
        }
    }
    
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

console.log("═══════════════════════════════════════════════════");
console.log("Instagram Skript v4.0 - JEDNODUCHÝ");
console.log("═══════════════════════════════════════════════════");
console.log("Co dělá:");
console.log("  1. Najde 3 tečky (... ikonu)");
console.log("  2. Klikne na 'Zrušit odeslání'");
console.log("  3. Potvrdí 'Zrušit odeslání'");
console.log("");
console.log("Příkazy:");
console.log("  debugMessage()  - 🔍 UKÁŽE co skript vidí!");
console.log("  testDeleteOne() - Otestovat na 1 zprávě");
console.log("  loadChat()      - Načíst a smazat všechny zprávy");
console.log("  stopDelete()    - Zastavit mazání");
console.log("═══════════════════════════════════════════════════");
console.log("💡 NEJDŘÍV SPUSŤTE: debugMessage()");
console.log("   Ukáže všechna tlačítka a menu položky!");
console.log("═══════════════════════════════════════════════════");
