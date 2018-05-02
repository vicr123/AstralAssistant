const Discord = require("discord.js");

let bans = {};

function sendFinalConfirmationMessage(message) {
    let banObject = bans[message.guild.id][message.author.id];
    let action = banObject.type.toLowerCase();

    let embed = new Discord.MessageEmbed();
    embed.setTitle(banObject.type);
    embed.setDescription(banObject.type + " this user?");
    embed.addField("User", banObject.user.tag);
    embed.addField("Reason", banObject.reason + "\n\n**Are you ready to " + action + " this user?**");
    embed.setColor([255, 0, 0]);
    
    message.channel.send(embed);
}

function sendUserSelectMessage(message) {
    let banObject = bans[message.guild.id][message.author.id];
    let action = banObject.type.toLowerCase();
    
    let userString = "**[insert here]**"
    if (Array.isArray(banObject.user)) {
        let users = banObject.user;
        userString = "Select a user to " + action + ":\n```";
        for (let i = 0; i < Math.min(9, users.length); i++) {
            userString += (i + 1) + ": " + users[i].user.tag + "\n";
        }
        userString += "```";
    }

    let embed = new Discord.MessageEmbed();
    embed.setTitle(banObject.type);
    embed.setDescription("Who do you want to " + action + "?");
    embed.addField("User", userString);
    embed.setColor([255, 0, 0]);

    if (banObject.reason == "") {
        embed.addField("Reason", "[pending]");
    } else {
        embed.addField("Reason", banObject.reason);
    }
    
    message.channel.send(embed);
}

function sendReasonSelectMessage(message) {
    let banObject = bans[message.guild.id][message.author.id];
    let action = banObject.type.toLowerCase();
    
    let embed = new Discord.MessageEmbed();
    embed.setTitle(banObject.type);

    if (banObject.type == "Ban") {
        embed.setDescription("Why are you banning this user?");
    } else if (banObject.type == "Kick") {
        embed.setDescription("Why are you kicking this user?");
    }
    embed.addField("User", banObject.user.tag);
    embed.addField("Reason", "**[insert here]**");
    embed.setColor([255, 0, 0]);
    
    message.channel.send(embed);
}

function canAction(user1, user2, guild) {
    //Checks if user1 can [action] user2
    //we've already established they have current permissions so just check the ranks

    return new Promise(async function(resolve, reject) {
        let m1 = guild.members.get(user1.id);
        if (m1 == undefined) {
            await guild.members.fetch(user1.id);
            m1 = guild.members.get(user1.id);
        }

        let m2 = guild.members.get(user2.id);
        if (m2 == undefined) {
            await guild.members.fetch(user2.id);
            m2 = guild.members.get(user2.id);
        }

        if (guild.me.roles.highest.comparePositionTo(m2.roles.highest) <= 0) {
            resolve("bot");
        } else if (m1.roles.highest.comparePositionTo(m2.roles.highest) <= 0) {
            resolve("user");
        } else {
            resolve(false);
        }
    });
}

