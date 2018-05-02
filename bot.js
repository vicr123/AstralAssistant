// @ts-nocheck
const Discord = require("discord.js");
const blessed = require("blessed");
const keys = require("./keys.js");
const moment = require("moment");
const fs = require("fs");
global.botName = "AstralAssistant";
const botVersion = "1.0";
const crypto = require("crypto");
const cipherAlg = "aes-256-ctr";
const sha256 = crypto.createHash("sha256");
const settingsKey = keys.settingsKey.slice(0, 32);
const processCommand = require("./commandProcessor.js");
const emojiServer = "426703640082776065"; //Change this if you're forking AA :)
const sqlite3 = require('sqlite3').verbose();

try {
    if (!fs.existsSync(require('os').homedir() + "/.config")) {
        fs.mkdirSync(require('os').homedir() + "/.config");
    }
    if (!fs.existsSync(require('os').homedir() + "/.config/aa")) {
        fs.mkdirSync(require('os').homedir() + "/.config/aa");
    }
} catch {
    //ignore filesystem errors
}
global.db = new sqlite3.Database(require('os').homedir() + "/.config/aa/db.sqlite", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE);

let client = new Discord.Client({
    restTimeOffset: 10,
    disableEveryone: true
});

global.logType = {
    debug: 0,
    info: 1,
    warning: 2,
    critical: 3,
    good: 4
}

let capture = {};
global.captureInput = function(func, guild, author) {
    if (capture[guild] == null) capture[guild] = {};
    capture[guild][author] = {
        function: func,
        guild: guild,
        author: author
    };
}

global.releaseInput = function(guild, author) {
    capture[guild][author] = null;
}

//Set up screen
let lockBox = [];
let commandHistory = [];

let screen = blessed.screen({
    smartCSR: true,
    dockBorders: true
});
screen.title = botName + ' ' + botVersion;

var titleBox = blessed.text({
    top: "0",
    left: "0",
    width: "100%",
    height: "1",
    content: botName + " " + botVersion + " Console",
    tags: true,
    style: {
        fg: 'black',
        bg: 'white'
    },
    padding: {
        left: 1
    }
});
screen.append(titleBox);

global.getEmoji = function(emojiName) {
    let e = client.guilds.get(emojiServer).emojis.find("name", emojiName);
    if (e == null) {
        return ":arrow_right:";
    } else {
        return e.toString();
    }
}


var logBox = blessed.log({
    top: 1,
    left: 0,
    width: "100%",
    height: "100%-4",
    tags: true,
    style: {
        fg: 'white',
        bg: 'black',
        scrollbar: {
            bg: 'white'
        }
    },
    padding: {
        left: 1 // ,
        // bottom: 2
    },
    scrollable: true,
    alwaysScroll: true,
    scrollOnInput: true,
    scrollbar: true //,
    //clickable: true
});
screen.append(logBox);

function clearBoxes() {
    while (lockBox.length > 0) {
        var box = lockBox.pop();
        box.hide();
        box.destroy();
    }

}

