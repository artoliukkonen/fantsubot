import { dateToApiDate, getData, getWeek, parseDate } from "../utils/utils.js";
import { DiscordMessage } from "../types.js";
import { getRegByDate } from "../utils/db.js";

export const participantsCommand = async (receivedMessage: DiscordMessage) => {
  const events = await getData(process.env.EVENT_API ?? "");

  if (!events) {
    return;
  }

  let msg = "";

  events.forEach((event) => {
    const eventDate = parseDate(event.date);

    if (getWeek(new Date(), 1) !== getWeek(new Date(eventDate), 1)) {
      return;
    }

    const users = getRegByDate(eventDate);
    msg += `${event.weekday} ${event.date}: ${
      !users.length
        ? "Ei ilmoittautuneita"
        : users.map((user) => user.userId).join(", ")
    }`;

    if (event.players) {
      msg += ` (virallisessa kalenterissa ${event.players})`;
    }
    msg += "\n";
    receivedMessage.channel.send(msg);
  });
};
