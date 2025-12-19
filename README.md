# G4yp1gbot

A modern Telegram chat moderation and community management bot with admin dashboard.

## Tech Stack

- **Backend:** Node.js + Telegraf + Express
- **Frontend:** React
- **Deployment:** AWS Lambda + ngrok (development)
- **Version Control:** GitHub

## Project Structure

g4yp1g-bot/
├── backend/ # Node.js Telegram bot
│ ├── bot.js # Main bot file
│ ├── package.json
│ └── .env
├── frontend/ # React admin dashboard
│ ├── src/
│ ├── public/
│ └── package.json
└── README.md


## Quick Start

### Backend Setup

cd backend
npm install

Create .env file with TELEGRAM_BOT_TOKEN
npm start


### Frontend Setup

cd frontend
npm install
npm start


## Features (In Development)

- ✅ Telegram bot integration
- ✅ Message echoing (testing)
- 🔄 Spam filtering
- 🔄 Admin dashboard
- 🔄 User management
- 🔄 Webhook integration

## License

MIT