logBox.on('click', function(mouse) {
    var x = mouse.x;
    var y = mouse.y;

    //var line = logBox.getScreenLines()[y + 1];
    var line = logBox.getBaseLine(y - 1);

    //Remove escapes
    while (line.indexOf("\x1b") != -1) {
        var removeStart = line.indexOf("\x1b");
        var removeEnd = line.indexOf("m", removeStart);
        line = line.replace(line.slice(removeStart, removeEnd + 1), "");
    }
    //logBox.log(line);

    //Get word around line
    var previousSpace = line.lastIndexOf(" ", x - 2);
    var nextSpace = line.indexOf(" ", x - 2);

    previousSpace++;

    if (nextSpace == -1) {
        nextSpace = line.length;// - previousSpace;
    }
    var word = line.substring(previousSpace, nextSpace);

    if (word.startsWith("[")) word = word.substr(1);
    if (word.endsWith("]")) word = word.substr(0, word.length - 2);

    var goUpwards = false;
    var top = y + 1;
    if (top + 7 > screen.height) {
        top = y - 7;
        goUpwards = true;
    }

    var left = x - 10;
    if (left + 50 > screen.width) {
        left = screen.width - 50;
    } else if (left < 0) {
        left = 0;
    }

    var boxOptions = {
        top: top,
        left: left,
        width: 50,
        style: {
            fg: "black",
            bg: "white",
            border: {
                fg: 'white',
                bg: 'black'
            }
        },
        border: {
            type: "line"
        },
        padding: {
            left: 2,
            top: 1,
            right: 2,
            bottom: 1
        }
    };

    clearBoxes();

    //Determine type of object clicked
    if (client.guilds.has(word)) {
        //This is a guild
        var guild = client.guilds.get(word);
        var box = blessed.box(JSON.parse(JSON.stringify(boxOptions)));
        box.content = "For Guild " + word + "\n" +
                      "Name: " + guild.name;
        box.height = 7;
        screen.append(box);

        if (goUpwards) {
            boxOptions.top -= 6;
        } else {
            boxOptions.top += 6;
        }

        var moreInfoButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        moreInfoButton.content = "More Info";
        moreInfoButton.left = 0;
        moreInfoButton.top = 2;
        moreInfoButton.width = 9;
        moreInfoButton.height = 1;
        moreInfoButton.on('click', function() {
            clearBoxes();
            renderScreen();

            processConsoleInput("ginfo " + word);
        });
        box.append(moreInfoButton);

        var membersButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        membersButton.content = "Members";
        membersButton.left = 10;
        membersButton.top = 2;
        membersButton.width = 7;
        membersButton.height = 1;
        membersButton.on('click', function() {
            clearBoxes();
            renderScreen();

            processConsoleInput("ginfom " + word);
        });
        box.append(membersButton);

        var channelsButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        channelsButton.content = "Channels";
        channelsButton.left = 18;
        channelsButton.top = 2;
        channelsButton.width = 8;
        channelsButton.height = 1;
        channelsButton.on('click', function() {
            clearBoxes();
            renderScreen();

            processConsoleInput("ginfoc " + word);
        });
        box.append(channelsButton);

        var bansButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        bansButton.content = "Bans";
        bansButton.left = 27;
        bansButton.top = 2;
        bansButton.width = 4;
        bansButton.height = 1;
        bansButton.on('click', function() {
            clearBoxes();
            renderScreen();

            processConsoleInput("ginfob " + word);
        });
        box.append(bansButton);

        lockBox.push(box);
    }

    if (client.channels.has(word)) {
        //This is a channel
        var channel = client.channels.get(word);
        var box = blessed.box(JSON.parse(JSON.stringify(boxOptions)));
        box.content = "For Channel " + word + "\n" +
                      "Name: " + channel.name;
        box.height = 7;
        screen.append(box);

        if (goUpwards) {
            boxOptions.top -= 6;
        } else {
            boxOptions.top += 6;
        }

        var moreInfoButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        moreInfoButton.content = "More Info";
        moreInfoButton.left = 0;
        moreInfoButton.top = 2;
        moreInfoButton.width = 9;
        moreInfoButton.height = 1;
        moreInfoButton.on('click', function() {
            clearBoxes();
            renderScreen();

            processConsoleInput("cinfo " + word);
        });
        box.append(moreInfoButton);

        var sendButton = blessed.button({
            style: {
                fg: "yellow",
                bg: "blue"
            }
        });
        sendButton.content = "Send";
        sendButton.left = 10;
        sendButton.top = 2;
        sendButton.width = 4;
        sendButton.height = 1;
        sendButton.on('click', function() {
            clearBoxes();
            renderScreen();

            //processConsoleInput("cinfo " + word);
            showTextBox();
            textBox.setValue("> send " + word + " ");
            renderScreen();
        });
        box.append(sendButton);

        lockBox.push(box);
    }

    if (client.users.has(word)) {
        //This is a user
        var user = client.users.get(word);
        var box = blessed.box(JSON.parse(JSON.stringify(boxOptions)));
        box.content = "For User " + word + "\n" +
                      "Name: " + user.username;
        box.height = 7;
        screen.append(box);

        if (goUpwards) {
            boxOptions.top -= 6;
        } else {
            boxOptions.top += 6;
        }

        lockBox.push(box);
    }

    if (word == "save" || word == "vacuum" || word == "guilds" || word == "exit") {
        processConsoleInput(word);
    }

    screen.render();
});

var textBox = blessed.textbox({
    top: "100%-3",
    left: -1,
    width: "100%+2",
    height: 3,
    tags: true,
    value: "> ",
    border: {
        type: "line"
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: 'white',
            bg: 'black'
        }
    },
    inputOnFocus: true
});
screen.append(textBox);

var keyBox = blessed.box({
    top: "100%-1",
    left: "0",
    width: "100%",
    height: 1,
    tags: true,
    style: {
        fg: 'black',
        bg: 'white'
    },
    padding: {
        left: 1
    }
});
screen.append(keyBox);

var guildsButton = blessed.button({
    style: {
        fg: "yellow",
        bg: "blue"
    },
    content: "^G Guilds",
    left: 10,
    width: 9,
    height: 1,
    top: "100%-1"
});
guildsButton.on('click', function() {
    processConsoleInput("guilds");
});
screen.append(guildsButton);

textBox.key('C-c', function(ch, key) {
    shutdown();
});

screen.key('C-c', function() {
    shutdown();
});

screen.key('C-g', function() {
    processConsoleInput("guilds");
});

screen.key('up', function() {
    logBox.scroll(-1);
    renderScreen();
});

screen.on('keypress', function(key) {
    if (lockBox.length != 0) {
        clearBoxes();
    } else if (key != undefined && !textBox.focused && key != "\r") {
        showTextBox();

        if (key != ":") {
            textBox.setValue("> " + key);
        }
    }
});

