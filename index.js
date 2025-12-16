require("dotenv").config();
require("./register-commands");

const fs = require("fs");
const http = require("http");
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

/* =========================
   SIMPLE HTTP SERVER
   ========================= */
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Learn Pomodoro bot is running");
}).listen(PORT, () => {
  console.log(`🌐 HTTP server running on port ${PORT}`);
});

/* =========================
   DISCORD CLIENT
   ========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const DATA_FILE = "./data.json";
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    stats: {},
    afk: {},
    deepfocus: { whitelist: [] }
  }, null, 2));
}

const
