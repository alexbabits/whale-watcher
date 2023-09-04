const { app, BrowserWindow, ipcMain } = require('electron');
const { startWhaleWatch, stopWhaleWatch, setAlchemyApiKey, setTelegramBotToken, setTelegramChatID, setThresholdUSD} = require('./index')
const path = require('path');
let mainWindow;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 660, height: 280, resizable: false,
    webPreferences: { 
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'whalepicture.ico')
  });
  mainWindow.removeMenu();
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('start-whale-watch', (event, selectedCoin) => {startWhaleWatch(selectedCoin)});
ipcMain.on('stop-whale-watch', () => {stopWhaleWatch()});
ipcMain.on('save-api-key', (event, apiKey) => {setAlchemyApiKey(apiKey)});
ipcMain.on('save-bot-token', (event, botToken) => {setTelegramBotToken(botToken)});
ipcMain.on('save-chat-id', (event, chatID) => {setTelegramChatID(chatID)});
ipcMain.on('save-threshold-usd', (event, thresholdUSD) => {setThresholdUSD(thresholdUSD)});