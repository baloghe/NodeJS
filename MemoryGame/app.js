var path = require('path');
var express = require('express');
var fs = require('fs');
var User = require('./public/js/User');

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

/* Websocket tasks */
io.sockets.on('connection', function (socket) {
/* handle client connection */
console.log(`connect trial on socket ${socket.id}`);

/* user sent his name and avatar */
socket.on('login', dataJSON => {
	if(!socket.user){
		var data=JSON.parse(dataJSON);
		socket.user = new User(data.username, data.avatar);
		console.log('new user created: ' + socket.user.print());
		socket.emit('loginConfirmed');
		socket.broadcast.emit('userLoggedIn',JSON.stringify(socket.user));
		//newcomer must be informed about the other users
		//TBD
	} else console.log('user logged on already on this socket! user=' + socket.user.print());
	socket.off('login',()=>{});
});

/* user disconnected */
socket.on('disconnect', function() {
	console.log(`disconnect by user ${socket.user && socket.user.name ? socket.user.name : 'UNKNOWN'} on socket ${socket.id}`);
	socket.removeAllListeners();
});

/* confirm connection */
socket.emit('login');
});