screen.key('pageup', function() {
    logBox.scroll(-logBox.height);
    renderScreen();
});

screen.key('down', function() {
    logBox.scroll(1);
    renderScreen();
});

screen.key('pagedown', function() {
    logBox.scroll(logBox.height);
    renderScreen();
});

function showTextBox() {
    logBox.height = "100%-4";
    keyBox.content = "ESC Cancel Command   ENTER Issue Command";
    textBox.show();
    textBox.focus();
    guildsButton.hide();

    renderScreen();
}

var currentHistoryEntry = -1;
function hideTextBox() {
    textBox.setValue("> ");
    logBox.height = "100%-2";
    keyBox.content = "^C Exit                          To issue a command, just start typing away.";
    textBox.hide();
    logBox.focus();
    guildsButton.show();
    currentHistoryEntry = -1;

    renderScreen();
}

textBox.key("up", function() {
    currentHistoryEntry++;
    if (commandHistory[currentHistoryEntry] != null) {
        textBox.setValue("> " + commandHistory[currentHistoryEntry]);
    } else {
        currentHistoryEntry = -1;
        textBox.setValue("> ");
    }
    renderScreen();
});

textBox.key("down", function() {
    currentHistoryEntry--
    if (commandHistory[currentHistoryEntry] != null) {
        textBox.setValue("> " + commandHistory[currentHistoryEntry]);
    } else {
        currentHistoryEntry = -1;
        textBox.setValue("> ");
    }
    renderScreen();
});

textBox.on("cancel", function() {
    hideTextBox();
});

function renderScreen() {
    screen.render();
}

renderScreen();
hideTextBox();

console.error = function(data, ...args){
    log(data, logType.warning);
};

global.log = function(logMessage, type = logType.debug) {
    if (logMessage == null) {
        return;
    }

    //Log a message to the console
    if (type == logType.debug) {
        if (process.argv.indexOf("--debug") == -1) {
            return;
        }
    }

    var logFormatting;
    var logString;

    var lines = logMessage.split("\n");

    for (i = 0; i < lines.length; i++) {
        switch (type) {
            case logType.debug:
                if (i == 0) {
                    logString = "[ ] ";
                } else if (i == lines.length - 1) {
                    logString = " └─ ";
                } else {
                    logString = " ├─ ";
                }
                logString += lines[i];
                logFormatting = "\x1b[1m\x1b[34m";
                break;
            case logType.info:
                if (i == 0) {
                    logString = "[i] ";
                } else if (i == lines.length - 1) {
                    logString = " └─ ";
                } else {
                    logString = " ├─ ";
                }
                logString += lines[i];
                logFormatting = "\x1b[1m\x1b[37m";
                break;
            case logType.warning:
                if (i == 0) {
                    logString = "[!] ";
                } else if (i == lines.length - 1) {
                    logString = " └─ ";
                } else {
                    logString = " ├─ ";
                }
                logString += lines[i];
                logFormatting = "\x1b[1m\x1b[33m";
                break;
            case logType.critical:
                if (i == 0) {
                    logString = "[X] ";
                } else if (i == lines.length - 1) {
                    logString = " └─ ";
                } else {
                    logString = " ├─ ";
                }
                logString += lines[i];
                logFormatting = "\x1b[1m\x1b[31m";
                break;
            case logType.good:
                if (i == 0) {
                    logString = "[>] ";
                } else if (i == lines.length - 1) {
                    logString = " └─ ";
                } else {
                    logString = " ├─ ";
                }
                logString += lines[i];
                logFormatting = "\x1b[1m\x1b[32m";
                break;
        }

        var logOutput = logFormatting + logString + "\x1b[0m";

        logBox.log("[" + new Date().toLocaleTimeString("us", {
            hour12: false
        }) + "] " + logOutput);
        renderScreen();
    }
}