async function capture(message) {
    let banObject = bans[message.guild.id][message.author.id];
    
    if (message.content.toLowerCase() == "cancel") {
        releaseInput(message.guild.id, message.author.id);

        let embed = new Discord.MessageEmbed();
        embed.setTitle(banObject.type);
        embed.setDescription("Alright, I won't " + banObject.type.toLowerCase() + " anyone.");
        embed.setColor([255, 0, 0]);
        message.channel.send(embed);
        return;
    }

    let selectUser = async function() {
        let action = banObject.type.toLowerCase();

        //No users are currently selected
        //Select a user
        let users = extractUser(message.content.split(" "), message.guild);
        users = filterGuild(filterLeastIndex(users), message.guild);

        if (users.length == 0) {
            message.reply("Unfortunately I couldn't find that user. Try selecting another user to " + action + ".");
            return;
        } else if (users.length > 1) {
            bans[message.guild.id][message.author.id] = {
                user: users,
                reason: banObject.reason,
                type: banObject.type
            };

            sendUserSelectMessage(message);
        } else {
            let actionResult = await canAction(message.author, users[0].user, message.guild);
            if (actionResult == "user") {
                message.reply("Unfortunately that user's highest role is not lower than yours, so I can't " + action + " that user for you. Please select another user.");
                return;
            } else if (actionResult == "bot") {
                message.reply("Unfortunately " + botName + " doesn't have the neccessary permissions to " + action + " that user. Please select another user.");                
                return;
            }

            bans[message.guild.id][message.author.id] = {
                user: users[0].user,
                reason: banObject.reason,
                type: banObject.type
            };
            
            if (banObject.reason != "") {
                sendFinalConfirmationMessage(message);
            } else {
                sendReasonSelectMessage(message);
            }
        }
    }

    if (banObject.user == null) {
        selectUser();
        return;
    } else if (Array.isArray(banObject.user)) {
        //User Disambiguation required
        let index = parseInt(message.content) - 1;
        if (isNaN(index)) {
            selectUser();
            return;
        }

        if (banObject.user[index] == null) {
            selectUser();
            return;
        }

        let action = banObject.type.toLowerCase();
        let actionResult = await canAction(message.author, banObject.user[index].user, message.guild);
        if (actionResult == "user") {
            message.reply("Unfortunately that user's highest role is not lower than yours, so I can't " + action + " that user for you. Please select another user.");
            return;
        } else if (actionResult == "bot") {
            message.reply("Unfortunately " + botName + " doesn't have the neccessary permissions to " + action + " that user. Please select another user.");                
            return;
        }

        let reason;
        if (banObject.reason != null && banObject.reason != "") {
            reason = banObject.reason;
        } else {
            reason = extractReason(banObject.user[index].words);
        }

        bans[message.guild.id][message.author.id] = {
            user: banObject.user[index].user,
            reason: reason,
            type: banObject.type
        };
        

        if (reason != "") {
            sendFinalConfirmationMessage(message);
        } else {
            sendReasonSelectMessage(message);
        }
        
        return;
    } else if (banObject.reason == "") {
        bans[message.guild.id][message.author.id] = {
            user: banObject.user,
            reason: message.content,
            type: banObject.type
        };

        sendFinalConfirmationMessage(message);

        return;
    } else {
        //Ready to ban!
        if (isNegative(message.content)) {
            releaseInput(message.guild.id, message.author.id);
    
            let embed = new Discord.MessageEmbed();
            embed.setTitle(banObject.type);
            embed.setDescription("Alright, I won't " + banObject.type.toLowerCase() + " anyone.");
            embed.setColor([255, 0, 0]);
            message.channel.send(embed);
            return;
        }

        if (isAffirmative(message.content)) {
            releaseInput(message.guild.id, message.author.id);

            let afterSuccess = function() {
                let embed = new Discord.MessageEmbed();
                embed.setTitle(banObject.type);
    
                if (banObject.type == "Ban") {
                    embed.setDescription("This user has been banned from the server.");
                } else if (banObject.type == "Kick") {
                    embed.setDescription("This user has been kicked from the server.");
                }
                embed.addField("User", banObject.user.tag);
                embed.addField("Reason", banObject.reason);
                embed.setColor([255, 0, 0]);
                
                message.channel.send(embed);
            };
            let error = function() {
                message.reply("Unfortunately we couldn't process that for you.");
            }

            if (banObject.type == "Ban") {
                message.guild.members.get(banObject.user.id).ban({reason: banObject.reason}).then(afterSuccess).catch(error);
            } else if (banObject.type == "Kick") {
                message.guild.members.get(banObject.user.id).kick({reason: banObject.reason}).then(afterSuccess).catch(error);
            }
            return;
        }

        if (message.content.toLowerCase().indexOf("reason") != -1) {
            let content = message.content;

            let index = content.toLowerCase().indexOf("to");
            if (index != -1) {
                content = content.substr(index + 2).trim();
                
                bans[message.guild.id][message.author.id] = {
                    user: banObject.user,
                    reason: content,
                    type: banObject.type
                };

                sendFinalConfirmationMessage(message);

                return;
            }

            bans[message.guild.id][message.author.id] = {
                user: banObject.user,
                reason: "",
                type: banObject.type
            };

            sendReasonSelectMessage(message);

            return;
        }

        if (message.content.toLowerCase().indexOf("user") != -1) {
            bans[message.guild.id][message.author.id] = {
                user: null,
                reason: banObject.reason,
                type: banObject.type
            };

            sendUserSelectMessage(message);

            return;
        }
    }
}

function extractReason(words) {
    if (words.indexOf("for") != -1) {
        return toSentenceCase(words.slice(words.indexOf("for") + 1).join(" "));
    }
    if (words.indexOf("because") != -1) {
        return toSentenceCase(words.slice(words.indexOf("because") + 1).join(" "));
    }
    return toSentenceCase(words.join(" "));
}

