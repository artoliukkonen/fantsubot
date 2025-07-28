import { Message } from "discord.js";
import { abbreviationToDay } from "../utils/utils.js";
import { deleteReg, getUser } from "../utils/db.js";
import dotenv from "dotenv";
import formData from "form-data";
import Mailgun from "mailgun.js";

dotenv.config();

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY ?? "",
  url: "https://api.eu.mailgun.net",
});

const peruMsg = {
  to: process.env.EMAIL_RECEIVER,
  from: process.env.EMAIL_SENDER ?? "",
  subject: "MTG/F&B peruminen (Discord)",
  text: "",
};

export const cancelCommand = async (
  args: string[],
  receivedMessage: Message
) => {
  if (args.length < 1) {
    receivedMessage.channel.send("Anna päivämäärä. Esim. `!peru ma`");
    receivedMessage.react("👎");

    return;
  }
  const date = args.shift() ?? "";
  const ddate = abbreviationToDay(date);
  const user = getUser(receivedMessage.author.username);

  if (!user) {
    receivedMessage.channel.send(
      "Käyttäjää ei löytynyt. Ilmoittaudu ensin `!reg nimi`"
    );
    receivedMessage.react("👎");

    return;
  }

  peruMsg.text = `${user.name} (Discord: ${receivedMessage.author.username}) peruu ilmoittautumisensa päivälle ${date}`;

  (async () => {
    try {
      if (!process.env.DEV) {
        await mg.messages.create(process.env.MAILGUN_DOMAIN ?? "", peruMsg);
      }
      deleteReg(receivedMessage.author.username, ddate);
      receivedMessage.react("👍");
    } catch (error) {
      console.error(error);
      receivedMessage.react("👎");
      receivedMessage.channel.send(
        "Virhe ilmoittautumisen perumisessa. Raportoi @artoliukkonen ."
      );
    }
  })();
};
