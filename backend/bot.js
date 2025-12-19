require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const PORT = process.env.WEBHOOK_PORT || 3000;

// Data stores
let messageCount = 0;
let activeUsers = new Set();
let users = new Map();
let messageHistory = [];
let messagesByHour = {};
let bannedUsers = new Set();
let groupSettings = new Map();
let spamTracker = new Map();

//=========================//
// === Helper functions ===//
// 
function getGroupSettings(groupId) {
  if (!groupSettings.has(groupId)) {
    groupSettings.set(groupId, {
      enableVerification: false,
      enableSpamFilter: true,
      enableModeration: true,
      bannedWords: ['spam', 'scam', 'viagra', 'casino'],
      mutedUsers: new Set(),
      verifiedUsers: new Set(),
      spamLog: [],
      moderationLog: []
    });
  }
  return groupSettings.get(groupId);
}

function isUserMuted(userId, groupId) {
  return getGroupSettings(groupId).mutedUsers.has(userId);
}

function isUserVerified(userId, groupId) {
  return getGroupSettings(groupId).verifiedUsers.has(userId);
}

function isSpamming(userId, text) {
  const now = Date.now();
  if (!spamTracker.has(userId)) spamTracker.set(userId, []);
  
  const userMessages = spamTracker.get(userId);
  const recent = userMessages.filter(m => now - m.timestamp < 60000);
  
  if (recent.length >= 5) return { spam: true, reason: 'rate_limit' };
  if (text === text.toUpperCase() && text.length > 10) return { spam: true, reason: 'caps_spam' };
  
  userMessages.push({ text, timestamp: now });
  if (userMessages.length > 10) userMessages.shift();
  spamTracker.set(userId, userMessages);
  
  return { spam: false };
}

function containsBannedWord(text, groupId) {
  const settings = getGroupSettings(groupId);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of settings.bannedWords) {
    if (words.some(w => w.includes(word))) return { banned: true, word };
  }
  return { banned: false };
}

function muteUser(userId, groupId) {
  const settings = getGroupSettings(groupId);
  settings.mutedUsers.add(userId);
  setTimeout(() => settings.mutedUsers.delete(userId), 5 * 60 * 1000);
}

// Admin commands
bot.command('stats', async (ctx) => {
  await ctx.reply(`📊 Stats:\nMessages: ${messageCount}\nActive: ${activeUsers.size}\nGroups: ${groupSettings.size}`);
});

// === TEXT HANDLER ===

bot.on('text', async (ctx) => {
  console.log(`*** MESSAGE RECEIVED *** from ${ctx.from.first_name}: ${ctx.message.text}`);
  console.log('Chat:', ctx.chat.id, ctx.chat.type);
  
  if (ctx.message.text === '/debug') {
    const groups = Array.from(groupSettings.keys()).join(', ') || 'NONE';
    await ctx.reply(`🛠️ DEBUG:\nChat: ${ctx.chat.type} (${ctx.chat.id})\nUser: ${ctx.from.id}\nGroups: ${groups}`);
    return;
  }
  
  if (bannedUsers.has(ctx.from.id)) return;
  
  // Group moderation
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    const groupId = ctx.chat.id.toString();
    const userId = ctx.from.id.toString();
    getGroupSettings(groupId); // Auto-create
    
    if (isUserMuted(userId, groupId)) {
      await ctx.deleteMessage().catch(() => {});
      return;
    }
    
    const spamCheck = isSpamming(userId, ctx.message.text);
    if (spamCheck.spam) {
      muteUser(userId, groupId);
      await ctx.deleteMessage().catch(() => {});
      await ctx.reply(`⚠️ ${ctx.from.first_name} muted for spam: ${spamCheck.reason}`);
      return;
    }
    
    const bannedCheck = containsBannedWord(ctx.message.text, groupId);
    if (bannedCheck.banned) {
      muteUser(userId, groupId);
      await ctx.deleteMessage().catch(() => {});
      await ctx.reply(`⚠️ ${ctx.from.first_name} muted for banned word`);
      return;
    }
  }
  
  // Tracking
  messageCount++;
  activeUsers.add(ctx.from.id);
  
  // Private echo
  if (ctx.chat.type === 'private') {
    await ctx.reply(`Echo: ${ctx.message.text}`);
  }
});

// === API ENDPOINTS ===
app.get('/health', (req, res) => {
  res.json({ status: 'ok', groups: groupSettings.size, uptime: process.uptime() });
});

app.get('/api/groups', (req, res) => {
  const groups = Array.from(groupSettings.keys()).map(id => ({
    id,
    ...getGroupSettings(id)
  }));
  res.json(groups);
});

app.post('/api/groups/:groupId/settings', (req, res) => {
  const { groupId } = req.params;
  const settings = getGroupSettings(groupId);
  Object.assign(settings, req.body);
  res.json({ success: true, settings });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: users.size,
    messageCount,
    activeUsers: activeUsers.size,
    groups: groupSettings.size
  });
});


// Webhook
app.use(bot.webhookCallback('/bot'));

app.listen(PORT, () => {
  console.log(`🚀 G4yp1g bot server running on port ${PORT}`);
  bot.telegram.setWebhook(`https://g4yp1g.ngrok.app/bot`);
});