exports.banUser = async function(words, message) {
    //Check if the user can ban
    if (!message.member.hasPermission(Discord.Permissions.FLAGS.BAN_MEMBERS)) {
        message.channel.send(":pause_button: Sorry, I'm not allowed to do that for you. Please contact a server manager for assistance.");
        return;
    }

    let banWordIndex = 0;
    if (words.indexOf("ban") != -1) {
        banWordIndex = words.indexOf("ban");
        words.splice(words.indexOf("ban"), 1);
    }
    if (words.indexOf("banned") != -1) {
        words.splice(words.indexOf("banned"), 1);
    }

    let users = extractUser(words.slice(banWordIndex), message.guild);
    users = filterGuild(filterLeastIndex(users), message.guild);
    
    captureInput(capture, message.guild.id, message.author.id);

    if (bans[message.guild.id] == null) bans[message.guild.id] = {};

    if (users.length == 0) {
        let reason = extractReason(words);

        bans[message.guild.id][message.author.id] = {
            user: null,
            reason: reason,
            type: "Ban"
        };

        sendUserSelectMessage(message);
    } else if (users.length > 1) {
        bans[message.guild.id][message.author.id] = {
            user: users,
            reason: "",
            type: "Ban"
        };

        sendUserSelectMessage(message);
    } else {
        let reason = extractReason(users[0].words);

        let action = "ban";
        let actionResult = await canAction(message.author, users[0].user, message.guild);
        if (actionResult == "user") {
            message.reply("Unfortunately that user's highest role is not lower than yours, so I can't " + action + " that user for you. Please select another user.");

            bans[message.guild.id][message.author.id] = {
                user: null,
                reason: reason,
                type: "Ban"
            };

            sendUserSelectMessage(message);

            return;
        } else if (actionResult == "bot") {
            message.reply("Unfortunately " + botName + " doesn't have the neccessary permissions to " + action + " that user. Please select another user.");

            bans[message.guild.id][message.author.id] = {
                user: null,
                reason: reason,
                type: "Ban"
            };

            sendUserSelectMessage(message);

            return;
        }

        bans[message.guild.id][message.author.id] = {
            user: users[0].user,
            reason: reason,
            type: "Ban"
        };

        if (reason != "") {
            sendFinalConfirmationMessage(message);
        } else {
            sendReasonSelectMessage(message);
        }
    }
}


exports.kickUser = async function(words, message) {
    //Check if the user can kick
    if (!message.member.hasPermission(Discord.Permissions.FLAGS.KICK_MEMBERS)) {
        message.channel.send(":pause_button: Sorry, I'm not allowed to do that for you. Please contact a server manager for assistance.");
        return;
    }

    if (words.indexOf("kick") != -1) {
        words.splice(words.indexOf("kick"), 1);
    }
    if (words.indexOf("kicked") != -1) {
        words.splice(words.indexOf("kick"), 1);
    }

    let users = extractUser(words, message.guild);
    users = filterGuild(filterLeastIndex(users), message.guild);
    
    captureInput(capture, message.guild.id, message.author.id);

    if (bans[message.guild.id] == null) bans[message.guild.id] = {};

    if (users.length == 0) {
        let reason = extractReason(words);

        bans[message.guild.id][message.author.id] = {
            user: null,
            reason: reason,
            type: "Kick"
        };

        sendUserSelectMessage(message);
    } else if (users.length > 1) {
        bans[message.guild.id][message.author.id] = {
            user: users,
            reason: "",
            type: "Kick"
        };

        sendUserSelectMessage(message);
    } else {
        let reason = extractReason(users[0].words);

        let action = "kick";
        let actionResult = await canAction(message.author, users[0].user, message.guild);
        if (actionResult == "user") {
            message.reply("Unfortunately that user's highest role is not lower than yours, so I can't " + action + " that user for you. Please select another user.");

            bans[message.guild.id][message.author.id] = {
                user: null,
                reason: reason,
                type: "Kick"
            };

            sendUserSelectMessage(message);

            return;
        } else if (actionResult == "bot") {
            message.reply("Unfortunately " + botName + " doesn't have the neccessary permissions to " + action + " that user. Please select another user.");

            bans[message.guild.id][message.author.id] = {
                user: null,
                reason: reason,
                type: "Kick"
            };

            sendUserSelectMessage(message);

            return;
        }

        bans[message.guild.id][message.author.id] = {
            user: users[0].user,
            reason: reason,
            type: "Kick"
        };

        if (reason != "") {
            sendFinalConfirmationMessage(message);
        } else {
            sendReasonSelectMessage(message);
        }
    }
}