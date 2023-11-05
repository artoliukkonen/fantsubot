import { Message } from "discord.js";
import { pushOrReplaceUser } from "../utils/db.js";

export const regUserCommand = (args: string[], receivedMessage: Message) => {
  const name = args.join(" ");

  console.log(`Registering user ${receivedMessage.author.username} as ${name}`);

  if (name) {
    console.log("user", receivedMessage.author.username);
    pushOrReplaceUser(receivedMessage.author.username, name);
    receivedMessage.react("👍");
  } else {
    receivedMessage.react("👎");
  }
};
