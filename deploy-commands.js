require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("Start a voice-channel Pomodoro timer")
    .addIntegerOption(o =>
      o.setName("study").setDescription("Study time in minutes")
    )
    .addIntegerOption(o =>
      o.setName("break").setDescription("Break time in minutes")
    ),

  new SlashCommandBuilder()
    .setName("timer")
    .setDescription("Start a custom timer (VC only)")
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Duration in minutes")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("focus")
    .setDescription("Start a focus session (no breaks)")
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Duration in minutes")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("session")
    .setDescription("View your current session"),

  new SlashCommandBuilder()
    .setName("extend")
    .setDescription("Extend your current session")
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Extra minutes")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("end")
    .setDescription("End your current session"),

  new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your study stats"),

  new SlashCommandBuilder()
    .setName("deepfocus")
    .setDescription("Hide text channels to reduce distractions (Admin)")
    .addSubcommand(s =>
      s.setName("on")
        .setDescription("Enable deep focus mode")
        .addChannelOption(o =>
          o.setName("whitelist")
            .setDescription("Channel to keep visible")
        )
    )
    .addSubcommand(s =>
      s.setName("off")
        .setDescription("Disable deep focus mode")
    ),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set your AFK status")
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("AFK reason")
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all commands")
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );
  console.log("✅ Slash commands registered");
})();
