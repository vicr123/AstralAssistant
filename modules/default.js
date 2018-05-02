const Discord = require("discord.js");
const wiki = require("wikijs").default;

exports.default = async function(words, message) {
    let loadMessage = await message.channel.send(getEmoji("loader") + " Looking online for information...");

    let data = await wiki().search(words.join(" "));
    if (data.results.length > 0) {
        let page = await wiki().page(data.results[0]);
        let summary = await page.summary();
        let info = await page.fullInfo();
        let image = await page.mainImage();

        if (summary.length > 1000) {
            summary = summary.substr(0, 1000) + "...";
        }
        
        let embed = new Discord.MessageEmbed();
        embed.setTitle(data.results[0]);
        embed.addField("Summary", summary);
        embed.setThumbnail(image);

        //Add fields where applicable
        if (info.general != null) {
            if (info.general.birthDate != null) embed.addField("Date of Birth", info.general.birthDate.date.toDateString() + " (" + info.general.birthDate.age + " years old)", true);
            if (info.general.deathDate != null) embed.addField("Died", info.general.deathDate.date.toDateString() + " (at " + info.general.deathDate.age + " years old)", true);
            if (info.general.spouse != null) embed.addField("Spouse", info.general.spouse, true);
        } else if (info.community != null) {
            if (info.community.founder != null) embed.addField("Founder", info.community.founder, true);
            if (info.community.nonProfitSlogan != null) embed.addField("Slogan", info.community.nonProfitSlogan, true);
        }

        loadMessage.edit("Here's some information I got from Wikipedia", {embed: embed});
        return;
    }

    loadMessage.edit("No information was found for that query.");
    
}