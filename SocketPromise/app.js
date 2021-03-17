const path = require('path');
const express = require('express');
const fs = require('fs');

const approot = 'socketpromise';
const appport=(process.env.PORT == null || process.env.PORT == "") ? 4000 : process.env.PORT;

var app = express();
app.use(express.static(__dirname + '/public'));
var httpd = require('http').Server(app);

var io = require('socket.io')(httpd);

const userRegistry = {};

/* serve homepage */
function serveHome(req, res){
	res.sendFile('./index.html',{"root": __dirname});
}

/* redirect GET requests */
app.get('/'+approot, serveHome);
/* listen to port */
httpd.listen( appport );

/* pseudo-random lowercase ID generator */
function getRandomString(inLen){
	let ret = '';
	while(ret.length < inLen){
		ret = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, inLen);
	}
	return ret;
}

/* Websocket tasks */
io.sockets.on('connection', function (socket) {
	/* handle client connection */
	console.log(`connect trial on socket ${socket.id}`);
	let uid = getRandomString(6);
	while( userRegistry[uid] != undefined ){
		//uid exists => create new one
		uid = getRandomString(6);
	}//wend
	userRegistry[uid] = socket;
	socket.user = uid;
	console.log(`   user id assigned: ${socket.user}`);

	/* confirm connection */
	let msg1 = JSON.stringify( {userID: uid, userCnt: userRegistry.keys().length} );
	let msg2 = JSON.stringify( {userCnt: userRegistry.keys().length} );
	socket.emit('login', msg1);
	socket.broadcast.emit('userJoined', msg2);
	
	/* user disconnected */
	socket.on('disconnect', function() {
		console.log(`disconnect by user ${socket.user ? socket.user : 'UNKNOWN'} on socket ${socket.id}`);
		try{
			let uid = socket.user;
			userRegistry.delete(uid);
		} catch (error) {
			//no user on socket => nothing to do...
		}
		//disable socket
		socket.removeAllListeners();
	});
});