function processConsoleInput(line) {
    commandHistory.unshift(line);

    logBox.log(line);

    const memberLine = function(member) {
        var line = member.id + "  " + member.user.tag;
        if (member.nickname != null) {
            line += " [" + member.nickname + "]";
        }
        if (member.user.bot) {
            line += " \x1b[46m[BOT]";
        }
        return line;
    };

    var lLine = line.toLowerCase();
    if (lLine == "help") {
        var help = botName + " Console Commands:\n" +
                   "save                    Saves " + botName + " configuration settings to disk. This happens every 30 seconds.\n" +
                   "loadunenc [filename]    Loads an unencrypted settings.json file from disk.\n" +
                   "dumpsettings            Prints the settings file contents, unencrypted, to the console\n" +
                   "load [plugin]           Loads a plugin into " + botName + "\n" +
                   "unload [plugin]         Unloads a plugin from " + botName + "\n" +
                   "reload [plugin]         Unloads and then loads a plugin into " + botName + "\n" +
                   "broadcast [message]     Broadcasts a message to every server " + botName + " is connected to\n" +
                   "vacuum                  Check the " + botName + " Configuration File for errors\n" +
                   "reconnect               Attempts to disconnect and reconnect to Discord\n" +
                   "guilds                  Lists guilds " + botName + " knows about\n" +
                   "ginfo [guildid]         Shows information about a guild\n" +
                   "ginfom [guildid]        Shows members inside a guild\n" +
                   "ginfoc [guildid]        Shows channels inside a guild\n" +
                   "ginfob [guildid]        Shows bans of a guild\n" +
                   "cinfo [channelid]       Finds a channel by its ID\n" +
                   "exit                    Exits " + botName + "";
        log(help, logType.info);
    } else if (lLine == "exit") {
        shutdown();
    } else if (lLine == "loadunenc") {
        log("Usage: loadunenc [filename]", logType.critical);
    } else if (lLine.startsWith("loadunenc ")) {
        var file = line.substr(10);
        try {
            var json = fs.readFileSync(file, "utf8");
            var object = JSON.parse(json);
            if (object != null) {
                settings = object;
                fs.unlink(file);
                log("Settings loaded successfully, and the file has been deleted from disk. Please use the vacuum command now.", logType.good);
            }
        } catch (err) {
            log("Couldn't load settings", logType.critical);
        }
    } else if (lLine == "dumpsettings") {
        log(JSON.stringify(settings, null, 4), logType.info);
    } else if (lLine.startsWith("unload ")) {
        unloadPlugin(line.substr(7));
        log("Plugin " + line.substr(7) + " unloaded.", logType.good);
    } else if (lLine == "unload") {
        log("Usage: unload [filename]", logType.critical);
    } else if (lLine.startsWith("load ")) {
        if (loadPlugin(line.substr(5))) {
            log("Plugin " + line.substr(5) + " loaded.", logType.good);
        }
    } else if (lLine == "load") {
        log("Usage: load [filename]", logType.critical);
    } else if (lLine.startsWith("reload ")) {
        unloadPlugin(line.substr(7));
        log("Plugin " + line.substr(7) + " unloaded.", logType.good);
        if (loadPlugin(line.substr(7))) {
            log("Plugin " + line.substr(7) + " loaded.", logType.good);
        }
    } else if (lLine == "reload") {
        log("Usage: reload [filename]", logType.critical);
    } else if (lLine == "save") {
        saveSettings(true);
    } else if (lLine == "reconnect") {
        if (keys.key != null) {
            client.login(keys.key).catch(function() {
                log("Couldn't establish a connection to Discord.", logType.critical);
            });
        } else {
            log("Couldn't find token", logType.critical);
        }
    } else if (lLine.startsWith("broadcast ")) {
        //Broadcast message to each server in either #general or the bot warnings general
        var broadcast = line.substr(10);
        log("Broadcasting message: " + broadcast, logType.info);

        //Iterate over each server
        for (key in settings.guilds) {
            var guildSetting = settings.guilds[key];
            var guild = client.guilds.get(key);

            if (guildSetting != null) {
                var channel = null;
                if (guildSetting.botWarnings != null) {
                    if (guild != null) {
                        channel = guild.channels.get(guildSetting.botWarnings);
                    }
                }

                if (channel == null && guild != null && guild.channels.size > 0) {
                    //channel = guild.defaultChannel;
                    channel = guild.channels.array()[0];
                }

                if (channel != null) {
                    channel.send("SERVICE ANNOUNCEMENT: " + broadcast);
                }
            }
        }
        log("Broadcasting message complete", logType.good);
    } else if (lLine == "broadcast") {
        log("Usage: broadcast message", logType.critical);
    } else if (lLine == "vacuum") {
        vacuumSettings();
    } else if (lLine.startsWith("cinfo ")) {
        var channelId = line.substr(6);
        var channel = client.channels.get(channelId);
        if (channel == null) {
            log("Unknown channel.", logType.info);
        } else {
            var info = "Information for channel " + channelId + ":\n" +
                       "Name: " + channel.name + "\n" +
                       "Guild: " + channel.guild.name + " [" + channel.guild.id + "]";
            log(info, logType.info);
        }
    } else if (lLine == "cinfo") {
        log("Usage: cinfo [channelid]", logType.critical);
    } else if (lLine == "guilds") {
        var response = "Guilds " + botName + " is connected to:";

        for ([id, guild] of client.guilds) {
            response += "\n" + guild.id + "  " + guild.name + "";
        }

        log(response, logType.info);
    } else if (lLine.startsWith("ginfo ")) {
        var guildLine = line.substr(6);
        var guild = client.guilds.get(guildLine);
        if (guild == null) {
            log("Unknown guild.", logType.info);
        } else {
            var info = "Information for guild " + guildLine + ":\n" +
                       "Name: " + guild.name + "\n" +
                       "Owner: " + memberLine(guild.owner) + "\n" +
                       "Members: " + parseInt(guild.memberCount) + "\n" +
                       "Channels: " + parseInt(guild.channels.size);
            log(info, logType.info);
        }
    } else if (lLine.startsWith("ginfom ")) {
        var guildLine = line.substr(7);
        var guild = client.guilds.get(guildLine);
        if (guild == null) {
            log("Unknown guild.", logType.info);
        } else {
            var info = "Information for guild " + guildLine + ":\n" +
                       "Members: " + parseInt(guild.memberCount);

            for ([id, member] of guild.members) {
                info += "\n" + memberLine(member);
            }

            log(info, logType.info);
        }
    } else if (lLine.startsWith("ginfoc ")) {
        var guildLine = line.substr(7);
        var guild = client.guilds.get(guildLine);
        if (guild == null) {
            log("Unknown guild.", logType.info);
        } else {
            var info = "Information for guild " + guildLine + ":\n" +
                       "Members: " + parseInt(guild.channels.size);

            for ([id, channel] of guild.channels) {
                info += "\n" + channel.id + " " + (channel.type == "text" ? "#" : " ") + channel.name;
            }

            log(info, logType.info);
        }
    } else if (lLine.startsWith("ginfob ")) {
        var guildLine = line.substr(7);
        var guild = client.guilds.get(guildLine);
        if (guild == null) {
            log("Unknown guild.", logType.info);
        } else {
            guild.fetchBans().then(function(bans) {
                var info = "Information for guild " + guildLine + ":\n" +
                        "Bans: " + parseInt(bans.size);

                for ([id, user] of bans) {
                    info += "\n" + user.id + " " + user.username + "#" + user.discriminator;
                }

                log(info, logType.info);
            }).catch(function() {
                log("Couldn't fetch bans for that guild.", logType.critical);
            });
        }
    } else if (lLine.startsWith("send ")) {
        var args = line.substr(5);

        var split = args.indexOf(" ");
        if (split == -1) {
            log("Usage: send [channelid] [message]", logType.critical);
        } else {
            var message = args.substr(split + 1);
            var channel = args.substr(0, split);

            var dChannel = client.channels.get(channel);
            if (dChannel == null) {
                log("Couldn't find that channel.", logType.critical);
            } else {
                dChannel.send(message);
                log("Sent.", logType.good);
            }
        }
    } else if (lLine == "send") {
        log("Usage: send [channelid] [message]", logType.critical);
    } else if (lLine == "ginfo") {
        log("Usage: ginfo [guildid]", logType.critical);
    } else {
        log("Unknown command. For help, type \"help\" into the console.", logType.critical);
    }
}

