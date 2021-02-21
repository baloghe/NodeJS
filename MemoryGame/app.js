const path = require('path');
const express = require('express');
const fs = require('fs');
const User = require('./public/js/User');
const GameImport = require('./public/js/Game');
const Game = GameImport.Game;
const Constants = GameImport.Constants;
/*
var CardInfo = GameImport.CardInfo;
var Card = GameImport.Card;
var Deck = GameImport.Deck;
*/

//let f = fs.readFileSync('./public/data/cards.json',function (err, data) {
//							console.log(`CARDS_INFO created`);
//						});
const CARDS_INFO = JSON.parse(fs.readFileSync('./public/data/cards.json',function (err, data) {
							console.log(`CARDS_INFO created`);
						}));

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
	let ret = '';
	while(ret.length < inLen){
		ret = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, inLen);
	}
	return ret;
}

/*
GameID -> {gameObj: Game(.,.), users: Set(User.strJSON)}
*/
const gameRegistry = {};
/*
Constants
*/
const CONSTANTS = new Constants();

function enumUsers(gid){
	const clients = io.sockets.adapter.rooms.get(gid);
	const numClients = clients ? clients.size : 0;
	let c=[];
	for (const clientId of clients ) {
		//this is the socket of each client in the room.
		const clientSocket = io.sockets.sockets.get(clientId);
		c.push(clientSocket);
	}
	let roster = c.map((s) => s.user.name).join(', ');
	return '['+numClients+'] ' + roster;
}

