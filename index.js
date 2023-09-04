const ethers = require('ethers');
const { Contract, AlchemyProvider } = ethers;
const { readFileSync } = require('fs');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
require('dotenv/config');

// Declaring and grabbing .env variables (Alchemy API key, provider (Alchemy), telegram bot token, telegram chat ID)
let ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
let provider = new AlchemyProvider(null, ALCHEMY_API_KEY);
let bot_token = process.env.TELEGRAM_TOKEN;
let chat_id = process.env.TELEGRAM_CHAT_ID;


// Declare global variables neccessary for GUI buttons to start/stop the listeners
let blockListener;
let transferListener;
let contract;
let threshold_usd = 20000;

// Reassigning API key, telegram bot token, telegram chat ID, USD threshold, from GUI entries and associated buttons.
const setAlchemyApiKey = (apiKey) => {
    ALCHEMY_API_KEY = apiKey;
    provider = new AlchemyProvider(null, apiKey);

    const envPath = path.resolve(__dirname, '.env');
    let lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines[0] = `ALCHEMY_API_KEY = "${apiKey}"`;
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

    console.log('Alchemy API key set!');
    sendMessage('Alchemy API key set!');
};

const setTelegramBotToken = (botToken) => {
    bot_token = botToken;

    const envPath = path.resolve(__dirname, '.env');
    let lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines[1] = `TELEGRAM_TOKEN = "${botToken}"`;
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

    console.log('Bot Token set!')
};

const setTelegramChatID = (chatID) => {
    chat_id = chatID;

    const envPath = path.resolve(__dirname, '.env');
    let lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines[2] = `TELEGRAM_CHAT_ID = "${chatID}"`;
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');

    console.log('Chat ID set!')
};

const setThresholdUSD = (thresholdUSD) =>{
    threshold_usd = thresholdUSD;
    console.log(`New Threshold set to $${thresholdUSD}!`)
    sendMessage(`New Threshold set to $${thresholdUSD}!`)
}

// Function to send message to Telegram bot
const sendMessage = async (message) => {
    const url = `https://api.telegram.org/bot${bot_token}/sendMessage?chat_id=${chat_id}&text=${encodeURIComponent(message)}`;
    const res = await fetch(url);
    if (res.ok) {
      return 'sent'; 
    } else {
      return 'failed'; 
    }
}

// Using a general ERC20 token ABI for flexibility to fetch data for most ERC20 tokens
const abi = JSON.parse(readFileSync(path.join(__dirname, 'erc20abi.json'), 'utf8'));

// Static info about tokens. Will be used as a reference to fetch and format live chain transaction data
const tokenInfo = {
    'USDC': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, coingeckoID: 'usd-coin' },
    'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, coingeckoID: 'tether' },
    'DAI': { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, coingeckoID: 'dai' },
    'LINK': { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, coingeckoID: 'chainlink' },
    'SHIB': { address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18, coingeckoID: 'shiba-inu' },
    'UNI': { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, coingeckoID: 'uniswap' },
    'AAVE': { address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, coingeckoID: 'aave' },
    'PEPE': { address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', decimals: 18, coingeckoID: 'pepe' },
    'DYDX': { address: '0x92D6C1e31e14520e676a687F0a93788B716BEff5', decimals: 18, coingeckoID: 'dydx' },
    'ETH': { address: '', decimals: 18, coingeckoID: 'ethereum' },
};

// Fetches the current USD price of a token from CoinGecko
const getCurrentPrice = async (tokenId) => {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`);
    const data = await response.json();
    return data[tokenId].usd;
};

// Begins listening for transactions of a token over a specified usd threshold
const startWhaleWatch = async (token) => {

    // Grabbing needed data from tokenInfo and calculates the threshold amount for tracking a transaction
    const { address, decimals, coingeckoID } = tokenInfo[token];
    const currentPrice = await getCurrentPrice(coingeckoID);
    const decimal_factor = 10 ** decimals;
    const threshold_amount = (threshold_usd / currentPrice) * decimal_factor;
    const welcomeMessage = `Whale Watcher started! Listening for large transfers on: ${token} that exceed $${threshold_usd}`
    console.log(welcomeMessage);
    sendMessage(welcomeMessage);

    // ETH is native asset on Ethereum Blockchain and has no token contract address, therefore we look at the blocks themselves 
    if (token === 'ETH') {
        blockListener = async (blockNumber) => {
            const block = await provider.getBlock(blockNumber);
            for (const txHash of block.transactions) {
                const tx = await provider.getTransaction(txHash);
                const amount = tx.value;

                if (Number(amount) >= threshold_amount) {
                    const etherAmount = Number(amount) / decimal_factor;
                    const message = `\n---Whale Transfer Found---\nTicker: ${token}\nPrice: ${currentPrice}\nFrom: ${tx.from}\nTo: ${tx.to}\nAmount: ${etherAmount}\nUSD Amount: ${etherAmount * currentPrice}\nTransaction Link: https://etherscan.io/tx/${tx.hash}`
                    console.log(message)
                    sendMessage(message)
                }
            }
        }
        provider.on('block', blockListener);
    } 

    // For ERC20 tokens, we use the Contract class from ethers.js to listen for Transfer events and grab the data
    else {
        contract = new Contract(address, abi, provider);
        transferListener = (from, to, amount, event) => {
            if (Number(amount) >= threshold_amount) {
                const erc20amount = Number(amount) / decimal_factor
                const erc20usdamount = (Number(amount) * currentPrice) / decimal_factor
                const message = `\n\n---Whale Transfer Found---\nTicker: ${token}\nPrice: ${currentPrice}\nFrom: ${from}\nTo: ${to}\nAmount: ${erc20amount}\nUSD Amount: ${erc20usdamount}\nTransaction Link: https://etherscan.io/tx/${event.log.transactionHash}`
                console.log(message)
                sendMessage(message)
            }
        }
        contract.on('Transfer', transferListener);
    }
};

// Function to stop listening for 'block' and 'Transfer' events
const stopWhaleWatch = () => {
    if (blockListener) {
      provider.off('block', blockListener);
    }
    if (transferListener) {
      contract.off('Transfer', transferListener);
    }
    console.log('Whale Watcher stopped. No longer listening for blockchain events.')
    sendMessage('Whale Watcher stopped. No longer listening for blockchain events.')
};

module.exports = {
    startWhaleWatch,
    stopWhaleWatch,
    setAlchemyApiKey,
    setTelegramBotToken,
    setTelegramChatID,
    setThresholdUSD
};

// Uncomment below to use with terminal via 'node index.js'. Otherwise comment out and use 'npm start' to start the Electron GUI.
//startWhaleWatch('USDC') 