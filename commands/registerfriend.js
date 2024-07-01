const { SlashCommandBuilder } = require('discord.js');

function isPrime(num) {
    for (let i = 2; i * i <= num; i++) {
        if (num % i === 0) return false;
    }
    return num > 1;
}

function boldVowels(str) {
    return str.replace(/[aeiou]/gi, match => `**${match}**`);
}

function containsNumber(str) {
    return /\d/.test(str);
}

function containsUppercase(str) {
    return /[A-Z]/.test(str);
}

function containsSpecialCharacter(str) {
    return /[!@#$%^&*(),.?":{}|<>]/.test(str);
}

function sumDigits(str) {
    return [...str].filter(char => /\d/.test(char)).reduce((acc, char) => acc + parseInt(char), 0);
}

function containsYouTubeLink(str) {
    return /https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(str);
}

function getCurrentTime() {
    return new Date().toTimeString().split(' ')[0].slice(0, 5);
}

function isPinkHex(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r >= 200 && g <= 192 && b >= 200);
}

const moonEmojis = ["🌑", "🌓", "🌔", "🌕", "🌙", "🌛", "🌝", "🌒", "🌖", "🌗", "🌘", "🌚", "🌜"];
const drinks = ["pepsi", "cola"];
const romanNumerals = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];
const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nickname')
        .setDescription('Let grim know your nickname')
        .addStringOption(option =>
            option
                .setName('nickname')
                .setDescription('Your nickname')
                .setRequired(true)
        ),
    async execute(interaction) {
        let nickname = interaction.options.getString('nickname');

        if (nickname.length < 5) {
            return interaction.reply({ content: 'Nickname must be at least 5 characters' });
        }

        if (!containsNumber(nickname)) {
            return interaction.reply({ content: 'Nickname must contain at least one number' });
        }

        if (!containsUppercase(nickname)) {
            return interaction.reply({ content: 'Nickname must contain at least one uppercase letter' });
        }

        if (!containsSpecialCharacter(nickname)) {
            return interaction.reply({ content: 'Nickname must contain at least one special character' });
        }

        if (sumDigits(nickname) !== 25) {
            return interaction.reply({ content: 'Digits in the nickname must sum to 25' });
        }

        const containsMonth = months.some(month => nickname.includes(month));
        if (!containsMonth) {
            return interaction.reply({ content: 'Nickname must contain a month' });
        }

        const containsRomanNum = romanNumerals.some(roman => nickname.includes(roman));
        if (!containsRomanNum) {
            return interaction.reply({ content: 'Nickname must contain a Roman numeral' });
        }

        const containsDrink = drinks.some(drink => nickname.toLowerCase().includes(drink));
        if (!containsDrink) {
            return interaction.reply({ content: 'Nickname must contain your favorite drink (Pepsi or Cola)' });
        }

        const hexRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
        const hexMatches = nickname.match(hexRegex) || [];
        const containsPinkHex = hexMatches.some(hex => isPinkHex(hex));
        if (!containsPinkHex) {
            return interaction.reply({ content: 'Nickname must contain a pink color hex code' });
        }

        // Additional logic for Roman numerals multiplication to 35 and Periodic Table symbol check

        const containsMoonEmoji = moonEmojis.some(emoji => nickname.includes(emoji));
        if (!containsMoonEmoji) {
            return interaction.reply({ content: 'Nickname must contain the current phase of the moon as an emoji' });
        }

        const leapYearRegex = /(19|20)\d{2}/g;
        const years = nickname.match(leapYearRegex) || [];
        
        const isLeapYear = year => {
            year = parseInt(year, 10);
            return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        };
        
        const containsLeapYear = years.some(year => isLeapYear(year));
        
        if (!containsLeapYear) {
            return interaction.reply({ content: 'Nickname must contain a leap year', ephemeral: true });
        }

        const affirmations = ["i am loved", "i am worthy", "i am enough"];

        const containsAffirmation = affirmations.some(affirmation => nickname.toLowerCase().includes(affirmation.toLowerCase()));
        if (!containsAffirmation) {
        return interaction.reply({ content: 'Nickname must contain one of the affirmations: "I am loved", "I am worthy", "I am enough"' });
}

        if (!containsYouTubeLink(nickname)) {
            return interaction.reply({ content: 'Nickname must contain a YouTube link' });
        }
        
        nickname = boldVowels(nickname);
        const boldCount = (nickname.match(/\*\*(.*?)\*\*/g) || []).length;
        const italicCount = (nickname.match(/\*(.*?)\*/g) || []).length;
        const italicPercentage = (italicCount / nickname.length) * 100;
        if (italicPercentage < 30) {
            return interaction.reply({ content: 'At least 30% of your nickname needs to be italic' });
        }

        if (italicCount !== 2 * boldCount) {
            return interaction.reply({ content: 'Nickname must have twice as many italic letters as bold letters' });
        }

        if (!nickname.includes(nickname.length.toString())) {
            return interaction.reply({ content: 'Nickname must contain its own length as a number' });
        }

        if (!nickname.includes(getCurrentTime())) {
            return interaction.reply({ content: 'Nickname must include the current time in format HH:MM' });
        }

        if (!isPrime(nickname.length)) {
            return interaction.reply({ content: 'Nickname length must be a prime number' });
        }

        return interaction.reply(`Nickname validated successfully!`);
    },
};
