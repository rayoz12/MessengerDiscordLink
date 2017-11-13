const login = require("facebook-chat-api");
const util = require("util");
const fs = require("fs");
const request = require('request');


const config = require("./data/config.js");

const usersLocation = './data/users.json'
const threadsLocation = './data/threads.json'

const users = JSON.parse(fs.readFileSync(usersLocation, 'utf8'))
const threads = JSON.parse(fs.readFileSync(threadsLocation, 'utf8'))

// Create simple echo bot
//login(config.fbAccount, (err, api) => {
login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);

    api.setOptions({listenEvents: true, selfListen: true, logLevel: "silent"});

	try {
		listen(api)
	}
	catch(e) {
		console.log("fail:", e);
	}

	fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
});

function findUser(userID, api) {
	api.getUserInfo([userID], (err, ret) => {
        if(err) return console.error(err);
		console.log("-------------USER INFO---------------")
		console.log(ret);
		console.log("-------------USER INFO---------------")
		users[userID] = ret[userID];
		fs.writeFileSync(usersLocation, JSON.stringify(users));
    });
}

function findThread(threadID, api) {
	api.getThreadInfo(threadID, (err, ret) => {
		console.log("-------------THREAD INFO---------------")
		console.log(ret);
		console.log("-------------THREAD INFO---------------")
		threads[threadID] = ret;
		fs.writeFileSync(threadsLocation, JSON.stringify(threads));
	});
}

function resolveUserID(userID, api) {
	if (!(userID in users)) { 
		findUser(userID, api);
		return {name: userID};
	}
	else {
		return users[userID]
	}
}
function resolveThreadID(threadID, api) {
	if (!(threadID in threads)) { 
		findThread(threadID, api);
		return {name: threadID};
	}
	else {
		return threads[threadID]
	}
}

function makeDiscordPost(message) {
	request({
		url: config.webhook,
		method: "POST",
		json: {content: message}
	});
}

function listen(api) {
	var stopListening = api.listen((err, event) => {
		if(err) return console.error(err);
		
		try {
			util.inspect(event);
			api.markAsRead(event.threadID, (err) => {
				if(err) console.error(err);
			});

			switch(event.type) {
				case "message":
					if(event.body === '/stop') {
						api.sendMessage("Goodbye…", event.threadID);
						return stopListening();
					}
					//api.sendMessage("TEST BOT: " + event.body, event.threadID);
					
					//check if in group:
					user = resolveUserID(event.senderID, api);
					
					if (event.isGroup) {
						thread = resolveThreadID(event.threadID, api);					
						console.log(user.name + "<" + thread.name + ">", ":", event.body);
						if (event.threadID == "965866873449366")
							makeDiscordPost(`**${user.name}** says : ${event.body}`);
					}
					else {
						console.log(user.name, ":", event.body);
					}
					console.log("----------EVENT---------------")
					console.log(event)
					console.log("----------EVENT---------------")
					break;
				case "event":
					console.log(event);
					break;
			}
		}
		catch (e) {
			
		}
	});
}


