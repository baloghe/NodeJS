//server connection
var SOCKET=null;

function connectToServer(){
SOCKET=io.connect('http://localhost:4000');
switchOnSocket();
}


function switchOnSocket(){

SOCKET.on('login', function() {
	Application.state = 'CONNECTED';
	updateUI();
});

SOCKET.on('gameCreated', function(data) {
	createGame( JSON.parse(data) );
	Application.state = 'SET_GAME';
	updateUI();
});

SOCKET.on('joinedGame', function(data) {
	thisUserJoinedGame( JSON.parse(data) );
	Application.state = 'WAIT_SETTING_GAME';
	updateUI();
});

SOCKET.on('loginRejected', function(data) {
	//TBD: inform user something went wrong
	console.log(`loginRejected :: ${JSON.parse(data).response}`);
	loginRejected(JSON.parse(data).response);

	//Goback to 'what do you want?'
	Application.state = 'CONNECTED';
	updateUI();
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
	updateUI();
});

SOCKET.on('userDisconnected', function(data) {
	console.log(`userDisconnected :: data=${data}`);
	var user = JSON.parse(data);
	userDisconnected(user);
});

}


function loginToServer(inGameId){
var gid = (Application.state==='JOIN_GAME' ? inGameId : null);
var loginData={username: Game.currentUser.name, avatar: Game.currentUser.avatar, loginMode: Application.state, loginGameId: gid};
console.log(`SOCKET.on(login) :: loginData=${loginData}, Game.currentUser=${Game.currentUser.print()}`);
SOCKET.emit('login', JSON.stringify(loginData));
}