textBox.on("submit", function() {
    //Input received!
    var line = textBox.getText().substr(2);
    hideTextBox();

    processConsoleInput(line);
});

textBox.key('backspace', function() {
    var line = textBox.getText();
    if (!line.startsWith("> ")) {
        if (line == ">") {
            line = "> ";
        } else if (line.startsWith(" ")) {
            line = "> " + line.substring(1);
        } else {
            line = "> " + line;
        }
        textBox.setValue(line);
    }
});

textBox.key('tab', function() {
    //Autocomplete!

    var line = textBox.getText().substr(2, textBox.getText().length - 6);
    textBox.setValue("> " + line);
    var lLine = line.toLowerCase();

    if (lLine.startsWith("ginfo ")) {
        var guildLine = line.substr(6);
        var guilds = [];
        for ([id, guild] of client.guilds) {
            var id = guild.id;
            if (id.startsWith(guildLine)) {
                guilds.push(guild.id);
            }
        }

        if (guilds.length == 1) {
            textBox.setValue("> ginfo " + guilds[0]);
        } else if (guilds.length == 0) {
            log("No results.", logType.info)
        } else {
            var acOutput = "";
            for (guild of guilds) {
                acOutput += guild + " ";
            }
            log(acOutput, logType.info);
        }
    } else if (lLine.startsWith("ginfom ")) {
        var guildLine = line.substr(7);
        var guilds = [];
        for ([id, guild] of client.guilds) {
            var id = guild.id;
            if (id.startsWith(guildLine)) {
                guilds.push(guild.id);
            }
        }

        if (guilds.length == 1) {
            textBox.setValue("> ginfom " + guilds[0]);
        } else if (guilds.length == 0) {
            log("No results.", logType.info)
        } else {
            var acOutput = "";
            for (guild of guilds) {
                acOutput += guild + " ";
            }
            log(acOutput, logType.info);
        }
    } else if (lLine.startsWith("ginfoc ")) {
        var guildLine = line.substr(7);
        var guilds = [];
        for ([id, guild] of client.guilds) {
            var id = guild.id;
            if (id.startsWith(guildLine)) {
                guilds.push(guild.id);
            }
        }

        if (guilds.length == 1) {
            textBox.setValue("> ginfoc " + guilds[0]);
        } else if (guilds.length == 0) {
            log("No results.", logType.info)
        } else {
            var acOutput = "";
            for (guild of guilds) {
                acOutput += guild + " ";
            }
            log(acOutput, logType.info);
        }
    } else if (lLine.startsWith("ginfob ")) {
        var guildLine = line.substr(7);
        var guilds = [];
        for ([id, guild] of client.guilds) {
            var id = guild.id;
            if (id.startsWith(guildLine)) {
                guilds.push(guild.id);
            }
        }

        if (guilds.length == 1) {
            textBox.setValue("> ginfob " + guilds[0]);
        } else if (guilds.length == 0) {
            log("No results.", logType.info)
        } else {
            var acOutput = "";
            for (guild of guilds) {
                acOutput += guild + " ";
            }
            log(acOutput, logType.info);
        }
    } else if (lLine.startsWith("send ")) {
        var channelLine = line.substr(5);
        if (channelLine.indexOf(" ") == -1) {
            var channels = [];
            for ([id, channel] of client.channels) {
                var id = channel.id;
                if (id.startsWith(channelLine)) {
                    channels.push(channel.id);
                }
            }

            if (channels.length == 1) {
                textBox.setValue("> send " + channels[0] + " ");
            } else if (channels.length == 0) {
                log("No results.", logType.info)
            } else {
                var acOutput = "";
                for (channel of channels) {
                    acOutput += channel + " ";
                }
                log(acOutput, logType.info);
            }
        }
    } else if (lLine.startsWith("cinfo ")) {
        var channelLine = line.substr(6);
        if (channelLine.indexOf(" ") == -1) {
            var channels = [];
            for ([id, channel] of client.channels) {
                var id = channel.id;
                if (id.startsWith(channelLine)) {
                    channels.push(channel.id);
                }
            }

            if (channels.length == 1) {
                textBox.setValue("> cinfo " + channels[0]);
            } else if (channels.length == 0) {
                log("No results.", logType.info)
            } else {
                var acOutput = "";
                for (channel of channels) {
                    acOutput += channel + " ";
                }
                log(acOutput, logType.info);
            }
        }
    } else {
        log("Command autocompletion coming soon.", logType.info);
        //TODO: Command autocompletion
    }
});

