const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();

global.downGames = {};

const scuffedDataInitial = {
  leagueoflegends: { label:"League of Legends", minPlayers: 5, users: {}},
  amongus: { label: "Among Us", minPlayers: 8, users: {} },
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

  if (leagueoflegends.includes(gameLowercase)) {
    return 'leagueoflegends';
  } else {
    return null;
  }
}

/**
 * Returns the list of gamers down to play gameName.
 * @param {string} gameName
 * @returns {object[]} gamers
 */
const downGamers = (gameName) => {
  const game = global.downGames[gameName];
  
  return Object.entries(game.users).reduce((gamers, [userId, { minutes, dateSet, displayName }]) => {
    const minutesPassed = Math.abs(new Date() - new Date(dateSet)) / 1000 / 60;
    const minutesLeft = minutes - minutesPassed;
    if (minutesPassed <= minutes) {
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
      } else if (!isNaN(args[2])) {
        const minutes = parseFloat(args[2]);

        if (minutes <= 0) {
          delete game.users[msg.author.id];

          console.log(game.users);
        } else {
          // Indicating that they are down to game.
          game.users[msg.author.id] = {
            displayName: msg.member.displayName,
            minutes: Math.min(minutes, 1440),
            dateSet: new Date(),
          };
        }

        updateScuffedDb();
        msg.react('✅');
      }
    } else {
      // Checking who wants to game.
      const gamers = downGamers(gameName);
      if (gamers.length >= 1) {
        let gamersFormatted = gamers.reduce((gamersFormattedPrev, { userId, displayName, minutesLeft }) => `${gamersFormattedPrev}${displayName} (${Math.ceil(minutesLeft)} min${Math.ceil(minutesLeft) === 1 ? '' : 's'}), `, '');
        gamersFormatted = gamersFormatted.substring(0, gamersFormatted.length - 2);

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
 
client.login('Nzk0MTA1ODQ2NDY0MTE4ODA0.X-1-sw.BtpLz-9Foq-3d9VusCD-1qMEn74');
