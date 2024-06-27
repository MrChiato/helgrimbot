const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbreaktime')
        .setDescription('Sets how long between Grim responds. In seconds.')
        .addIntegerOption(option =>
            option
                .setName('breaktime')
                .setDescription('The response break time in seconds (0-100)')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        const breaktime = interaction.options.getInteger('breaktime');

        if (breaktime < 0 || breaktime > 100) {
            return interaction.reply({ content: 'Please provide a valid number between 0 and 100.', ephemeral: true });
        }

        client.breakTime = breaktime; // Setting the property
        return interaction.reply(`Response break time set to ${client.breakTime} seconds.`); // Using the correct property name
    },
};
