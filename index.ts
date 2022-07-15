import fs from 'fs';
// TODO submit pr
import { Client, Intents } from 'discord.js'
import { SlashCommandBuilder } from '@discordjs/builders';

const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!')
	.addStringOption(option => option.setName('input').setDescription('Enter a string'))
	.addIntegerOption(option => option.setName('int').setDescription('Enter an integer'))
	.addBooleanOption(option => option.setName('choice').setDescription('Select a boolean'))
	.addUserOption(option => option.setName('target').setDescription('Select a user'))
	.addChannelOption(option => option.setName('destination').setDescription('Select a channel'))
	.addRoleOption(option => option.setName('muted').setDescription('Select a role'))
	.addMentionableOption(option => option.setName('mentionable').setDescription('Mention something'))
	.addNumberOption(option => option.setName('num').setDescription('Enter a number'))
	.addAttachmentOption(option => option.setName('attachment').setDescription('Attach something'));

const INITIAL_DATA: BartenderData = {
  down: {
    canonicalMap: {
      'legos': 'League of Legends',
      'leg': 'League of Legends',
      'lol': 'League of Legends',
      'legoslosgandos': 'League of Legends',
    },
    gameNames: ['League of Legends'],
    gamers: {},
  },
};

const persistScuffedDb = (data: BartenderData): void => {
  fs.writeFile('./scuffedDb.json', JSON.stringify(data), (e) => {
    if (e) {
      console.error('Error persisting scuffedDb.json', e);
    }
  });
};

const initData = (): BartenderData => {
  let scuffedDb = '';
  let data = {};

  // Initialize the scuffed db with INITIAL_DATA if it doesn't exist..
  if (!fs.existsSync('./scuffedDb.json')) {
    fs.writeFile('./scuffedDb.json', JSON.stringify(INITIAL_DATA), (e) => {
      if (e) {
        console.error('Error initializing scuffedDb.json', e);
      } else {
        console.log('Initialized scuffedDb.json');
      }
    });
    return INITIAL_DATA;
  }

  try {
    scuffedDb = fs.readFileSync('./scuffedDb.json', 'utf8');
  } catch (e) {
    console.error('Error reading scuffedDb', e);
  }

  try {
    data = JSON.parse(scuffedDb);
  } catch (e) {
    console.error('Invalid ScuffeDb data.', e);
  }

  return data as BartenderData;
};

const dispatch = {
};


// Initialize the client and register commands.
const client = new Client({ intents: Intents.FLAGS.GUILDS });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
  // Slash command.
  if (!interaction.isApplicationCommand()) {
    return;
  }

  if (interaction.commandName === 'ping') {
    await interaction.reply({ content: 'Pong!', ephemeral: true });
  }
});

if (!process.env.AnimeBartenderToken) {
  console.error('No token set.');
} else {
  client.login(process.env.AnimeBartenderToken);
}
