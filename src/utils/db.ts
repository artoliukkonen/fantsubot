import { JSONPreset } from "lowdb/node";
import { Data } from "../types.js";
const defaultData: Data = { ilmot: [], users: [] };
const db = await JSONPreset<Data>("db.json", defaultData);

export const getUser = (id: string) => {
  return db.data.users?.find((user) => user.id === id);
};

export const pushOrReplaceUser = (id: string, name: string) => {
  const user = getUser(id);

  if (user) {
    user.name = name;
  } else {
    if (!db.data.users) {
      db.data.users = [];
    }

    db.data.users.push({ id, name });
  }
  db.write();
};

export const getReg = (id: string, date: string) => {
  return db.data.ilmot?.find(
    (ilmo) => ilmo.userId === id && ilmo.date === date
  );
};

export const getRegByDate = (date: string) => {
  return db.data.ilmot?.filter((ilmo) => ilmo.date === date);
};

export const deleteReg = (id: string, date: string) => {
  db.data.ilmot = db.data.ilmot?.filter(
    (ilmo) => ilmo.userId !== id || ilmo.date !== date
  );
  db.write();
};

export const addReg = (id: string, date: string) => {
  if (!db.data.ilmot) {
    db.data.ilmot = [];
  }
  db.data.ilmot.push({ userId: id, date });
  db.write();
};
