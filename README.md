# Instagram Message Remover / Instagram Mazač Zpráv

[English](#english) | [Česky](#česky)

---

## English

### 📝 Description

Instagram Message Remover is a browser console script that automatically deletes your Instagram direct messages. The script simulates user actions by finding the three-dot menu, clicking "Unsend", and confirming the deletion for each message. 

### ⚠️ Important Notice

- **Use at your own risk**: This script interacts with Instagram's interface and may violate their Terms of Service
- **No warranty**:  The author is not responsible for any account restrictions or data loss
- **Browser console only**: This script runs in your browser's developer console
- **Your messages only**: The script only deletes messages sent by you (right-aligned messages)

### 🚀 How to Use

1. **Open Instagram Direct Messages**
   - Go to [instagram.com/direct/inbox](https://instagram.com/direct/inbox)
   - Open the conversation you want to delete messages from

2. **Open Browser Console**
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Enable Developer Menu in Preferences, then press `Cmd+Option+C`

3. **Copy and Paste the Script**
   - Copy the entire contents of `main.js`
   - Paste it into the console and press `Enter`

4. **Run Commands**

### 📋 Available Commands

| Command | Description |
|---------|-------------|
| `debugMessage()` | 🔍 **START HERE** - Shows what the script detects (buttons, menus) |
| `testDeleteOne()` | Test deletion on a single message |
| `loadChat()` | Load entire chat history and delete all your messages |
| `stopDelete()` | Stop the deletion process |

### 💡 Recommended Workflow

```javascript
// Step 1: Debug and verify the script works
debugMessage()

// Step 2: Test on one message
testDeleteOne()

// Step 3: If successful, delete all messages
loadChat()

// Emergency stop (if needed)
stopDelete()
```

### 🛠️ How It Works

1. **Finds the three-dot menu** (... icon) on your messages
2. **Clicks "Unsend"** in the menu
3. **Confirms "Unsend"** in the confirmation dialog
4. **Scrolls and repeats** until all messages are deleted

### 🎯 Features

- ✅ Automatically scrolls to load entire chat history
- ✅ Only deletes your own messages (skips received messages)
- ✅ Includes retry logic for failed actions
- ✅ Provides detailed console logging
- ✅ Can be stopped at any time
- ✅ Debug mode to verify functionality

### 🐛 Troubleshooting

**Problem**:  Script can't find the three-dot button
- **Solution**: Run `debugMessage()` to see what the script detects
- Make sure you're hovering over a message

**Problem**: Menu doesn't open
- **Solution**: The script will retry up to 3 times automatically
- Instagram's UI may have changed - check for updates

**Problem**: "Unsend" option not found
- **Solution**: Make sure your Instagram language is set to Czech (or modify the script for your language)

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### ⚡ Technical Details

- **Language**: JavaScript (Browser Console)
- **Target**: Instagram Web Interface
- **Dependencies**: None (vanilla JavaScript)
- **Instagram Language**: Czech (can be modified)

### 🔄 Updates

To get the latest version, check the [GitHub repository](https://github.com/Toward77/Instagram-Remover).

---

## Česky

### 📝 Popis

Instagram Mazač Zpráv je konzolový skript pro prohlížeč, který automaticky maže vaše Instagram přímé zprávy. Skript simuluje uživatelské akce tím, že najde menu se třemi tečkami, klikne na "Zrušit odeslání" a potvrdí smazání pro každou zprávu.

### ⚠️ Důležité upozornění

- **Používejte na vlastní riziko**:  Tento skript interaguje s rozhraním Instagramu a může porušovat jejich podmínky služby
- **Bez záruky**: Autor nenese odpovědnost za žádná omezení účtu nebo ztrátu dat
- **Pouze konzole prohlížeče**: Tento skript se spouští v konzoli vývojáře vašeho prohlížeče
- **Pouze vaše zprávy**: Skript maže pouze zprávy odeslané vámi (zprávy zarovnané vpravo)

### 🚀 Jak použít

1. **Otevřete Instagram Přímé zprávy**
   - Jděte na [instagram.com/direct/inbox](https://instagram.com/direct/inbox)
   - Otevřete konverzaci, ze které chcete smazat zprávy

2. **Otevřete konzoli prohlížeče**
   - **Chrome/Edge**:  Stiskněte `F12` nebo `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - **Firefox**: Stiskněte `F12` nebo `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Povolte menu pro vývojáře v Předvolbách, pak stiskněte `Cmd+Option+C`

3. **Zkopírujte a vložte skript**
   - Zkopírujte celý obsah souboru `main.js`
   - Vložte jej do konzole a stiskněte `Enter`

4. **Spusťte příkazy**

### 📋 Dostupné příkazy

| Příkaz | Popis |
|--------|-------|
| `debugMessage()` | 🔍 **ZAČNĚTE TADY** - Ukáže, co skript detekuje (tlačítka, menu) |
| `testDeleteOne()` | Otestuje smazání na jedné zprávě |
| `loadChat()` | Načte celou historii chatu a smaže všechny vaše zprávy |
| `stopDelete()` | Zastaví proces mazání |

### 💡 Doporučený postup

```javascript
// Krok 1: Debug a ověření, že skript funguje
debugMessage()

// Krok 2: Test na jedné zprávě
testDeleteOne()

// Krok 3: Pokud bylo úspěšné, smazat všechny zprávy
loadChat()

// Nouzové zastavení (pokud je potřeba)
stopDelete()
```

### 🛠️ Jak to funguje

1. **Najde menu se třemi tečkami** (... ikonu) na vašich zprávách
2. **Klikne na "Zrušit odeslání"** v menu
3. **Potvrdí "Zrušit odeslání"** v potvrzovacím dialogu
4. **Scrolluje a opakuje** dokud nejsou všechny zprávy smazány

### 🎯 Funkce

- ✅ Automaticky scrolluje pro načtení celé historie chatu
- ✅ Maže pouze vaše vlastní zprávy (přeskakuje přijaté zprávy)
- ✅ Obsahuje logiku opakování pro neúspěšné akce
- ✅ Poskytuje podrobné logování v konzoli
- ✅ Může být kdykoli zastaveno
- ✅ Debug režim pro ověření funkčnosti

### 🐛 Řešení problémů

**Problém**: Skript nemůže najít tlačítko se třemi tečkami
- **Řešení**: Spusťte `debugMessage()` abyste viděli, co skript detekuje
- Ujistěte se, že najíždíte myší na zprávu

**Problém**:  Menu se neotevírá
- **Řešení**:  Skript automaticky zkusí až 3krát
- UI Instagramu se mohlo změnit - zkontrolujte aktualizace

**Problém**:  Možnost "Zrušit odeslání" nebyla nalezena
- **Řešení**: Ujistěte se, že je váš Instagram nastaven na češtinu (nebo upravte skript pro váš jazyk)

### 📄 Licence

Tento projekt je licencován pod MIT licencí - viz soubor [LICENSE](LICENSE) pro detaily.

### ⚡ Technické detaily

- **Jazyk**:  JavaScript (Konzole prohlížeče)
- **Cíl**: Webové rozhraní Instagramu
- **Závislosti**: Žádné (vanilla JavaScript)
- **Jazyk Instagramu**: Čeština (lze upravit)

### 🔄 Aktualizace

Pro nejnovější verzi zkontrolujte [GitHub repozitář](https://github.com/Toward77/Instagram-Remover).

---

## 🤝 Contributing / Přispívání

Contributions are welcome! Feel free to open issues or submit pull requests. 

Příspěvky jsou vítány! Neváhejte otevřít issue nebo poslat pull request.

## ⭐ Support / Podpora

If this script helped you, please give it a star ⭐

Pokud vám tento skript pomohl, dejte mu prosím hvězdičku ⭐

---

**Created by**:  [Toward77](https://github.com/Toward77)