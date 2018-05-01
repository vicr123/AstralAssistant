const Discord = require('discord.js');
const moment = require('moment');
const YQL = require('yql');
const Canvas = require('canvas');
const fs = require('fs');
var keys = require('../keys.js');

function extractLocation(words) {
    if (words.indexOf("at") != -1) {
        return words.slice(words.indexOf("at") + 1).join(" ");
    }
    if (words.indexOf("in") != -1) {
        return words.slice(words.indexOf("in") + 1).join(" ");
    }
    return words.join(" ");
}

exports.weather = function(words, message) {
    if (words.indexOf("weather") != -1) {
        words.splice(words.indexOf("weather"), 1);
    }
    if (words.indexOf("forecast") != -1) {
        words.splice(words.indexOf("forecast"), 1);
    }

    let location = extractLocation(words);
    sendCurrentWeather(message, location, "location", "c");
}

let sunnyImage, cloudyImage, thunderImage, rainImage, windImage, fogImage, humidImage, pressureImage, sunriseImage, sunsetImage, compassImage, snowImage, rainsnowImage;

function prepareImages() {
    sunnyImage = new Canvas.Image();
    fs.readFile("./modules/images/sunny.png", function(err, data) {
        sunnyImage.src = data;
    });

    cloudyImage = new Canvas.Image();
    fs.readFile("./modules/images/cloudy.png", function(err, data) {
        cloudyImage.src = data;
    });


    thunderImage = new Canvas.Image();
    fs.readFile("./modules/images/thunder.png", function(err, data) {
        thunderImage.src = data;
    });

    rainImage = new Canvas.Image();
    fs.readFile("./modules/images/rain.png", function(err, data) {
        rainImage.src = data;
    });

    windImage = new Canvas.Image();
    fs.readFile("./modules/images/wind.png", function(err, data) {
        windImage.src = data;
    });

    fogImage = new Canvas.Image();
    fs.readFile("./modules/images/fog.png", function(err, data) {
        fogImage.src = data;
    });

    pressureImage = new Canvas.Image();
    fs.readFile("./modules/images/pressure.png", function(err, data) {
        pressureImage.src = data;
    });

    humidImage = new Canvas.Image();
    fs.readFile("./modules/images/humidity.png", function(err, data) {
        humidImage.src = data;
    });

    sunsetImage = new Canvas.Image();
    fs.readFile("./modules/images/sunset.png", function(err, data) {
        sunsetImage.src = data;
    });

    sunriseImage = new Canvas.Image();
    fs.readFile("./modules/images/sunrise.png", function(err, data) {
        sunriseImage.src = data;
    });

    compassImage = new Canvas.Image();
    fs.readFile("./modules/images/compass.png", function(err, data) {
        compassImage.src = data;
    });

    snowImage = new Canvas.Image();
    fs.readFile("./modules/images/snow.png", function(err, data) {
        snowImage.src = data;
    });

    rainsnowImage = new Canvas.Image();
    fs.readFile("./modules/images/rainsnow.png", function(err, data) {
        rainsnowImage.src = data;
    });
}
prepareImages();

function getDataFromCode(code, ctx, isDay = true) {
    let retval = {}
    
    switch (code) {
        case 23:
        case 31:
        case 32:
        case 33:
        case 34:
            //Clear
            //retval.gradient.addColorStop(0, "rgba(0, 200, 255, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 255, 0)");
            retval.gradient = "rgb(120, 200, 255)";
            retval.secondary = "rgb(50, 180, 255)";
            retval.image = sunnyImage;
            break;
        case 1: 
        case 2:
        case 7:
        case 17:
        case 18:
        case 22:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
        case 30:
        case 35:
        case 44:
            //Cloudy
            //retval.gradient.addColorStop(0, "rgba(100, 100, 100, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = cloudyImage;
            break;
        case 6:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
            //Rainy
            //retval.gradient.addColorStop(0, "rgba(100, 100, 100, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = rainImage;
            break;
        case 0:
        case 24:
            //Windy
            //retval.gradient.addColorStop(0, "rgba(100, 100, 100, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = windImage;
            break;
        case 19:
        case 20:
        case 21:
        case 22:
            //Fog
            //retval.gradient.addColorStop(0, "rgba(100, 100, 100, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = windImage;
            break;
        case 36:
            //Hot
            //retval.gradient.addColorStop(0, "rgba(255, 100, 0, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(255, 100, 0)";
            retval.secondary = "rgb(200, 100, 0)";
            retval.image = sunnyImage;
            break;
        case 3:
        case 4:
        case 37:
        case 38:
        case 39:
        case 40:
        case 45:
        case 47:
            //Thunder
            //retval.gradient.addColorStop(0, "rgba(100, 100, 100, 0.5)");
            //retval.gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = thunderImage;
            break;
        case 13:
        case 14:
        case 15:
        case 16:
        case 41:
        case 43:
            //Snow
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = snowImage;
            break;
        case 5:
        case 42:
        case 46:
            //Rain + Snow
            retval.gradient = "rgb(200, 200, 200)";
            retval.secondary = "rgb(170, 170, 170)";
            retval.image = rainsnowImage;
            break;
    }
    return retval;
}