global.extractUser = function(words, guild = null) {
    let foundUsers = [];
    for (let i = 1; i < words.length + 1; i++) {
        for (let j = 0; j < words.length - i + 1; j++) {
            let query = words.slice(j, j + i).join(" ");

            let gen = function(user) {
                let newWords = Array.from(words);
                newWords.splice(j, i);
                return {
                    user: user,
                    pos: j,
                    words: newWords
                };
            }

            for (let [snowflake, user] of client.users) {
                if (user.username.toLowerCase() == query.toLowerCase()) {
                    foundUsers.unshift(gen(user));
                } else if (user.username.toLowerCase().indexOf(query.toLowerCase()) != -1) {
                    foundUsers.push(gen(user));
                } else if ((user.username.toLowerCase() + "#" + user.discriminator).indexOf(query.toLowerCase()) != -1) {
                    foundUsers.push(gen(user));
                } else if (user.id == query) {
                    foundUsers.unshift(gen(user));
                }
            }
        
            if (guild != null) {
                var guildSpecificResults = [];
                for (let [snowflake, member] of guild.members) {
                    if (member.nickname != null) {
                        if (member.nickname.toLowerCase() == query.toLowerCase()) {
                            guildSpecificResults.unshift(gen(member.user));
                        } else if (member.nickname.toLowerCase().indexOf(query.toLowerCase()) != -1) {
                            guildSpecificResults.push(gen(member.user));
                        }
                    }
                }
        
                var pop = guildSpecificResults.pop();
                while (pop != undefined) {
                    foundUsers.unshift(pop);
                    pop = guildSpecificResults.pop();
                }
            }
        }
    }

    //Remove Duplicates
    let knownUsers = [];
    for (let i = 0; i < foundUsers.length; i++) {
        let u = foundUsers[i];
        if (knownUsers.indexOf(u.user.id) == -1) {
            knownUsers.push(u.user.id);
        } else {
            foundUsers.splice(i, 1);
            i--;
        }
    }

    return foundUsers;
}

global.filterLeastIndex = function(foundUsers) {
    let leastIndex = [];

    if (foundUsers.length == 0) return [];

    let leastPos = foundUsers[0].pos;
    for (let index in foundUsers) {
        let user = foundUsers[index];
        if (leastPos > user.pos) leastPos = user.pos;
    }

    for (let index in foundUsers) {
        let user = foundUsers[index];
        if (user.pos == leastPos) leastIndex.push(user);
    }

    return leastIndex;
}

global.filterGuild = function(foundUsers, guild) {
    let guilds = [];

    if (foundUsers.length == 0) return [];

    for (let index in foundUsers) {
        let user = foundUsers[index];
        if (guild.members.has(user.user.id)) guilds.push(user);
    }

    return guilds;
}

global.toSentenceCase = function(string) {
    let words = string.split(" ");
    
    let correctString = [];
    let lastFullStop = true;
    for (let index in words) {
        let word = words[index];

        if (word == "") {
            correctString.push("");
            continue;
        }

        if (lastFullStop) {
            word = word[0].toUpperCase() + word.substr(1);
            lastFullStop = false;
        }
        if (word.endsWith(".")) lastFullStop = true;
        correctString.push(word);
    }
    return correctString.join(" ");
}

