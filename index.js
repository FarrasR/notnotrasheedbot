require('dotenv').config()

import { Streamer } from "musix-streamer";
import ytdl, { validateURL } from "ytdl-core";
import Speaker from "speaker";
import owoify from 'owoify-js';
import { Client } from 'tmi.js';
import EventEmitter from 'events';
import lineByLine from 'n-readlines';

const stopsong = new EventEmitter();

var playlist = [];
var songlists = [];
var uwutime = true;

const client = new Client({
	options: { 
		debug: true, 
		messagesLogLevel: "info" 
	},
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

const streamer = new Streamer.default();

function addplaylist() {
	let line;
	let lineNumber = 0;

	const liner = new lineByLine('playlist.txt');
	while (line = liner.next()) {
    	playlist.push(line.toString('ascii'));
    	lineNumber++;
	}
}

async function playmusic(lagunya) {
	let promise = new Promise((resolve) => {
		var speaker = new Speaker({
			channels: 2,
			bitDepth: 16,
			sampleRate: 44100
		});

		streamer.stream(ytdl(lagunya, { filter: format => format.container === 'mp4' })).pipe(speaker);
		speaker.on('flush', function() {
			resolve(true);
		});

		stopsong.on('stop', function() {
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

async function playqueue() {
	while(true) {
		await waiting(3000);

		if (songlists.length > 0) {
			var cursong = songlists.shift()

			await playmusic(cursong);
		}
		else {
			console.log("queue empty, playing from playlist")

			if (playlist.length == 0) {
				console.log("playlist empty, please restart app or wait for someone to add to the queue")
			}
			else {
				var cursong = playlist[Math.floor(Math.random() * playlist.length)];
				const index = playlist.indexOf(cursong);

				if (index > -1) {
  					playlist.splice(index, 1);
				}

				await playmusic(cursong);
			}
		}
		//todo make this play rasheed playlist
	}
}

async function uwucooldown() {
	while(true) {
		var waittime = Math.floor(Math.random() * 1800000) + 600000; 
		await waiting(waittime);

		if (!uwutime) {
			uwutime = true;
		}
	}
}



// a60b4d4b-e903-4fa0-bc59-fb4f26d131bf
// songlists.push("https://www.youtube.com/watch?v=BHsLOoXfqtY")
console.log("parsing playlist");
addplaylist()
console.log("parsing done");
playqueue()
uwucooldown()
client.connect();

client.on('chat', (channel, tags, message, self) => {
	if (self) return;

	if (tags["custom-reward-id"] === process.env.SONG_REQUEST_REWARD_ID) {
		if (validateURL(message))
		{
			songlists.push(message);
			client.say(channel, "song added to queue");
		}
		else
		{
			console.log("VideoID not valid");
			client.say(channel, "that is not a valid youtube URL, no refund");
		}

		return;
	}

	if (uwutime)
	{
		uwutime = false;
		client.say(channel, owoify(message, 'uwu'));

		return;
	}


	// if you want to test the bot uncomment this
	// if(message.toLowerCase() === "hello")
	// {
	// 	client.say(channel, `@${tags.username}, heya!`);
	// 	return;
	// }

	if (message.toLowerCase() === "!about") {
		client.say(channel, `im a bot, ask @daiya_o for details`);

		return;
	}

	if (message.toLowerCase() === "!stop") {
		if (tags["username"] === "notrasheed" || tags["username"] === "daiya_o") {
			console.log("someone IMPORTANT stopped");
			client.say(channel, "stopping song");
			stopsong.emit('stop');

			return;
		}
		else {
			client.say(channel, "you have no power here KEKW");

			return;
		}

	}
});
