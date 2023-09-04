## What does it do?
- Listens to events on the Ethereum Blockchain for a specified token (USDC, USDT, DAI, ETH, LINK, AAVE, UNI, DYDX, PEPE, SHIB).
- Logs large transfer events to terminal. If telegram information is setup, also alerts your telegram!
- WARNING: ETH is technically not an "ERC-20", so it requires listening to every block from Ethereum blockchain to gather information. This means it requires a lot of API calls. Listening for an ERC-20 token transfer expends around 1-5 CU/s, while ETH expends around 200-300 CU/s, so be careful not to overclock the free tier Alchemy API calls of 330 CU/s.

![](/pictures/telegrampicture.png)


## File Descriptions
- Core Files:
    - `.env`: Stores sensitive data. (See `.env.example` for `.env` layout. The 3 lines MUST be in that order.)
    - `erc20abi.json`: General abi for all/most erc20 tokens used to fetch data from their contracts.
    - `index.html`: Defines GUI appearance and button functionality for the electron window. The scripts for the buttons interact with `preload.js` to expose their functions. `main.js` listens for the events and executes various `index.js` functions.
    - `index.js`: The primary file with functions that allow the bot to listen for whale transfers.
    - `main.js`: Allows `index.js` functions to be run through electron GUI.
    - `preload.js`: Exposes GUI button's functions via IPC for `main.js`.
    - `whale_watcher Setup 0.6.9.exe`: A downloadable windows desktop app to run the project easily.
- Other Files: 
    - `.gitignore`: Ignore bulky or sensitive files like /dist and /node_modules and .env
    - `package.json` & `package-lock.json`: Metadata about dependecies and project.
    - `whalepicture.ico`: Picture for app icon.


## Setup & Getting Required .env Variables
- Run `npm install` at project root to satisfy dependencies. All the .env variables can be acquired for free. 
- `ALCHEMY_API_KEY`: Alchemy.com --> sign up --> apps --> make new app for Ethereum Mainnet. Used to connect to chain via node.
- `TELEGRAM_TOKEN`: Search @BotFather on telegram and do /newbot. Follow process until you get a telegram bot token: 1234567890:AARPytrs4jfuckyouwx_8yxelmaoOxbE

![](/pictures/BotFather.png)
- `TELEGRAM_CHAT_ID`: Search @raw_data_bot on telegram and do /start. You should see a 10 digit ID like: 0987654321

![](/pictures/rawdatabot.png)


## GUI Options
- Use `npm start` in project root. Or download and install `whale_watcher Setup 0.6.9.exe`. The setup.exe is only for windows right now. Once the GUI appears:
    - Paste valid .env variables (`ALCHEMY_API_KEY`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`) and save them with the buttons.
    - Select the coin you wish to track, and specifiy a threshold USD amount for alerts. Press `Start` & `Stop` buttons to control the bot.
    - You should only need to save the .env variables once, they should be written to the .env file for future startups.

![](/pictures/bot.png)

## No GUI Option
- Fill in valid .env variables (`ALCHEMY_API_KEY`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`).
- Uncomment the function `startWhaleWatch('USDC')` at the bottom of `index.js`. Pass in the coin as a string you wish to track (Default is USDC).
- Specify a valid `threshold_usd` value in `index.js` (Default is 20000 USD).
- Run `node index.js` in project root.


## Tips & Links
- For less active coins, it will take longer to find transactions. USDC at 10000 will get you lots of alerts.
- Useful Links:
    - Ethers.js V6 Docs: https://docs.ethers.org/v6
    - Alchemy API Docs: https://docs.alchemy.com/reference/api-overview
    - Etherscan.io: https://etherscan.io/
    - Telegram: https://telegram.org/
    - png to ico: https://www.aconvert.com/icon/png-to-ico/
