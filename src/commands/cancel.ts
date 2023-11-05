import { Message } from "discord.js";
import { abbreviationToDay } from "../utils/utils.js";
import sgMail from "@sendgrid/mail";
import { deleteReg, getUser } from "../utils/db.js";

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
        await sgMail.send(peruMsg);
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
