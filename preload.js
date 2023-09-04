const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'api', {
    startWhaleWatch: (selectedCoin) => ipcRenderer.send('start-whale-watch', selectedCoin),
    stopWhaleWatch: () => ipcRenderer.send('stop-whale-watch'),
    saveApiKey: (apiKey) => ipcRenderer.send('save-api-key', apiKey),
    saveBotToken: (botToken) => ipcRenderer.send('save-bot-token', botToken),
    saveChatID: (chatID) => ipcRenderer.send('save-chat-id', chatID),
    saveThresholdUSD: (thresholdUSD) => ipcRenderer.send('save-threshold-usd', thresholdUSD)
  }
);