require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

/*
  IMPORTANT:
  This bot NEVER mutes, deafens, or controls voice states.
  It ONLY checks if a user is in a voice channel.
*/

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const DATA_FILE = "./data.json";

// Create data file safely
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    stats: {},
    afk: {},
    deepfocus: { whitelist: [] }
  }, null, 2));
}

const data = JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = () =>
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

const activeSessions = new Map();

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "🍅 Focused study in voice channels", type: 0 }],
    status: "online"
  });
});

function requireVC(interaction) {
  if (!interaction.member.voice.channel) {
    interaction.reply({
      content: "❌ You must be in a voice channel to start a session.",
      ephemeral: true
    });
    return false;
  }
  return true;
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const uid = interaction.user.id;

  /* ---------- AFK ---------- */
  if (interaction.commandName === "afk") {
    data.afk[uid] = interaction.options.getString("reason") || "AFK";
    saveData();
    return interaction.reply(`💤 AFK set: **${data.afk[uid]}**`);
  }

  /* ---------- HELP ---------- */
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

  /* ---------- SESSION START CHECK ---------- */
  if (["pomodoro", "timer", "focus"].includes(interaction.commandName)) {
    if (!requireVC(interaction)) return;
    if (activeSessions.has(uid)) {
      return interaction.reply({
        content: "⏳ You already have an active session.",
        ephemeral: true
      });
    }
  }

  /* ---------- START SESSION ---------- */
  const startSession = (minutes, label) => {
    const start = Date.now();
    const timeout = setTimeout(() => {
      interaction.channel.send(`⏰ <@${uid}> **${label} session ended!**`);
      activeSessions.delete(uid);

      data.stats[uid] = (data.stats[uid] || 0) + minutes;
      saveData();
    }, minutes * 60000);

    activeSessions.set(uid, {
      timeout,
      start,
      minutes,
      label
    });
  };

  /* ---------- COMMANDS ---------- */

  if (interaction.commandName === "pomodoro") {
    const study = interaction.options.getInteger("study") ?? 25;
    const brk = interaction.options.getInteger("break") ?? 5;

    await interaction.reply(`🍅 **Pomodoro started**\nStudy: ${study} min`);
    startSession(study, "Study");

    setTimeout(() => {
      interaction.channel.send(`☕ Break started (${brk} min)`);
    }, study * 60000);
  }

  if (interaction.commandName === "timer") {
    const m = interaction.options.getInteger("minutes");
    await interaction.reply(`⏲️ Timer started for ${m} minutes`);
    startSession(m, "Timer");
  }

  if (interaction.commandName === "focus") {
    const m = interaction.options.getInteger("minutes");
    await interaction.reply(`🧠 Focus started for ${m} minutes`);
    startSession(m, "Focus");
  }

  if (interaction.commandName === "session") {
    const s = activeSessions.get(uid);
    if (!s) {
      return interaction.reply({
        content: "❌ No active session.",
        ephemeral: true
      });
    }

    const remaining = Math.ceil(
      (s.start + s.minutes * 60000 - Date.now()) / 60000
    );

    interaction.reply(`⏳ **${s.label}** | Time left: **${remaining} min**`);
  }

  if (interaction.commandName === "extend") {
    const s = activeSessions.get(uid);
    if (!s) {
      return interaction.reply({
        content: "❌ No active session.",
        ephemeral: true
      });
    }

    const extra = interaction.options.getInteger("minutes");
    clearTimeout(s.timeout);
    s.minutes += extra;
    startSession(s.minutes, s.label);

    interaction.reply(`➕ Extended session by ${extra} minutes`);
  }

  if (interaction.commandName === "end") {
    const s = activeSessions.get(uid);
    if (!s) {
      return interaction.reply({
        content: "❌ No active session.",
        ephemeral: true
      });
    }

    clearTimeout(s.timeout);
    activeSessions.delete(uid);
    interaction.reply("🛑 Session ended");
  }

  if (interaction.commandName === "stats") {
    interaction.reply(
      `📊 **Your Stats**\nTotal focus time: **${data.stats[uid] || 0} minutes**`
    );
  }

  /* ---------- DEEP FOCUS ---------- */
  if (interaction.commandName === "deepfocus") {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "❌ Admins only.",
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const channels = interaction.guild.channels.cache.filter(c => c.isTextBased());

    if (sub === "on") {
      const wl = interaction.options.getChannel("whitelist");
      if (wl && !data.deepfocus.whitelist.includes(wl.id)) {
        data.deepfocus.whitelist.push(wl.id);
      }

      for (const ch of channels.values()) {
        if (data.deepfocus.whitelist.includes(ch.id)) continue;
        await ch.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { ViewChannel: false }
        );
      }

      saveData();
      interaction.reply("🔒 Deep Focus enabled");
    }

    if (sub === "off") {
      for (const ch of channels.values()) {
        await ch.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { ViewChannel: true }
        );
      }

      data.deepfocus.whitelist = [];
      saveData();
      interaction.reply("🔓 Deep Focus disabled");
    }
  }
});

client.login(process.env.TOKEN);
