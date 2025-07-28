import { Client, GatewayIntentBits, Partials } from "discord.js";
import { processCommand } from "./utils/utils.js";

const client = new Client({
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});
client.on("messageCreate", (receivedMessage) => {
  if (receivedMessage.author.username === client.user?.username) {
    // Prevent bot from responding to its own messages
    return;
  }

  if (receivedMessage.content.startsWith("!")) {
    console.log(`Command from ${receivedMessage.author.username}`);

    processCommand(receivedMessage);
  }
});

client.login(process.env.DISCORD);
