require('dotenv').config();
const OpenAI = require("openai");
const { Client, GatewayIntentBits, Collection, REST, Routes, Events, Partials } = require('discord.js');
const fs = require('fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

client.commands = new Collection();
client.responseFrequency = 0; // Default frequency set to 100%
client.lastResponseTime = 0; // Initialize the last response time
client.breakTime = 5;
client.conversationHistories = new Map(); // Map to store conversation histories

const MAX_CONVERSATION_LENGTH = 10; // Limit the number of messages in the conversation history
const MAX_TOKENS_RESPONSE = 500; // Max tokens for the response

const userMap = {
    "269508686928412678": "peach",
    "310791774228447235": "helgrim",
    "202078403958931456": "A'sh",
    "183573057049329664": "Constance",
    "1081962204837970102": "BJ",
    "236591116470714370": "Jeremy"
};

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const currentTime = Date.now();

    const channelId = message.channel.id;
    const userId = message.author.id;
    const contextKey = message.guild ? channelId : userId;

    if (!client.conversationHistories.has(contextKey)) {
        client.conversationHistories.set(contextKey, []);
    }

    const conversationHistory = client.conversationHistories.get(contextKey);

    while (conversationHistory.length > MAX_CONVERSATION_LENGTH) {
        conversationHistory.shift(); // Remove the oldest message if the limit is exceeded
    }

    const processedMessage = replaceUserMentions(message.content);

    if (message.mentions.has(client.user)) {
        client.lastResponseTime = currentTime;
        conversationHistory.push({ role: 'user', content: `${message.author.username} says: ${processedMessage} to you` });
        const response = await getChatGPTResponse(conversationHistory);
        conversationHistory.push({ role: 'assistant', content: response });
        console.log("Response: " + response);
        message.reply(response);
    }
    else if (message.guild) {
        if (currentTime - client.lastResponseTime < (client.breakTime * 1000)) {
            // If less than the break time has passed since the last response, do not respond
            return;
        }
        if (shouldRespond(client.responseFrequency)) {
            client.lastResponseTime = currentTime;
            conversationHistory.push({ role: 'user', content: `${message.author.displayName} says: ${processedMessage}` });
            const response = await getChatGPTReaction(conversationHistory);
            conversationHistory.push({ role: 'assistant', content: response });
            message.reply(response);
        }
    } else {
        conversationHistory.push({ role: 'user', content: `${message.author.displayName} says: ${processedMessage}` });
        const response = await getChatGPTResponse(conversationHistory);
        conversationHistory.push({ role: 'assistant', content: response });
        message.reply(response);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    // Check if the reaction is partial, fetch it if so
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the reaction: ', error);
            return;
        }
    }

    // Check if the message was sent by the bot
    if (reaction.message.author.id === client.user.id) {
        console.log(`Reaction ${reaction.emoji.name} added by ${user.displayName} to message ${reaction.message.id}`);
        const response = await getChatGPTResponseToReaction(user.tag, reaction.emoji.name, reaction.message.content);
        console.log("Response: " + response);
        reaction.message.reply(response);
    }
});

function replaceUserMentions(content) {
    return content.replace(/<@!?(\d+)>/g, (match, userId) => {
        return userMap[userId] || match;
    });
}

async function getChatGPTResponse(conversationHistory) {
    const openAIResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: process.env.HELGRIM_PERSONALITY + " You are reacting to a group message that is directed at you, your response should be a direct answer to the message" },
            ...conversationHistory
        ],
        max_tokens: MAX_TOKENS_RESPONSE
    });
    const botResponse = openAIResponse.choices[0].message.content;
    return botResponse;
}

async function getChatGPTReaction(conversationHistory) {
    const openAIResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: process.env.HELGRIM_PERSONALITY + " You are reacting to a group message that isn't always necessarily directed at you, but you still want to add your reaction, your response should be a more general reaction to the message." },
            ...conversationHistory
        ],
        max_tokens: MAX_TOKENS_RESPONSE
    });
    const botResponse = openAIResponse.choices[0].message.content;
    return botResponse;
}

async function getChatGPTResponseToReaction(user, reactionemoji, message) {
    const openAIResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: process.env.HELGRIM_PERSONALITY},
            { role: 'user', content: `${user} reacted with: ${reactionemoji} to ${message} How do you react to the group chat adding this reaction to your message? Please mention the emoji reaction in your response if you can` }
        ],
        max_tokens: MAX_TOKENS_RESPONSE
    });
    const botResponse = openAIResponse.choices[0].message.content;
    return botResponse;
}

function shouldRespond(frequency) {
    let responseBool = (Math.random() * 100 < frequency);
    return responseBool;
}

client.login(DISCORD_TOKEN);
