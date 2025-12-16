require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("Start a VC-only Pomodoro session")
    .addIntegerOption(o =>
      o.setName("study").setDescription("Study minutes (default 25)")
    )
    .addIntegerOption(o =>
      o.setName("break").setDescription("Break minutes (default 5)")
    ),

  new SlashCommandBuilder()
    .setName("timer")
    .setDescription("Start a custom VC-only timer")
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Minutes")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("focus")
    .setDescription("Start a focus session (no breaks)")
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Minutes")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("session")
    .setDescription("View your active session"),

  new SlashCommandBuilder()
    .setName("extend")
    .setDescription("Extend your active session")
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
    .setDescription("View your focus stats"),

  new SlashCommandBuilder()
    .setName("deepfocus")
    .setDescription("Hide text channels (Admin only)")
    .addSubcommand(s =>
      s.setName("on")
        .setDescription("Enable deep focus")
        .addChannelOption(o =>
          o.setName("whitelist")
            .setDescription("Channel to keep visible")
        )
    )
    .addSubcommand(s =>
      s.setName("off")
        .setDescription("Disable deep focus")
    ),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set AFK status")
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("AFK reason")
    ),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all commands")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("⏳ Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Failed to register commands", err);
  }
})();