global.isAffirmative = function(string) {
    let affirmativeWords = [
        "yes",
        "ok",
        "ye",
        "yep",
        "yeah",
        "please",
        "y",
        "affirmative",
        "positive",
        "mhm",
        "okay",
        "absolutely",
        "uh huh"
    ];
    string = string.toLowerCase();
    if (affirmativeWords.indexOf(string) != -1) {
        return true;
    }
    return false;
}

global.isNegative = function(string) {
    let negativeWords = [
        "no",
        "cancel",
        "n",
        "nah",
        "nope",
        "nop",
        "negative",
        "nuh uh",
        "not right now",
        "not yet",
        "not today"
    ];
    string = string.toLowerCase();
    if (negativeWords.indexOf(string) != -1) {
        return true;
    }
    return false;
}

function shutdown() {
    process.exit(0);
}

function newGuild(guild) {
    if (settings.guilds[guild.id] == null) {
        settings.guilds[guild.id] = {
            prefix: "aa:"
        };
    }
}

function removeGuild(guild) {
    settings.guilds[guild.id] = null;
}

function processMessage(message) {
    if (message.author.bot) return;
    if (message.guild == null) {
        //This is a DM
    } else {
        if (capture[message.guild.id] != null && capture[message.guild.id][message.author.id] != null) {
            capture[message.guild.id][message.author.id].function(message);
        } else if (message.content.startsWith(settings.guilds[message.guild.id].prefix)) {
            processCommand(message.content.substr(settings.guilds[message.guild.id].prefix.length), message);
        } else if (message.content.startsWith(message.guild.me.toString())) {
            processCommand(message.content.substr(message.guild.me.toString().length).trim(), message);
        }
    }
}

function clientError() {

}

function readyOnce() {
    log("Now connected to Discord.", logType.good);
    log("Checking if configuration file exists...");

    if (!fs.existsSync("settings.json")) {
        log(botName + " configuration file does not exist. Creating now.", logType.warning);
        global.settings = {
            guilds: {

            },
            users: {

            },
            generalConfiguration: {

            }
        };

        //Load in all guilds
        client.guilds.forEach(newGuild);
        
        //Save
        saveSettings(true);
    } else {
        log("Loading " + botName + " configuration file...", logType.info);

        try {
            var file = fs.readFileSync("settings.json", "utf8");

            loadSettingsFile(file);
        } catch (err) {
            try {
                //Try loading the prewrite file
                var file = fs.readFileSync("settings.prewrite.json", "utf8");
                loadSettingsFile(file);

                log("Settings file was corrupted, but prewrite file is good. Using prewrite file.", logType.warning);

                fs.createReadStream('settings.json').pipe(fs.createWriteStream('.settings-backup.json'));
                fs.createReadStream('settings.prewrite.json').pipe(fs.createWriteStream('settings.json'));
            } catch (err2) {
                log("Either the settings file is corrupted, or the encryption key is incorrect. " + botName + " cannot start.", logType.critical);
                return;
            }
        }
    }

    if (vacuumSettings()) {
        log(botName + " Configuration loaded.", logType.good);
    } else {
        log(botName + " Configuration contains errors.", logType.critical);
    }

    //commandEmitter.emit('startup');

    client.on('message', processMessage);
    client.on('guildCreate', newGuild);
    client.on('guildDelete', removeGuild);
    //client.on('messageDelete', messageDeleted);
    //client.on('messageUpdate', messageUpdated);
    //client.on('guildMemberAdd', memberAdd);
    //client.on('guildMemberRemove', memberRemove);
    //client.on('guildUnavailable', guildUnavailable);
    //client.on('guildMemberUpdate', guildMemberUpdate);
    //client.on('userUpdate', userUpdate);
    //client.on('ready', readyAgain);
    //client.on('resume', resume);
    //client.on('guildBanAdd', banAdd);
    client.on('error', clientError);

    setTimeout(saveSettings, 30000);

    log(botName + " " + botVersion + " - locked and loaded!", logType.good);

    setInterval(function() {
        titleBox.content = botName + " " + botVersion + " Console  │  Uptime: " + moment.duration(client.uptime).humanize() +
        "  │  Guilds: " + parseInt(client.guilds.size);
        renderScreen();
    }, 1000);

    //postDBL();
}

