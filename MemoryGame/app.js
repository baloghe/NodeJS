var path = require('path');
var express = require('express');
var fs = require('fs');
var User = require('./public/js/User');
var Game = require('./public/js/Game');

const approot='memorygame';
const appport=4000;

var app = express();
app.use(express.static(__dirname + '/public'));
var httpd = require('http').Server(app);

var io = require('socket.io')(httpd);

/* serve homepage */
function serveHome(req, res){
//console.log('serveHome called');
//res.sendFile(path.join(__dirname, '/index.html'));
res.sendFile('./public/index.html',{"root": __dirname});
}

/* redirect GET requests */
app.get('/'+approot, serveHome);
/* listen to port */
httpd.listen( appport );

/* pseudo-random room ID generator */
function getRandomString(inLen){
	var ret = '';
	while(ret.length < inLen){
		ret = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, inLen);
	}
return ret;
}

/*
GameID -> {gameObj: Game(.,.), users: Set(User.strJSON)}
*/
var gameRegistry = {};

/* Websocket tasks */
io.sockets.on('connection', function (socket) {
/* handle client connection */
console.log(`connect trial on socket ${socket.id}`);

/* user sent his name and avatar */
socket.on('login', dataJSON => {
	//create new user when needed
	var data=JSON.parse(dataJSON);
	if(!socket.user){
		socket.user = new User(data.username, data.avatar);
		console.log('new user created: ' + socket.user.print() + ', login reason: ' + data.loginMode + (data.loginGameId != null ? ', gameID=' + data.loginGameId : ''));
	} else {
		console.log('user logged on already on this socket! user=' + socket.user.print());
	}
	//process further
	processLogin(socket, data);
});

function processLogin(socket, loginData){
	//check login conditions
	var chkResult = checkLogin(loginData.loginMode, loginData.loginGameId, socket.user);
	if( chkResult['response']==='gameCreated' || chkResult['response']==='joinedGame' ){
		socket.emit(chkResult['response'], JSON.stringify({gameID: chkResult['gameID'], gameInitiator: chkResult['gameInitiator']}));
		
		var gid = chkResult['gameID'];
		var gmr = gameRegistry[gid];
		gmr.users.add(socket.user.strJSON);
		//console.log(`  ${chkResult['response']} => users[${gid}]=${usersToString(gid)}`);
		
		//joined-to-game situation: inform other users + refresh users list
		if( chkResult['response']==='joinedGame' ){
			socket.broadcast.to(gid).emit('userLoggedIn', socket.user.strJSON);
			socket.emit('usersLoggedInBefore', JSON.stringify(Array.from(gmr.users)));
			//console.log(`    ${chkResult['response']} => users[${gid}]=${usersToString(gid)}`);
		}
	} else {
		//inform client something went wrong
		var msg = JSON.stringify({response: chkResult['response']});
		//console.log(`loginRejected ${msg}`);
		socket.emit('loginRejected', msg );
	}
}

function usersToString(gid){
	if(gameRegistry[gid] != undefined){
		return Array.from(gameRegistry[gid].users).map(e=>e.name).join(", ");
	} else return "NoSuchGame";
}

/* check login reason */
//TBD: make it ASYNC in order to prevent two different users create the same game at the same time
function checkLogin(loginMode, loginGameId, inUser){
	//console.log(`checkLogin: loginMode=${loginMode}, loginGameId: ${loginGameId}, inUser: ${inUser.name}`);
	if( loginMode==='START_NEW_GAME' ){
		//create new game ID
		var gid = getRandomString(6);
		//console.log(`    gid=${gid}`);
		while( gameRegistry[gid] != undefined ){
			//gid exists => create new one
			gid = getRandomString(6);
		}//wend

		//assign socket to room(=game)
		socket.join(gid);

		//create and populate game registry entry
		gameRegistry[gid] = {gameObj: new Game(gid,inUser), users: new Set()};
		gameRegistry[gid].gameObj.state = 'CREATED';
		gameRegistry[gid].users.add(inUser.strJSON);
		//console.log(`JSON(gameRegistry[gid])=${JSON.stringify(gameRegistry[gid])}, size=${gameRegistry[gid].users.size()}`);

		//console.log(`  return: gid=${gid}, gameInitiator: ${inUser.name}`);
		return {response: 'gameCreated', gameID: gid, gameInitiator: inUser };

	} else if( loginMode==='JOIN_GAME' ) {
		//console.log(`JOIN_GAME inUser=${inUser.name}, gameID: ${loginGameId}`);
		//check game ID existence & state
		var gid=loginGameId;
		if(gameRegistry[gid] != undefined){
			var gs = gameRegistry[gid].gameObj.state;
			if(gs=='CREATED'){
				var gid = gameRegistry[gid].gameObj.getGameID();
				var init = gameRegistry[gid].gameObj.getInitiatedBy();
				return {response: 'joinedGame', gameID: gid, gameInitiator: init };
			}
			else return {response: 'ERR_GAME_NOT_ACCESSIBLE'};
		}
		return {response: 'ERR_NO_SUCH_GAME'};
	} else {
		return {response: 'ERR_WRONG_LOGIN_MODE'};
	}
}

/* user disconnected */
socket.on('disconnect', function() {
	console.log(`disconnect by user ${socket.user && socket.user.name ? socket.user.name : 'UNKNOWN'} on socket ${socket.id}`);
	//remove user from rooms (Games)
	var usr = socket.user.strJSON;
	for (var gid in gameRegistry) {
		if(gameRegistry[gid].users.has(usr)){
			socket.broadcast.to(gid).emit('userDisconnected', usr);
			gameRegistry[gid].users.delete(usr);
		}
	}
	//disable socket
	socket.removeAllListeners();
});

/* confirm connection */
socket.emit('login');
});

