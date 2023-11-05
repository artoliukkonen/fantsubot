import { Message } from "discord.js";
import { getData } from "../utils/utils.js";

export const listCommand = async (receivedMessage: Message) => {
  const events = await getData(process.env.EVENT_API ?? "");
  let msg = `https://www.fantasiapelit.com/index.php?main=kalenteri&kaupunki=jkl

  `;
  events?.slice(0, 4).map((e) => {
    msg += `${e.date} ${e.time} (${e.weekday}) - ${e.format}
    ${e.desc.replace("\n", " ").substr(0, 150)} ---

`;
  });
  receivedMessage.channel.send(msg);
};
