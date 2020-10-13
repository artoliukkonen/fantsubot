require("dotenv").config();
const Discord = require("discord.js");
const axios = require("axios");
const sgMail = require("@sendgrid/mail");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);
console.log(process.env);

sgMail.setApiKey(process.env.SENDGRID);

const ilmoMsg = {
  to: process.env.EMAIL_RECEIVER,
  from: process.env.EMAIL_SENDER,
  subject: "MTG ilmoittautuminen (Discord)",
  text: "",
};

const peruMsg = {
  to: process.env.EMAIL_RECEIVER,
  from: process.env.EMAIL_SENDER,
  subject: "MTG peruminen (Discord)",
  text: "",
};

const ilmoCommands = ["ilmo", "ilmoittaudu", "pelaamaan"];
const listCommands = ["pelit", "kalenteri", "tapahtumat"];
const osallistujatCommands = ["osallistujat", "pelaajat"];
const cancelCommands = ["peru", "pois"];

const parseDate = (date) => {
  let [dd, dm, dy] = date.split(".");
  if (!dy) {
    dy = new Date().getFullYear();
  }
  return `${parseInt(dy)}-${parseInt(dm)}-${parseInt(dd)}`;
};

const getData = async (url) => {
  try {
    const response = await axios.get(url);
    const { data } = response;
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

function processCommand(receivedMessage) {
  let fullCommand = receivedMessage.content.substr(1); // Remove the leading exclamation mark
  let splitCommand = fullCommand.split(" "); // Split the message up in to pieces for each space
  let primaryCommand = splitCommand[0]; // The first word directly after the exclamation is the command
  let args = splitCommand.slice(1); // All other words are arguments/parameters/options for the command

  console.log("Command received: " + primaryCommand);
  console.log("Arguments: " + args); // There may not be any arguments

  if (listCommands.includes(primaryCommand)) {
    listCommand(args, receivedMessage);
  } else if (ilmoCommands.includes(primaryCommand)) {
    ilmoCommand(args, receivedMessage);
  } else if (osallistujatCommands.includes(primaryCommand)) {
    osallistujatCommand(args, receivedMessage);
  } else if (cancelCommands.includes(primaryCommand)) {
    cancelCommand(args, receivedMessage);
  } else {
    // receivedMessage.channel.send(
    //   "Osaan vain komennot: `!pelit` | `!ilmo` | `!osallistujat`"
    // );
  }

  if (process.env.DEV) {
    receivedMessage.channel.send(
      "Kehitystila päällä. Ilmoittautumista/perumista ei kirjattu."
    );
  }
}

async function cancelCommand(args, receivedMessage) {
  if (args.length < 1) {
    receivedMessage.channel.send("Anna päivämäärä. Esim. `!peru 1.1.2020`");
    receivedMessage.react("👎");

    return;
  }
  const date = args.shift();
  const ddate = parseDate(date);

  const user = db
    .get("users")
    .find({ id: receivedMessage.author.username })
    .value();

  peruMsg.text = `${user.name} (Discord: ${receivedMessage.author.username}) peruu ilmoittautumisensa päivälle ${date}`;

  (async () => {
    try {
      if (!process.env.DEV) {
        await sgMail.send(peruMsg);
        db.get("ilmot")
          .remove({ userId: receivedMessage.author.username, date: ddate })
          .write();
      }
      receivedMessage.channel.send("Ilmoittautuminen peruttu");
      receivedMessage.react("👍");
    } catch (error) {
      console.error(error);
      receivedMessage.react("👎");
      receivedMessage.channel.send(
        "Virhe ilmoittautumisen perumisessa. Raportoi @artoliukkonen ."
      );

      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
}

function osallistujatCommand(args, receivedMessage) {
  if (args.length < 1) {
    receivedMessage.channel.send(
      "Anna päivämäärä. Esim. `!osallistujat 1.1.2020`"
    );
    receivedMessage.react("👎");

    return;
  }

  const date = args.shift();
  const ddate = parseDate(date);

  const users = db.get("ilmot").filter({ date: ddate }).map("userId").value();
  console.log(users);

  receivedMessage.channel.send(
    `Ilmoittautuneita ${date}: ${
      !users.length ? "Ei ilmoittautuneita" : users.join(", ")
    }.`
  );
}

async function listCommand(args, receivedMessage) {
  const events = await getData(process.env.EVENT_API);
  let msg = `https://www.fantasiapelit.com/index.php?main=kalenteri&kaupunki=jkl

  `;
  events.slice(0, 4).map((e) => {
    msg += `${e.date} ${e.time} (${e.weekday}) - ${e.format}
    ${e.desc.replace("\n", " ").substr(0, 150)} ---

`;
  });
  receivedMessage.channel.send(msg);
}

async function ilmoCommand(args, receivedMessage) {
  if (args.length < 1) {
    receivedMessage.channel.send(
      "Anna päivämäärä ja nimi. Esim. `!ilmo 1.1.2020 Matti Meikäläinen`"
    );
    receivedMessage.react("👎");

    return;
  }
  const date = args.shift();
  let name = args.join(" ").trim();
  const user = db
    .get("users")
    .find({ id: receivedMessage.author.username })
    .value();

  const events = await getData(process.env.EVENT_API);

  const ddate = parseDate(date);

  if (
    !events.filter((v) => {
      console.log(v.date);
      const vdate = parseDate(v.date);

      console.log(vdate, ddate);
      return vdate === ddate;
    }).length
  ) {
    receivedMessage.channel.send(
      `Päivälle \`${date}\` ei löytynyt pelejä. Tarkista päivämäärä kalenterista (\`!pelit\`)`
    );
    receivedMessage.react("👎");

    return;
  }

  if (!name) {
    if (!user) {
      receivedMessage.channel.send(
        `Käyttäjää ${receivedMessage.author.username} ei löytynyt tietokannasta. Anna nimesi viimeisenä parametrina. Esim. \`!ilmo 1.1.2020 Matti Meikäläinen\`"`
      );
      receivedMessage.react("👎");

      return;
    }

    name = user.name;
  }

  if (name) {
    if (user && user.name) {
      db.get("users")
        .find({ id: receivedMessage.author.username })
        .assign({ name })
        .write();
    } else {
      db.get("users")
        .push({
          id: receivedMessage.author.username,
          name: name,
        })
        .write();
    }
  }

  const ilmo = db
    .get("ilmot")
    .find({ userId: receivedMessage.author.username, date: ddate })
    .value();

  if (ilmo) {
    receivedMessage.channel.send(`Olet jo ilmoittautunut tähän turnaukseen.`);
    receivedMessage.react("👎");

    return;
  }

  ilmoMsg.text = `${name} (Discord: ${receivedMessage.author.username}) ilmoittautuu MTG peleihin ${date}`;

  (async () => {
    try {
      if (!process.env.DEV) {
        await sgMail.send(ilmoMsg);
        db.get("ilmot")
          .push({
            userId: receivedMessage.author.username,
            date: ddate,
          })
          .write();
      }
      receivedMessage.react("👍");
    } catch (error) {
      console.error(error);
      receivedMessage.react("👎");
      receivedMessage.channel.send(
        "Virhe ilmoittautumisessa. Raportoi @artoliukkonen ."
      );

      if (error.response) {
        console.error(error.response.body);
      }
    }
  })();
}

const client = new Discord.Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.on("message", (receivedMessage) => {
  if (receivedMessage.author == client.user) {
    // Prevent bot from responding to its own messages
    return;
  }
  console.log(receivedMessage.author);

  if (receivedMessage.content.startsWith("!")) {
    processCommand(receivedMessage);
  }
});

client.login(process.env.DISCORD);
