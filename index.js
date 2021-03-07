const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

process.title = 'Anime Bartender';

global.downGames = {};
global.lastDownMessageIds = [];

const numberEmojis = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

const pushDownMessageIds = (id) => {
  global.lastDownMessageIds.push(id);

  if (global.lastDownMessageIds.length > 5) {
    global.lastDownMessageIds.shift();
  }
};

const scuffedDataInitial = {
  leagueoflegends: { label:"League of Legends", minPlayers: 5, users: {}},
  amongus: { label: "Among Us", minPlayers: 8, users: {} },
  valheim: { label:"Valheim", minPlayers: 5, users: {}},
};

const updateScuffedDb = () => {
  fs.writeFile('scuffedDatabase.json', JSON.stringify(global.downGames), (err) => {
    if (err) { return console.error(err); }
  });
};

const updateScuffedData = () => {
  try {
    if (!fs.existsSync('scuffedDatabase.json')) {
      // If the file doesn't exist, initialize it.
      console.log("Initializing scuffed DB.");
      global.downGames = {...scuffedDataInitial};
      updateScuffedDb();
    } else {
      fs.readFile('scuffedDatabase.json', (err, data) => {
        if (err) { return console.error(err); }
      
        const scuffedDatabase = JSON.parse(data.toString());
      
        global.downGames = {...scuffedDatabase};
      })
    }
  } catch (err) {
    console.error('Error reading from filesystem.');
    return;
  }
};

/**
 * @param {String} game 
 */
const getCanonicalGame = (game) => {
  const gameLowercase = game.toLowerCase();
  const leagueoflegends = ['league', 'leg', 'leagueoflegends', 'leag', 'lol', 'legos', 'legoslosgandos'];
  const amongus = ['amongus', 'amoong', 'amoongus', 'au'];
  const valheim = ['valheim'];

  if (leagueoflegends.includes(gameLowercase)) {
    return 'leagueoflegends';
  } else if (amongus.includes(gameLowercase)) {
    return 'amongus';
  } else if (valheim.includes(gameLowercase)) {
    return 'valheim';
  } else {
    return null;
  }
}


const parseMinutes = (time) => {
  const unit = time[time.length - 1];

  if (unit == 'm' || unit === 'h') {
    time = time.substring(0, time.length - 1);
  }

  if (isNaN(time)) {
    return null;
  }

  let minutes = parseFloat(time);

  if (unit === 'h') {
    minutes = minutes * 60;
  }

  return minutes;
}

/**
 * Returns the list of gamers down to play gameName.
 * @param {string} gameName
 * @returns {object[]} gamers
 */
const downGamers = (gameName) => {
  const game = global.downGames[gameName];
  
  return Object.entries(game.users).reduce((gamers, [userId, { minutes, dateSet, displayName }]) => {
    const minutesPassed = (new Date() - new Date(dateSet)) / 1000 / 60; // This can be negative, if dateSet is in future.
    const minutesLeft = minutes - minutesPassed;

    if (minutesPassed >= 0 && minutesPassed <= minutes) {
      return [...gamers, { userId, minutesLeft, displayName }];
    } else {
      return gamers;
    }
  }, []);
};

const downCommand = (args, msg) => {
  if (args.length > 1) {
    const gameName = getCanonicalGame(args[1]);

    if (!gameName || !global.downGames[gameName]) {
      msg.reply('No game with that title.');
      return;
    }

    const game = global.downGames[gameName];

    if (args[2]) {
      if (args[2] === 'assemble') {
        // Ping gamers.
        const gamers = downGamers(gameName);
        if (gamers.length >= 1) {
          const gamersFormatted = gamers.reduce((gamersFormattedPrev, { userId }) => `${gamersFormattedPrev} <@${userId}>`, '');
          msg.channel.send(`(${game.label}) Gamers, assemble. ${gamersFormatted}`);
        }
      } else {
        const minutes = parseMinutes(args[2]);
        const delay = args[3] ? parseMinutes(args[3]) : 0;

        if (minutes === null || delay == null) {
          msg.reply(`Invalid number and/or time unit.`);
          return;
        }

        if (minutes <= 0) {
          delete game.users[msg.author.id];
          msg.react('✅');
        } else {
          const dateSet = new Date()
          dateSet.setMinutes(dateSet.getMinutes() + delay);

          // Indicating that they are down to game.
          game.users[msg.author.id] = {
            displayName: msg.author.username, //msg.member.displayName,
            minutes: Math.min(minutes, 480),
            dateSet: dateSet
          };
          pushDownMessageIds(msg.id);

          const gamers = downGamers(gameName);

          msg.react('✅');
          msg.react('⬇️');
          msg.react(numberEmojis[Math.min(gamers.length, numberEmojis.length - 1)]);
        }

        updateScuffedDb();
      }
    } else {
      // Checking who wants to game.
      const gamers = downGamers(gameName);
      if (gamers.length >= 1) {
        let gamersFormatted = gamers.reduce((gamersFormattedPrev, { userId, displayName, minutesLeft }) => `${gamersFormattedPrev}${displayName} (${Math.floor(minutesLeft / 60)}h ${Math.floor(minutesLeft % 60)}m), `, '');
        gamersFormatted = gamersFormatted.substring(0, gamersFormatted.length - 2);

        gamersFormatted = gamersFormatted.replace(/0h /g , '');
        gamersFormatted = gamersFormatted.replace(/\(0m\)/g, '(<1m)');

        let msgFormatted = ''; 

        if (gamers.length === 1) {
          msgFormatted = `Only 1 gamer is down to play ${game.label}: ${gamersFormatted}.`;
        } else {
          msgFormatted = `${gamers.length} gamers are down to play ${game.label}: ${gamersFormatted}.`;
        }

        if (gamers.length >= game.minPlayers) {
          msgFormatted += ` That's enough people to play ${game.label}. Use "!down ${args[1]} assemble" to ping everyone.`;
        }

        msg.channel.send(msgFormatted);
      } else {
        msg.channel.send(`Nobody wants to play ${game.label}. :(`);
      }
    }
  } else {
    msg.reply('Invalid usage. Type !help to view a list of commands.')
  }
}

const notImplementedCommand = (_, msg) => {
  msg.channel.send('not implemented yet, sorry bub :^)');
}

const commands = {
  '!down': downCommand,
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  updateScuffedData();
});
 
client.on('message', msg => {
  if (msg.content.startsWith('!')) {
    const args = msg.content.split(' ');


    if (commands[args[0]]) {
      commands[args[0]](args, msg);
    } else {
      notImplementedCommand(args, msg);
    }
  }
});

const onReaction = (isAdd, messageReaction, user) => {
  if (client.user.id === user.id) { return; }

  if (messageReaction.emoji.toString() === '⬇️' && global.lastDownMessageIds.includes(messageReaction.message.id)) {
    const [_, gameName, time] = messageReaction.message.content.split(' ');
    const game = global.downGames[getCanonicalGame(gameName)];
    const minutes = parseMinutes(time);

    if (isAdd) {
      game.users[user.id] = {
        displayName: user.username,
        minutes: Math.min(minutes, 480),
        dateSet: new Date(),
      };
    } else {
      delete game.users[user.id];
    }

    updateScuffedDb();
  }
}

client.on("messageReactionAdd", (messageReaction, user) => { onReaction(true, messageReaction, user); });
client.on("messageReactionRemove", (messageReaction, user) => { onReaction(false, messageReaction, user); });

client.login('Nzk0MTA1ODQ2NDY0MTE4ODA0.X-1-sw.BtpLz-9Foq-3d9VusCD-1qMEn74');
