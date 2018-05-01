let currentGame = 0;
let games = [];

exports.play = function(words, message) {
    if (words.indexOf("play") != -1) {
        words.splice(words.indexOf("play"), 1);
    }
    if (words.indexOf("game") != -1) {
        words.splice(words.indexOf("game"), 1);
    }

    if (words.indexOf("ffc") != -1 || words.join(" ").indexOf("final fantastic card") != -1) {
        currentGame++;
        message.channel.send("**Game #" + currentGame + "** of **Final Fantastic Card** is now starting. How exciting!\n\n:play_pause: to join the game\n:dark_sunglasses: to spectate the game\n:white_check_mark: to close and start the game").then(function(message) {
            message.react("⏯");
            message.react("🕶");
            message.react("✅");
        });
    } else {
        message.reply("Hmm, I couldn't find the game you wanted to play.");
    }
}