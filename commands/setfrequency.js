const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setfrequency')
        .setDescription('Sets how often Grim will respond to messages.')
        .addIntegerOption(option =>
            option
                .setName('frequency')
                .setDescription('The response frequency (0-100)')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        const frequency = interaction.options.getInteger('frequency');

        if (frequency < 0 || frequency > 100) {
            return interaction.reply({ content: 'Please provide a valid number between 0 and 100.', ephemeral: true });
        }

        client.responseFrequency = frequency;
        return interaction.reply(`Response frequency set to ${client.responseFrequency}%.`);
    },
};
