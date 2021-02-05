require('dotenv').config()

const Streamer = require("musix-streamer");
const ytdl = require("ytdl-core");
const Speaker = require("speaker");
var async = require('async');
const tmi = require('tmi.js');
const EventEmitter = require('events');

const stopsong = new EventEmitter();

var songlists=[];

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


async function playmusic(lagunya){
	let promise = new Promise((resolve, reject) => 
	{
		var speaker = new Speaker({
			channels: 2,
			bitDepth: 16,
			sampleRate: 44100
		});


		var streamer = new Streamer.default();
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

function waitqueue(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}



async function playqueue(){
	// await playmusic("https://www.youtube.com/watch?v=__1SjDrSMik");
	while(true)
	{
		await waitqueue(1000);
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

songlists.push("https://www.youtube.com/watch?v=BHsLOoXfqtY")
playqueue()


client.on('message', (channel, tags, message, self) => {
	// console.log(`${tags['display-name']}: ${message}`);
	var regexConst = new RegExp('^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$');

	if(message.toLowerCase() === "hello")
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
