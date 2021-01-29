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

SOCKET.on('loginConfirmed', function() {
Application.state = 'SET_GAME';
updateUI();
});

SOCKET.on('userLoggedIn', function(data) {
var newUser = JSON.parse(data);
userLoggedIn(newUser);
updateUI();
});

}


function loginToServer(){
var loginData={username: Game.currentUser.name, avatar: Game.currentUser.avatar};
console.log(`SOCKET.on(login) :: loginData=${loginData}, Game.currentUser=${Game.currentUser.print()}`);
SOCKET.emit('login', JSON.stringify(loginData));
}


