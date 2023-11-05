import {
  cancelCommand,
  listCommand,
  participantsCommand,
  regCommand,
  regUserCommand,
} from "../commands/index.js";
import axios from "axios";
import dotenv from "dotenv";

import { DayEnum, DiscordMessage, EventApiResponse } from "../types.js";
import { Message } from "discord.js";

dotenv.config();

const regCommands = ["ilmo", "ilmoittaudu", "pelaamaan"];
const listCommands = ["pelit", "kalenteri", "tapahtumat"];
const osallistujatCommands = ["osallistujat", "pelaajat"];
const cancelCommands = ["peru", "pois"];
const regUserCommands = ["reg", "register"];

// https://gist.github.com/catamphetamine/c0e2f21f1063b11a90f5790eadfcefa4
export const getWeek = (date: Date, dowOffset = 0) => {
  /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */
  const newYear = new Date(date.getFullYear(), 0, 1);
  let day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  const daynum =
    Math.floor(
      (date.getTime() -
        newYear.getTime() -
        (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000
    ) + 1;
  //if the year starts before the middle of a week
  if (day < 4) {
    const weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      const nYear = new Date(date.getFullYear() + 1, 0, 1);
      let nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      /*if the next year starts before the middle of
        the week, it is week #1 of that year*/
      return nday < 4 ? 1 : 53;
    }
    return weeknum;
  } else {
    return Math.floor((daynum + day - 1) / 7);
  }
};

export const parseDate = (date: string) => {
  let [dd, dm, dy] = date.split(".");
  if (!dy) {
    dy = new Date().getFullYear().toString();
  }
  // Format as 20YY-M-D
  return `${parseInt(dy).toString().padStart(4, "20")}-${parseInt(
    dm
  )}-${parseInt(dd)}`;
};

export const dateToApiDate = (date: string) => {
  let [dd, dm, dy] = date.split(".");
  if (!dy) {
    dy = new Date().getFullYear().toString();
  }
  // Format as DD.MM.20YY
  return `${parseInt(dd).toString().padStart(2, "0")}.${parseInt(dm)
    .toString()
    .padStart(2, "0")}.${parseInt(dy).toString().padStart(4, "20")}`;
};

// https://gist.github.com/antsy/2d3de5cb7d9b5558c2f0030f374ca4d7
export const finnishToEnglish = (dayName: string) => {
  const abbreviation = dayName.slice(0, 2);

  switch (abbreviation) {
    case DayEnum.Monday:
      return "monday";
    case DayEnum.Tuesday:
      return "tuesday";
    case DayEnum.Wednesday:
      return "wednesday";
    case DayEnum.Thursday:
      return "thursday";
    case DayEnum.Friday:
      return "friday";
    case DayEnum.Saturday:
      return "saturday";
    case DayEnum.Sunday:
      return "sunday";
    default:
      return "";
  }
};

export const getNextDay = (dayName: string) => {
  let date = new Date();
  let now = date.getDay();

  let days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const day = days.indexOf(dayName.toLowerCase());

  const diff = day - now;

  const nextDayTimestamp = date.getTime() + 1000 * 60 * 60 * 24 * diff;

  // Get the next day
  return new Date(nextDayTimestamp);
};

export const dateToShort = (date: Date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
};

export const abbreviationToDay = (abbreviation: string) => {
  return parseDate(dateToShort(getNextDay(finnishToEnglish(abbreviation))));
};

export const getData = async (
  url: string
): Promise<EventApiResponse[] | undefined> => {
  try {
    const response = await axios.get(url);
    const { data } = response;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export function processCommand(receivedMessage: Message) {
  let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
  let primaryCommand = splitCommand[0].toLowerCase(); // The first word directly after the exclamation is the command
  let args = splitCommand.slice(1); // All other words are arguments/parameters/options for the command

  console.log("Command received: " + primaryCommand);
  console.log("Arguments: " + args); // There may not be any arguments

  if (listCommands.includes(primaryCommand)) {
    listCommand(receivedMessage);
  } else if (osallistujatCommands.includes(primaryCommand)) {
    participantsCommand(receivedMessage);
  } else if (cancelCommands.includes(primaryCommand)) {
    cancelCommand(args, receivedMessage);
  } else if (regCommands.includes(primaryCommand)) {
    regCommand(args, receivedMessage);
  } else if (regUserCommands.includes(primaryCommand)) {
    regUserCommand(args, receivedMessage);
  }

  if (process.env.DEV) {
    receivedMessage.channel.send(
      "Kehitystila päällä. Ilmoittautumista/perumista ei kirjattu."
    );
  }
}
