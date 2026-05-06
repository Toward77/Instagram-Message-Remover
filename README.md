# Instagram Message Remover

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
- **Solution**: Make sure your Instagram interface is in English (the script now matches English labels only)

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### ⚡ Technical Details

- **Language**: JavaScript (Browser Console)
- **Target**: Instagram Web Interface
- **Dependencies**: None (vanilla JavaScript)
- **Instagram Language**: English, Czech (Čeština)

### 🔄 Updates

To get the latest version, check the [GitHub repository](https://github.com/Toward77/Instagram-Message-Remover).

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests. 

## ⭐ Support

If this script helped you, please give it a star ⭐

---

**Created by**:  [Toward77](https://github.com/Toward77)
