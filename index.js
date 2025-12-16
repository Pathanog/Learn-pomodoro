require("dotenv").config();
require("./register-commands");

const fs = require("fs");
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

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

const data = JSON.parse(fs.readFileSync(DATA_FILE));
const save = () => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

const sessions = new Map();

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "🍅 Focused study in voice channels", type: 0 }],
    status: "online"
  });
});

function requireVC(interaction) {
  if (!interaction.member.voice.channel) {
    interaction.reply({ content: "❌ Join a voice channel first.", ephemeral: true });
    return false;
  }
  return true;
}

function startSession(interaction, minutes, label) {
  const uid = interaction.user.id;
  const start = Date.now();

  const timeout = setTimeout(() => {
    interaction.channel.send(`⏰ <@${uid}> **${label} session ended**`);
    sessions.delete(uid);
    data.stats[uid] = (data.stats[uid] || 0) + minutes;
    save();
  }, minutes * 60000);

  sessions.set(uid, { timeout, start, minutes, label });
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const uid = interaction.user.id;

  if (interaction.commandName === "help") {
    return interaction.reply({
      ephemeral: true,
      content:
`**Learn Pomodoro Commands**
/pomodoro
/timer
/focus
/session
/extend
/end
/stats
/deepfocus
/afk`
    });
  }

  if (interaction.commandName === "afk") {
    data.afk[uid] = interaction.options.getString("reason") || "AFK";
    save();
    return interaction.reply("💤 You are now AFK");
  }

  if (["pomodoro", "timer", "focus"].includes(interaction.commandName)) {
    if (!requireVC(interaction)) return;
    if (sessions.has(uid)) {
      return interaction.reply({ content: "⏳ Session already running.", ephemeral: true });
    }
  }

  if (interaction.commandName === "pomodoro") {
    const study = interaction.options.getInteger("study") ?? 25;
    const brk = interaction.options.getInteger("break") ?? 5;
    await interaction.reply(`🍅 Pomodoro started (${study} min)`);
    startSession(interaction, study, "Study");
    setTimeout(() => {
      interaction.channel.send(`☕ Break time (${brk} min)`);
    }, study * 60000);
  }

  if (interaction.commandName === "timer") {
    const m = interaction.options.getInteger("minutes");
    await interaction.reply(`⏲️ Timer started (${m} min)`);
    startSession(interaction, m, "Timer");
  }

  if (interaction.commandName === "focus") {
    const m = interaction.options.getInteger("minutes");
    await interaction.reply(`🧠 Focus started (${m} min)`);
    startSession(interaction, m, "Focus");
  }

  if (interaction.commandName === "session") {
    const s = sessions.get(uid);
    if (!s) return interaction.reply({ content: "No active session.", ephemeral: true });
    const left = Math.ceil((s.start + s.minutes * 60000 - Date.now()) / 60000);
    return interaction.reply(`⏳ ${s.label} | ${left} min left`);
  }

  if (interaction.commandName === "extend") {
    const s = sessions.get(uid);
    if (!s) return interaction.reply({ content: "No active session.", ephemeral: true });
    clearTimeout(s.timeout);
    s.minutes += interaction.options.getInteger("minutes");
    startSession(interaction, s.minutes, s.label);
    return interaction.reply("➕ Session extended");
  }

  if (interaction.commandName === "end") {
    const s = sessions.get(uid);
    if (!s) return interaction.reply({ content: "No active session.", ephemeral: true });
    clearTimeout(s.timeout);
    sessions.delete(uid);
    return interaction.reply("🛑 Session ended");
  }

  if (interaction.commandName === "stats") {
    return interaction.reply(`📊 Total focus time: **${data.stats[uid] || 0} minutes**`);
  }

  if (interaction.commandName === "deepfocus") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: "Admins only.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());

    if (sub === "on") {
      const wl = interaction.options.getChannel("whitelist");
      if (wl && !data.deepfocus.whitelist.includes(wl.id)) {
        data.deepfocus.whitelist.push(wl.id);
      }

      for (const c of channels.values()) {
        if (data.deepfocus.whitelist.includes(c.id)) continue;
        await c.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { ViewChannel: false }
        );
      }
      save();
      return interaction.reply("🔒 Deep focus enabled");
    }

    if (sub === "off") {
      for (const c of channels.values()) {
        await c.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { ViewChannel: true }
        );
      }
      data.deepfocus.whitelist = [];
      save();
      return interaction.reply("🔓 Deep focus disabled");
    }
  }
});

client.login(process.env.TOKEN);
