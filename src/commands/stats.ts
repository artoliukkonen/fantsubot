import { Message } from "discord.js";
import { JSONPreset } from "lowdb/node";
import { Data } from "../types.js";

const getTopPlayers = (
  ilmot: Data["ilmot"],
  daysBack: number | null = null
) => {
  const now = new Date();
  const cutoffDate = daysBack
    ? new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
    : new Date(0); // For lifetime, use epoch start

  const relevantRegs = daysBack
    ? ilmot?.filter((reg: { userId: string; date: string }) => {
        const regDate = new Date(reg.date);
        return regDate >= cutoffDate;
      }) || []
    : ilmot || [];

  const userCounts: { [key: string]: number } = {};

  relevantRegs.forEach((reg: { userId: string; date: string }) => {
    userCounts[reg.userId] = (userCounts[reg.userId] || 0) + 1;
  });

  const sortedUsers = Object.entries(userCounts)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Get top 5

  return sortedUsers;
};

const formatStatsMessage = (
  period: string,
  players: { userId: string; count: number }[],
  users: Data["users"]
) => {
  const playerList = players
    .map((player, index) => {
      const user = users?.find(
        (u: { id: string; name: string }) => u.id === player.userId
      );
      const name = user?.name || player.userId;
      return `${index + 1}. **${name}** - ${player.count} ilmoittautumista`;
    })
    .join("\n");

  return `**${period}**:\n${playerList}`;
};

export const statsCommand = async (
  args: string[],
  receivedMessage: Message
) => {
  const defaultData: Data = { ilmot: [], users: [] };
  const db = await JSONPreset<Data>("db.json", defaultData);

  const top30Days = getTopPlayers(db.data.ilmot, 30);
  const top365Days = getTopPlayers(db.data.ilmot, 365);
  const topLifetime = getTopPlayers(db.data.ilmot, null);

  const message = [
    "🏆 **Aktiivisimmat pelaajat**",
    "",
    formatStatsMessage("Viimeiset 30 päivää", top30Days, db.data.users),
    "",
    formatStatsMessage("Viimeiset 365 päivää", top365Days, db.data.users),
    "",
    formatStatsMessage("Aikojen alusta", topLifetime, db.data.users),
  ].join("\n");

  receivedMessage.channel.send(message);
};
