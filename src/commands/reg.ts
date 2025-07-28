import {
  abbreviationToDay,
  getData,
  getWeek,
  parseDate,
} from "../utils/utils.js";
import { addReg, getReg, getUser } from "../utils/db.js";
import { Message } from "discord.js";
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

const ilmoMsg = {
  to: process.env.EMAIL_RECEIVER ?? "",
  from: process.env.EMAIL_SENDER ?? "",
  subject: "MTG/F&B ilmoittautuminen (Discord)",
  text: "",
};

export const regCommand = async (args: string[], receivedMessage: Message) => {
  if (args.length < 1) {
    receivedMessage.channel.send(
      "Anna viikonpäivä. Esim. `!ilmo ma` tai `!ilmo ke pe la`"
    );
    receivedMessage.react("👎");

    return;
  }
  const dates = args.map((v) => v.toLowerCase().trim());

  if (
    dates.some((v) => !["ma", "ti", "ke", "to", "pe", "la", "su"].includes(v))
  ) {
    receivedMessage.channel.send(
      "Joku viikonpäivistä oli virheelinen. Yritä uudelleen ilman ylimääräisiä merkkejä. Esim. `!ilmo ma` tai `!ilmo ke pe la`"
    );
    receivedMessage.react("👎");

    return;
  }

  const user = getUser(receivedMessage.author.username);

  if (!user) {
    receivedMessage.channel.send(
      `Käyttäjää ${receivedMessage.author.username} ei löytynyt tietokannasta. Rekisteröi ensin *oikea* nimesi järjestelmään. Esim. \`!reg Matti Meikäläinen\`"`
    );
    receivedMessage.react("👎");

    return;
  }

  const events = await getData(process.env.EVENT_API ?? "");

  if (!events) {
    // TODO: Show error message
    return;
  }

  const invalid = dates.some((date) => {
    const regDate = abbreviationToDay(date);

    console.log(regDate);

    if (
      !events.filter((event) => {
        const eventDate = parseDate(event.date);

        return eventDate === regDate;
      }).length
    ) {
      receivedMessage.channel.send(
        `Päivälle \`${date}\` ei löytynyt pelejä. Tarkista päivämäärä kalenterista (\`!pelit\`)`
      );
      receivedMessage.react("👎");

      return true;
    }

    if (getWeek(new Date(), 1) !== getWeek(new Date(regDate), 1)) {
      receivedMessage.channel.send(
        "Et voi ilmoittautua tulevien viikkojen turnauksiin."
      );
      receivedMessage.react("👎");

      return true;
    }

    const ilmo = getReg(receivedMessage.author.username, regDate);

    if (ilmo) {
      receivedMessage.channel.send(`Olet jo ilmoittautunut tähän turnaukseen.`);
      receivedMessage.react("👎");

      return true;
    }
  });

  if (invalid) return;

  ilmoMsg.text = `${user.name} (Discord: ${
    receivedMessage.author.username
  }) ilmoittautuu tämän viikon MTG/F&B peleihin päiville: ${dates.join(", ")}`;

  (async () => {
    try {
      if (!process.env.DEV) {
        await mg.messages.create(process.env.MAILGUN_DOMAIN ?? "", ilmoMsg);
      } else {
        console.log(ilmoMsg.text);
      }
      dates.forEach((date) => {
        const ddate = abbreviationToDay(date);

        addReg(receivedMessage.author.username, ddate);
      });

      receivedMessage.react("👍");
    } catch (error) {
      console.log(ilmoMsg);
      console.error(error);
      console.log((error as any).response.body);
      receivedMessage.react("👎");
      receivedMessage.channel.send(
        "Virhe ilmoittautumisessa. Raportoi @artoliukkonen ."
      );
    }
  })();
};
