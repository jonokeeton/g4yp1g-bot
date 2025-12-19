// bot.js - Telegram bot with webhook + Express server
const { Telegraf } = require('telegraf');
const express = require('express');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set in .env file');
}

// Middleware
app.use(express.json());

// /start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    "Hi! I'm G4yp1gbot, a Telegram moderation bot.\n" +
    "I'm currently in development mode."
  );
});

// Echo all other messages
bot.on('text', async (ctx) => {
  console.log(`Message received: ${ctx.message.text}`);
  await ctx.reply(`Echo: ${ctx.message.text}`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// Webhook route
app.post('/bot', express.json(), async (req, res) => {
  try {
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'running' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`G4yp1gbot webhook server listening on port ${PORT}`);
  console.log(`Ready to receive webhooks at /bot`);
});

// Graceful shutdown
process.once('SIGINT', () => process.exit(0));
process.once('SIGTERM', () => process.exit(0));

module.exports = bot;
