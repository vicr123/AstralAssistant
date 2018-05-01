const Discord = require("discord.js");

module.exports = function(command, message) {
    let miscWords = [];
    let words = command.split(" ");

    let currentOperation = "";

    let setOp = function(op) {
        if (currentOperation == "") currentOperation = op;
    }

    for (let index in words) {
        let word = words[index];
        let lWord = word.toLowerCase();

        if (lWord == "hello") {
            setOp("hello");
        } else if (lWord == "help") {
            setOp("help");
        } else if (lWord == "ban" || lWord == "banned") {
            setOp("ban");
        } else if (lWord == "kick" || lWord == "kicked") {
            setOp("kick");
        } else if (lWord == "weather" || lWord == "forecast") {
            setOp("weather");
        } else if (lWord == "play" || lWord == "game") {
            setOp("game");
        }
    }

    if (currentOperation == "") {
        let lCommand = command.toLowerCase();
        if (lCommand.indexOf("what") != -1 && lCommand.indexOf("do") != -1) {
            setOp("help");
        }
    }

    switch (currentOperation) {
        case "hello":
            message.channel.send("Hey there! Here's what you can ask me to do.", {embed: getHelp()});
            break;
        case "help":
            message.channel.send("Try asking me something from this list.", {embed: getHelp()});
            break;
        case "ban":
            require("./modules/ban.js").banUser(words, message);
            break;
        case "kick":
            require("./modules/ban.js").kickUser(words, message);
            break;
        case "weather":
            require("./modules/weather.js").weather(words, message);
            break;
        case "game":
            require("./modules/game.js").play(words, message);
            break;
        default:
            require("./modules/default.js").default(words, message);
            break;
    }
};

function getHelp() {
    let embed = new Discord.RichEmbed;
    embed.setTitle(botName + " Help");
    embed.setDescription(botName + " aims to understand natural language, so even if it's not on this list, try asking me what you want to do and I might understand.");
    embed.addField("Manage the server", "You can ask me to manage users in your server. For example,\n`Ban vicr123`\n`Kick Vic`\n`Warn vicr123 for introducing AstralAssistant`");
    embed.addField("Get Information", "You can ask me for answers to questions. For example,\n`What's the weather in Sydney`\n`What's the time where vicr123 is`");
    embed.setColor([0, 200, 0]);
    return embed;
}