function sendCurrentWeather(message, location, type, unit = "c", user = "") {
    message.channel.send(getEmoji("loader") + " Preparing the weather...").then(function(messageToEdit) {
        let query;

        if (type == "location") {
            query = new YQL("select * from weather.forecast where woeid in (select woeid from geo.places(1) where text=\"" + location + "\") and u=\"" + unit + "\"");
        } else if (type == "id") {
            query = new YQL("select * from weather.forecast where woeid=" + location + " and u=\"" + unit + "\"");
        }
        
        query.exec(function(err, data) {
            try {
                if (err) {
                    messageToEdit.edit("That didn't work");
                } else {
                    if (data.query.results == null) {
                        var embed = new Discord.RichEmbed;
                        embed.setTitle(":thunder_cloud_rain: Weather Error");
                        embed.setDescription("AstralMod couldn't retrieve weather.");
                        embed.setColor("#FF0000");
                        embed.addField("Details", "That city wasn't found");
                        embed.addField("Try this", "AstralMod has just been updated. If you're trying to retrieve your own weather, try resetting your location with `" + prefix + "setloc`.");

                        messageToEdit.edit(embed)
                        return;
                    }

                    var canvas = new Canvas(500, 410);
                    var ctx = canvas.getContext('2d');
                    let display = getDataFromCode(parseInt(data.query.results.channel.item.condition.code), ctx);

                    let tempUnit = "°" + data.query.results.channel.units.temperature;
                    let speedUnit = data.query.results.channel.units.speed;
                    let pressureUnit = data.query.results.channel.units.pressure;
                    
                    ctx.fillStyle = display.gradient;
                    ctx.fillRect(0, 0, 350, 410);

                    ctx.fillStyle = display.secondary;
                    ctx.fillRect(350, 0, 150, 410);

                    ctx.font = "20px Contemporary";
                    ctx.fillStyle = "black";

                    let currentWeatherText = "Current Weather";
                    if (user != "") {
                        currentWeatherText += " @ " + user;
                    }

                    let currentWeatherWidth = ctx.measureText(currentWeatherText);
                    if (currentWeatherWidth.width > 325) {
                        let textCanvas = new Canvas(currentWeatherWidth.width, 30);
                        let txtCtx = textCanvas.getContext('2d');
                        txtCtx.font = "20px Contemporary";
                        txtCtx.fillStyle = "black";
                        txtCtx.fillText(currentWeatherText, 0, 20);

                        //txtCtx.scale(250 / currentWeatherWidth.width, 0);
                        //txtCtx.setTransform(0.5, 0, 0, 1, 0, 0);
                        ctx.drawImage(textCanvas, 10, 10, 325, 30);
                    } else {
                        ctx.fillText(currentWeatherText, 10, 30, 50);
                    }

                    //Image goes between 100-200px y
                    ctx.drawImage(display.image, 100, 60);

                    ctx.font = "bold 20px Contemporary";
                    ctx.fillStyle = "black";
                    let cityWidth = ctx.measureText(data.query.results.channel.location.city);
                    ctx.fillText(data.query.results.channel.location.city, 175 - cityWidth.width / 2, 240);

                    ctx.font = "40px Contemporary";
                    let conditionWidth = ctx.measureText(data.query.results.channel.item.condition.text);
                    if (conditionWidth.width > 325) {
                        let textCanvas = new Canvas(conditionWidth.width, 50);
                        let txtCtx = textCanvas.getContext('2d');
                        txtCtx.font = "light 40px Contemporary";
                        txtCtx.fillStyle = "black";
                        txtCtx.fillText(data.query.results.channel.item.condition.text, 0, 40);

                        ctx.drawImage(textCanvas, 13, 240, 325, 50);
                    } else {
                        ctx.fillText(data.query.results.channel.item.condition.text, 175 - conditionWidth.width / 2, 280);
                    }

                    ctx.font = "30px Contemporary";
                    let currentTemp = data.query.results.channel.item.condition.temp + tempUnit;
                    let tempWidth = ctx.measureText(currentTemp);
                    ctx.fillText(currentTemp, 175 - tempWidth.width / 2, 315);

                    //Draw wind info
                    ctx.drawImage(windImage, 50, 330, 20, 20);
                    ctx.font = "14px Contemporary";
                    let currentWind = data.query.results.channel.wind.speed + " " + speedUnit;
                    let windWidth = ctx.measureText(currentWind);
                    ctx.fillText(currentWind, 77, 345);

                    //Draw humidity info
                    ctx.drawImage(humidImage, 50, 355, 20, 20);
                    let currentHumid = data.query.results.channel.atmosphere.humidity + "%";
                    ctx.fillText(currentHumid, 77, 370);

                    //Draw pressure info
                    ctx.drawImage(pressureImage, 50, 380, 20, 20);
                    let currentPressure = data.query.results.channel.atmosphere.pressure + " " + pressureUnit;
                    ctx.fillText(currentPressure, 77, 395);

                    //Draw wind speed
                    ctx.drawImage(compassImage, 200, 330, 20, 20);
                    let compass = parseInt(data.query.results.channel.wind.direction);
                    let cardinal;
                    if (compass < 22) {
                        cardinal = "N";
                    } else if (compass < 67) {
                        cardinal = "NE";
                    } else if (compass < 112) {
                        cardinal = "E";
                    } else if (compass < 157) {
                        cardinal = "SE";
                    } else if (compass < 202) {
                        cardinal = "S";
                    } else if (compass < 247) {
                        cardinal = "SW";
                    } else if (compass < 292) {
                        cardinal = "W";
                    } else if (compass < 337) {
                        cardinal = "NW";
                    } else {
                        cardinal = "N";
                    }
                    ctx.fillText(compass + "° (" + cardinal + ")", 227, 345);

                    //Draw sunrise info
                    ctx.drawImage(sunriseImage, 200, 355, 20, 20);
                    let sunrise = data.query.results.channel.astronomy.sunrise;
                    if (sunrise.split(":").pop().split(" ")[0].split("").length < 2) sunrise = sunrise.split(":")[0] + ":0" + sunrise.split(":")[1];
                    ctx.fillText(sunrise, 227, 370);

                    //Draw sunset info
                    ctx.drawImage(sunsetImage, 200, 380, 20, 20);
                    let sunset = data.query.results.channel.astronomy.sunset;
                    if (sunset.split(":").pop().split(" ")[0].split("").length < 2) sunset = sunset.split(":")[0] + ":0" + sunset.split(":")[1];
                    ctx.fillText(sunset, 227, 395);

                    ctx.beginPath();
                    ctx.moveTo(350, 0);
                    ctx.lineTo(350, 410);
                    ctx.stroke();

                    //350 - 500x for upcoming weather data
                    //82px per data pane

                    let current = 0;
                    for (let key in data.query.results.channel.item.forecast) {
                        current++;
                        if (current > 5) {
                            break;
                        }
                        let day = data.query.results.channel.item.forecast[key];

                        ctx.font = "20px Contemporary";

                        let dayText = day.day.toUpperCase();
                        if (current == 1) {
                            dayText = "TODAY";
                        }
                        let dayWidth = ctx.measureText(dayText);
                        
                        let y = (current - 1) * 82 + 41 + (dayWidth.width / 2);
                        ctx.rotate(-Math.PI / 2);
                        ctx.fillText(dayText, -y, 372);
                        ctx.rotate(Math.PI / 2);

                        //Draw image
                        let display = getDataFromCode(parseInt(day.code), ctx);
                        ctx.drawImage(display.image, 380, (current - 1) * 82 + 9, 64, 64);

                        //Draw temperatures
                        ctx.fillText(day.high + "°", 450, (current - 1) * 82 + 30);
                        ctx.fillText(day.low + "°", 450, (current - 1) * 82 + 60);

                        ctx.beginPath();
                        ctx.moveTo(350, current * 82);
                        ctx.lineTo(500, current * 82);
                        ctx.stroke();
                    }

                    let e = new Discord.RichEmbed();
                    e.attachFile(new Discord.Attachment(canvas.toBuffer(), "weather.png"))
                    e.setImage("attachment://weather.png");
                    e.setThumbnail("https://poweredby.yahoo.com/white.png");
                    e.setTitle("Weather");
                    e.setURL(data.query.results.channel.link);
                    e.setColor("#00C0FF");
                    /*e.setFooter(getRandom("Feel free to print this",
                                        "Please tear on the perforated line",
                                        "So many degrees...",
                                        "Are the days getting longer?"));*/
                    message.channel.send("Today in " + data.query.results.channel.location.city + ":", {embed: e}).then(function() {
                        messageToEdit.delete();
                    });
                }
            } catch (err) {
                messageToEdit.edit(err.toString() + "\nTry resetting your location with `" + "prefix setloc`");
            }
        });
    });
}