function loadSettingsFile(file) {
    if (file.startsWith("{")) {
        //File unencrypted
        var intermediarySettings = JSON.parse(file);

        log("settings.js file is unencrypted. Creating a backup copy...", logType.info);
        fs.createReadStream('settings.json').pipe(fs.createWriteStream('.settings-beforeEncrypt.json'));

        log("settings.js file will be encrypted on next save.", logType.warning);

        global.settings = intermediarySettings;
    } else if (!fs.existsSync("iv.txt")) {
        //File encrypted
        log("Decrypting the settings.js file...", logType.info);

        var buf = fs.readFileSync("settings.json");
        var cipher = crypto.createDecipher(cipherAlg, keys.settingsKey);
        var settingsJson = Buffer.concat([cipher.update(buf), cipher.final()]);
        settingsJson = settingsJson.toString("utf8");

        global.settings = JSON.parse(settingsJson);
        log("settings.js encryption will be upgraded on next save.", logType.warning);
    } else {
        //File encrypted with IV
        log("Decrypting the settings.js file...", logType.info);

        let iv = fs.readFileSync("iv.txt");

        var buf = fs.readFileSync("settings.json");
        var cipher = crypto.createDecipheriv(cipherAlg, settingsKey, iv);
        var settingsJson = Buffer.concat([cipher.update(buf), cipher.final()]);
        settingsJson = settingsJson.toString("utf8");

        global.settings = JSON.parse(settingsJson);
    }
}

function saveSettings(showOkMessage = false) {
    log("Saving settings...");
    var contents = JSON.stringify(settings, null, 4);

    //Encrypt the contents
    let iv = Buffer.from(crypto.randomBytes(16));

    var cipher = crypto.createCipheriv(cipherAlg, settingsKey, iv);
    var settingsJson = Buffer.concat([
        cipher.update(Buffer.from(contents, "utf8")),
        cipher.final()
    ]);

    //Write to secondary file first
    fs.writeFile("settings.prewrite.json", settingsJson, "utf8", function(error) {
        if (error) {
            log("Settings couldn't be saved", logType.critical);
            setTimeout(saveSettings, 30000);
        } else {
            fs.writeFile("iv.txt", iv, "utf8", function(error) {
                if (error) {
                    log("IV couldn't be saved. Aborting save of normal settings file.", logType.critical);
                } else {
                    fs.writeFile("settings.json", settingsJson, "utf8", function(error) {
                        if (error) {
                            log("Settings couldn't be saved, but the prewrite settings were saved successfully.", logType.critical);
                        } else {
                            fs.unlinkSync("settings.prewrite.json");

                            if (showOkMessage) {
                                log("Settings saved!", logType.good);
                            } else {
                                log("Settings saved!");
                            }
                        }

                        setTimeout(saveSettings, 30000);
                    });
                }
            })
        }
    });
}

function vacuumSettings() {
    if (process.argv.indexOf("--novacuum") == -1) {
        log("Checking the " + botName + " Configuration file...", logType.info);
        if (fs.existsSync('settings.json')) {
            fs.createReadStream('settings.json').pipe(fs.createWriteStream('.settings-backup.json'));
        }

        var changesMade = false;
        var error = false;

        //Check settings file objects
        if (!settings.hasOwnProperty("guilds")) {
            log("Settings does not contain guilds.", logType.critical);
            error = true;
        }

        if (!settings.hasOwnProperty("users")) {
            log("Settings does not contain users.", logType.critical);
            error = true;
        }

        if (!settings.hasOwnProperty("generalConfiguration")) {
            log("Settings does not contain general configuration.", logType.critical);
            error = true;
        }

        if (error) {
            //Quit
            log(botName + " Configuration contains errors.", logType.critical);
            log("From here, you can either\n- Attempt to fix the " + botName + " configuration file, settings.json\n- Delete the " + botName + " configuration file and start again.", logType.info);
            log(botName + " Configuration is corrupted. " + botName + " cannot continue running. Exiting now.", logType.critical);
            debugger;
            process.exit(1);
        }

        //Check that each guild still exists
        var availableGuilds = [];
        for (let [id, guild] of client.guilds) {
            log("Checking Discord guild " + guild.id);
            availableGuilds.push(guild.id);

            if (!settings.guilds.hasOwnProperty(guild.id)) {
                //Add guild to database
                changesMade = true;
                log("Adding guild " + guild.id + " to the database.", logType.info);
                newGuild(guild);
            }
        }

        //Iterate over all guilds in settings
        for (key in settings.guilds) {
            log("Checking internal guild " + key);
            if (!availableGuilds.includes(key)) {
                //Delete guild from database
                changesMade = true;
                log("Deleting guild " + key + " as this guild is no longer recognised.", logType.info);
                settings.guilds[key] = null;
                delete settings.guilds[key];
            }
        }

        if (changesMade) {
            log(botName + " Configuration was checked and changes were made. No other actions need to be taken.", logType.warning);
            log("Old settings backed up as .settings-backup.json", logType.info);
        } else {
            if (fs.existsSync('.settings-backup.json')) {
                fs.unlinkSync(".settings-backup.json");
            }
            log(botName + " Configuration checked. No changes have been made", logType.good);
        }
        return true;
    } else {
        log("--novacuum argument was passed. Vacuuming has been disabled.", logType.info);
        return false;
    }
}

client.once('ready', readyOnce);

client.login(keys.key).then(function() {
    log(botName + " is now logged in.");
}).catch(function() {
    log(botName + " couldn't be logged in.", logType.critical);
});