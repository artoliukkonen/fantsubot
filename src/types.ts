export enum DayEnum {
  Monday = "ma",
  Tuesday = "ti",
  Wednesday = "ke",
  Thursday = "to",
  Friday = "pe",
  Saturday = "la",
  Sunday = "su",
}

export type DiscordMessage = {
  content: string;
  channel: {
    send: (message: string) => void;
  };
};

export type Data = {
  users: {
    id: string;
    name: string;
  }[];
  ilmot: {
    date: string;
    userId: string;
  }[];
};

export type EventApiResponse = {
  date: string;
  players: string;
  weekday: string;
  time: string;
  format: string;
  desc: string;
};