/* Websocket tasks */
io.sockets.on('connection', function (socket) {
	/* handle client connection */
	console.log(`connect trial on socket ${socket.id}`);

	/* user sent his name and avatar */
	socket.on('login', dataJSON => {
		//create new user when needed
		let data=JSON.parse(dataJSON);
		if(!socket.user){
			socket.user = new User(data.username, data.avatar);
			console.log('new user created: ' + socket.user.print() + ', login reason: ' + data.loginMode + (data.loginGameId != null ? ', gameID=' + data.loginGameId : ''));
		} else {
			console.log('user logged on already on this socket! user=' + socket.user.print());
		}
		//process further
		processLogin(socket, data);
	});

	/* Game initiator is done with settings and wants to start game */
	socket.on('gameSettingsFinalized', dataJSON => {
		console.log(`gameSettingsFinalized (received) :: ${dataJSON}`);
		
		let msg = JSON.parse( dataJSON );
		let gid = msg["gameId"];
		
		//check if initiator really initiated the game
		let init = gameRegistry[gid].gameObj.getInitiatedBy();
		if( init.strJSON == socket.user.strJSON ){
		//if so, set game constants to this game
			console.log(`  init.strJSON==socket.user.strJSON`);
			let gc = msg["gameConstants"];
			gameRegistry[gid].gameObj.setConstants( gc );
			//inform others (and self) and start countdown
			console.log(`user list in room [${gid}]: ${enumUsers(gid)}`);
			socket.broadcast.to(gid).emit('gameSettingsFinalized', JSON.stringify( gc ));
			socket.emit('gameSettingsFinalized', JSON.stringify( gc ));
			console.log(`  gameSettingsFinalized broadcasted with ${JSON.stringify( gc )}`);
			
			initializeCountDown(socket, gid, CONSTANTS.getWaitSecBeforeStart());
			console.log(`  interval set for ${gameRegistry[gid].gameObj.secRemainingToStart} secs`);
		
			//set up game on server side
			processSetupGame(gid);
		} else {
		//otherwise: inform socket something went wrong...
			console.log(`  ERR_WRONG_INITIATOR: init.strJSON=${init.strJSON} , socket.user.strJSON=${socket.user.strJSON}`);
			socket.emit('ERR_WRONG_INITIATOR', null );
		}
	});
	
	socket.on('leaveGame', dataJSON => {
		console.log(`leaveGame (received) :: ${dataJSON}`);
		
		let msg = JSON.parse( dataJSON );
		let gid = msg["gameId"];
		
		let usr = socket.user.strJSON;
		socket.broadcast.to(gid).emit('userDisconnected', usr); //much enough for other users, even though user has not disconnected
		gameRegistry[gid].users.delete(usr);
		
		socket.leave(gid);
	});
	
	socket.on('cancelGame', dataJSON => {
		//everyone kicked out of room + inform and handle client side
		console.log(`cancelGame :: initiator cancels game ${dataJSON}`);
		
		let msg = JSON.parse( dataJSON );
		let gid = msg["gameId"];
		
		socket.broadcast.to(gid).emit('ERR_INITIATOR_CANCEL', msg);
		socket.emit('ERR_INITIATOR_CANCEL', msg);
		
		processCancelGame(gid);
	});
	
	function processCancelGame(gid){
		//TBD!!!!!!!!!!
		//everyone kicked out of room + inform and handle client side
		console.log(`processCancelGame :: TBD!!!!!`);
	}

	/* user disconnected */
	socket.on('disconnect', function() {
		console.log(`disconnect by user ${socket.user && socket.user.name ? socket.user.name : 'UNKNOWN'} on socket ${socket.id}`);
		//remove user from rooms (Games) if there is any...
		try{
			let usr = socket.user.strJSON;
			for (let gid in gameRegistry) {
				if(gameRegistry[gid].users.has(usr)){
					socket.broadcast.to(gid).emit('userDisconnected', usr);
					gameRegistry[gid].users.delete(usr);
				}
			}
		} catch (error) {
			//no user on socket => nothing to do...
		}
		//disable socket
		socket.removeAllListeners();
	});
	
	function initializeCountDown(socket, gid, numSec) {
		gameRegistry[gid].gameObj.secRemainingToStart = numSec;
		const ivl = setInterval(() => {
			let s = JSON.stringify({sec: numSec});
			socket.broadcast.to(gid).emit('remainingSecToStart', s );
			socket.emit('remainingSecToStart', s );
			numSec--;
			//console.log(`  remainingSecToStart broadcasted, left: ${s} s, gid=${gid}`);
			
			if(numSec <= 0){
				clearInterval(ivl);
				processStartGame(gid);
			}
		},1000);
	}

	function processLogin(socket, loginData){
		//check login conditions
		let chkResult = checkLogin(loginData.loginMode, loginData.loginGameId, socket.user);
		if( chkResult['response']==='gameCreated' || chkResult['response']==='joinedGame' ){
			socket.emit(chkResult['response'], JSON.stringify({gameID: chkResult['gameID'], gameInitiator: chkResult['gameInitiator']}));
			
			let gid = chkResult['gameID'];
			let gmr = gameRegistry[gid];
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
			let msg = JSON.stringify({response: chkResult['response']});
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
			let gid = getRandomString(6);
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
			let gid=loginGameId;
			if(gameRegistry[gid] != undefined){
				let gs = gameRegistry[gid].gameObj.state;
				if(gs=='CREATED'){
					let init = gameRegistry[gid].gameObj.getInitiatedBy();
					
					//TBD check: reject login if too many users are in already
					
					//add socket to room(=game)
					socket.join(gid);
					
					return {response: 'joinedGame', gameID: gid, gameInitiator: init };
				}
				else return {response: 'ERR_GAME_NOT_ACCESSIBLE'};
			}
			return {response: 'ERR_NO_SUCH_GAME'};
		} else {
			return {response: 'ERR_WRONG_LOGIN_MODE'};
		}
	}
	
	function processSetupGame(inGameId){
		//TBD: get the game ready to be launched...
		//At this point the Game constants are fixed, the only thing we don't know is the exact set of users that would participate
		//Deck could be selected and shuffled
		let game = gameRegistry[inGameId].gameObj;
		game.serverPreInit( CARDS_INFO );
	}
	
	function processStartGame(inGameId){		
		//TBD: fix user list and pass it to Game + users
		let game = gameRegistry[inGameId].gameObj;
		let users = gameRegistry[inGameId].users;
		console.log(`processStartGame :: inGameId=${inGameId}, max players: ${game.getMaxHumanPlayers()}, available players: ${users.size}`);
		if(users.size <= 1){
			//TBD: game initiator is left alone => equivalent to cancel game against his will
			socket.broadcast.to(inGameId).emit('ERR_NOT_ENOUGH_PARTICIPANTS', msg);
			socket.emit('ERR_NOT_ENOUGH_PARTICIPANTS', msg);
			processCancelGame(inGameId);
		} else if(users.size < game.getMaxHumanPlayers() && game.computerPlayerAllowed()){
			//TBD: add computer to the users
		} else {
			//TBD: crop users array at getMaxHumanPlayers()
			//console.log(`  Array.from(users).length=${Array.from(users).length}`);
			let usr = Array.from(users)
					.map(u => {return {"human": true, "data": u};})
					.reduce((a,u,i) => {
							if(i<game.getMaxHumanPlayers()){
								a.push(u);
								//console.log(`  user added: ${u}`);
							}
							return a;
						}
						,[]
					);
			//console.log(`  usr: ${typeof usr}, length: ${usr.length}`);
			game.setUsers(usr,true);
		}
			
		
		//TBD: broadcast game starts... whatever
		let msg = game.getUsersJSON();
		socket.broadcast.to(inGameId).emit('startGame', msg);
		socket.emit('startGame', msg);
		console.log(`START GAME for id=${inGameId}`);
	}

	/* confirm connection */
	socket.emit('login');
});

