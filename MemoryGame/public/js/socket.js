//server connection
var CLIENT_SOCKET=null;

function connectToServer(){
	CLIENT_SOCKET = new SWP();
}

/* Socket WraPper */
var SWP = (function(){
	
	function SWP(){
		var SOCKET=io.connect('http://localhost:4000');
		
		/////////////////////////////////////
		///////    SOCKET receives    ///////
		/////////////////////////////////////
	
		SOCKET.on('login', function() {
			console.log(`login :: -- no data --`);
			Application.state = 'CONNECTED';
			Application.hasIdentity = false;
			updateUI();
		});

		SOCKET.on('gameCreated', function(data) {
			console.log(`gameCreated :: ${JSON.parse(data)}`);
			thisUserCreatedGame( JSON.parse(data) );
		});

		SOCKET.on('joinedGame', function(data) {
			console.log(`joinedGame :: ${JSON.parse(data)}`);
			thisUserJoinedGame( JSON.parse(data) );
		});

		SOCKET.on('loginRejected', function(data) {
			//TBD: inform user something went wrong
			console.log(`loginRejected :: ${JSON.parse(data).response}`);
			loginRejected(JSON.parse(data).response);
		});

		SOCKET.on('usersLoggedInBefore', function(data) {
			console.log(`usersLoggedInBefore :: data=${data}`);
			var usersList = JSON.parse(data).map(u=>JSON.parse(u));
			userLoggedIn(usersList);
		});

		SOCKET.on('userLoggedIn', function(data) {
			console.log(`userLoggedIn :: data=${data}`);
			var newUser = JSON.parse(data);
			userLoggedIn(newUser);
		});
		
		SOCKET.on('gameSettingsFinalized', function(data) {
			console.log(`gameSettingsFinalized (received) :: data=${data}`);
			var gc = JSON.parse(data);
			gameSettingsFinalized(gc);
		});
		
		SOCKET.on('remainingSec', function(data) {
			//console.log(`remainingSec :: data=${data}`);
			var s = JSON.parse(data)["sec"];
			remainingSec(s);
		});

		SOCKET.on('userDisconnected', function(data) {
			console.log(`userDisconnected :: data=${data}`);
			var user = JSON.parse(data);
			userDisconnected(user);
		});

		SOCKET.on('startGame', function(data) {
			console.log(`startGame :: data=${data}`);
			var users = JSON.parse(data);
			startGame(users);
		});

		SOCKET.on('startTurn', function(data) {
			console.log(`startTurn :: data=${data}`);
			var msg = JSON.parse(data); //{gameID: , targetUser: user.strJSON, users: game.getUsersJSON(), remainingSec: }
			if(msg["gameID"] === CLIENT_GAME.getGameID() && msg["targetUser"] === CURRENT_USER.strJSON){
				startTurn(msg);
			} else {
				console.log(`ERROR: wrong target, current gid=${CLIENT_GAME.getGameID()}, current user=${CURRENT_USER.strJSON}`);
			}
		});

		SOCKET.on('watchTurn', function(data) {
			console.log(`watchTurn :: data=${data}`);
			var msg = JSON.parse(data); //{gameID: , targetUser: user.strJSON, users: game.getUsersJSON(), remainingSec: }
			if(msg["gameID"] === CLIENT_GAME.getGameID() && msg["targetUser"] === CURRENT_USER.strJSON){
				watchTurn(msg);
			} else {
				console.log(`ERROR: wrong target, current gid=${CLIENT_GAME.getGameID()}, current user=${CURRENT_USER.strJSON}`);
			}
		});

		SOCKET.on('stopTurn', function(data) {
			console.log(`stopTurn :: data=${data}`);
			var msg = JSON.parse(data); //{gameID: , targetUser: user.strJSON, users: game.getUsersJSON(), remainingSec: }
			if(msg["gameID"] === CLIENT_GAME.getGameID() && msg["targetUser"] === CURRENT_USER.strJSON){
				watchTurn(msg);
			} else {
				console.log(`ERROR: wrong target, current gid=${CLIENT_GAME.getGameID()}, current user=${CURRENT_USER.strJSON}`);
			}
		});
		
		
		
		/////////////////////////////////////
		///////      SOCKET sends     ///////
		/////////////////////////////////////
		this.loginToServer = function(inGameId){
			var gid = (Application.state==='JOIN_GAME' ? inGameId : null);
			var loginData={username: CURRENT_USER.name, avatar: CURRENT_USER.avatar, loginMode: Application.state, loginGameId: gid};
			console.log(`loginToServer :: loginData=${JSON.stringify(loginData)}`);
			SOCKET.emit('login', JSON.stringify(loginData));
		}
		
		this.gameSettingsFinalized = function (inGameId, inGameConstants){
			//initiator starts this game
			var msgData = {gameId: inGameId, gameConstants: inGameConstants};
			console.log(`gameSettingsFinalized (sent) :: msgData=${JSON.stringify(msgData)}`);
			SOCKET.emit('gameSettingsFinalized', JSON.stringify(msgData));
		}

		this.cancelGame = function (inGameId){
			var msgData = {gameId: inGameId};
			console.log(`cancelGame :: msgData=${JSON.stringify(msgData)}`);
			SOCKET.emit('cancelGame', JSON.stringify(msgData));
		}

		this.leaveGame = function (inGameId){
			var msgData = {gameId: inGameId};
			console.log(`leaveGame :: msgData=${JSON.stringify(msgData)}`);
			SOCKET.emit('leaveGame', JSON.stringify(msgData));
		}

	}

	return SWP;
	
}());
