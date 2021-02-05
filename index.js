require('dotenv').config()

const Streamer = require("musix-streamer");
const ytdl = require("ytdl-core");
const Speaker = require("speaker");
const owoify = require('owoify-js').default
var async = require('async');
const tmi = require('tmi.js');
const EventEmitter = require('events');

const stopsong = new EventEmitter();
const regexConst = new RegExp('^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$');

var songlists=[];
var uwutime=true;

console.log("start playback");

const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.BOT_USERNAME,
		password: process.env.BOT_OAUTH
	},
	channels: [ process.env.CHANNEL_NAME ]
});
client.connect();



const streamer = new Streamer.default();


async function playmusic(lagunya){
	let promise = new Promise((resolve, reject) => 
	{
		console.log("aduh")
		var speaker = new Speaker({
			channels: 2,
			bitDepth: 16,
			sampleRate: 44100
		});
		streamer.stream(ytdl(lagunya, { filter: format => format.container === 'mp4' })).pipe(speaker);
		speaker.on('flush', function()
		{
			resolve(true);
		});

		stopsong.on('stop', function(){
			speaker.close()
			resolve(true);
		});
	}
	).catch(e => { console.log(e) });

	let result = await promise;
	return result;

};

function waiting(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function playqueue(){
	// await playmusic("https://www.youtube.com/watch?v=__1SjDrSMik");
	while(true)
	{
		await waiting(1000);
		console.log(songlists.length)
		if(songlists.length>0)
		{
			var cursong = songlists.shift()
			console.log(cursong)
			// if (ytdl.validateURL(cursong))
			// 		{
			// 			console.log("valid")
			// 			console.log(ytdl.getVideoID(cursong))
			// 		}
			// 		else
			// 		{
			// 			console.log("not valid")		
			// 		}
			
			await playmusic(cursong);
			
			// console.log(songlists.length) 
		}
		else
			console.log("queue empty")
	}
}

async function uwucooldown(){
	while(true)
	{
		await waiting(10000);
		if(uwutime === false)
		{
			uwutime=true;
		}
	}
}




// songlists.push("https://www.youtube.com/watch?v=BHsLOoXfqtY")
playqueue()
uwucooldown()


client.on('message', (channel, tags, message, self) => {
	// console.log(`${tags['display-name']}: ${message}`);
	
	if(self)return;

	if(uwutime===true)
	{
		uwutime=false;
		client.say(channel, owoify(message, 'uwu'));
	}

	if(message.toLowerCase() === "!hello")
	{
		client.say(channel, `@${tags.username}, heya!`);
	}
	if(message.toLowerCase() === "stop")
	{
		console.log("someone stopped");
		stopsong.emit('stop');
	}

	if(regexConst.test(message)) 
	{
		// console.log("SBUAIDHBASUIDBSUAI");
		if(ytdl.getURLVideoID(message))
		{
			console.log("VideoID valid");
		}
		else
		{
			console.log("VideoID not valid");		
		}
		if (ytdl.validateURL(message))
		{
			console.log("valid");
			console.log(ytdl.getVideoID(message));
			songlists.push(message);	
		}
		else
		{
			console.log("not valid");		
		}
	}

});
