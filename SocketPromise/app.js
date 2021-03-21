const path = require('path');
const express = require('express');
const fs = require('fs');
const EventEmitter = require('events');

const {SequentialTask} = require('./public/js/Task');

const approot = 'socketpromise';
const appport=(process.env.PORT == null || process.env.PORT == "") ? 4000 : process.env.PORT;

var app = express();
app.use(express.static(__dirname + '/public'));
var httpd = require('http').Server(app);

var io = require('socket.io')(httpd);

//local vars
const userRegistry = new Map();
let TASK = null;
const actionEmitter = new EventEmitter();

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

/* source: JavaScript implementation of the Durstenfeld shuffle, https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/* Websocket tasks */
io.sockets.on('connection', function (socket) {
	/* handle client connection */
	console.log(`connect trial on socket ${socket.id}`);
	
	//only let players in when theay are less than 3
	if(userRegistry.size < 3){
		let uid = getRandomString(6);
		while( userRegistry.get(uid) != undefined ){
			//uid exists => create new one
			uid = getRandomString(6);
		}//wend
		userRegistry.set(uid, socket);
		socket.user = uid;
		console.log(`   user id assigned: ${socket.user}, number of users: ${userRegistry.size}`);

		/* confirm connection */
		let msg1 = JSON.stringify( {userID: uid, userCnt: userRegistry.size} );
		let msg2 = JSON.stringify( {userCnt: userRegistry.size} );
		socket.emit('login', msg1);
		socket.broadcast.emit('userJoined', msg2);
		
		/* 3 participants => launch "game" */
		if(userRegistry.size == 3){
			resetTask();
		}
	} else {
		//forcibly close connection, 3 players are enough!
		let msg1 = JSON.stringify( {userCnt: userRegistry.size} );
		socket.emit('forceDisconnect', msg1);
		setTimeout( function(){
				socket.disconnect(true);
			}
			,1 
		);
	}
	
	/* user took action on client side */
	socket.on('buttonPressed', function(data) {
		console.log(`buttonPressed :: ${data} by user ${socket.user ? socket.user : 'UNKNOWN'}`);
		let msg = JSON.parse(data);
		actionEmitter.emit('action', socket.user, msg.btnID);
	});
	
	/* user disconnected */
	socket.on('disconnect', function() {
		console.log(`disconnect by user ${socket.user ? socket.user : 'UNKNOWN'} on socket ${socket.id}, remaining users: ${userRegistry.size}`);
		try{
			let uid = socket.user;
			//console.log(`  key to delete: ${uid}`);
			userRegistry.delete(uid);
			//console.log(`  after delete: [${Array.from(userRegistry.keys()).join(',')}]`);
		} catch (error) {
			//no user on socket => nothing to do...
			console.log(`disconnect :: error: ${error}`);
		}
		//disable socket
		socket.removeAllListeners();
	});
});

function handleTaskFailed(err){
	console.log(`TASK failed: ${err}`);
	scheduleReset('FAILURE');
}

function handleTaskSuccess(){
	console.log(`TASK succeeded!!!`);
	console.log(`Let's play again!`);
	scheduleReset('SUCCESS');
}

function scheduleReset(outcome){
	setTimeout(function (){
		let msg1 = {result: outcome};
		io.sockets.emit('overallResult', JSON.stringify(msg1));
		setTimeout(function (){
			let msg2 = {txt: "Let's play again!"};
			io.sockets.emit('info', JSON.stringify(msg2));
			setTimeout(resetTask, 1000);
		}, 1000);
	}, 1000);
}

function handlePartialResult(){
	console.log(`Report partial results to users`);
	let actRes = TASK.getStates();
	console.log(`  ${actRes.join(',')}  translated to`);
	let msg = actRes.map( s => {
		return s == 'COMPLETED' ? 1 : s == 'FAILED' ? 2 : 0;
	});
	console.log(`  ${msg.join(',')}`);
	io.sockets.emit('partialResult', JSON.stringify({buttons: msg}));
}

function resetTask(){
	console.log(`TASK reset start -----------------`);
	
	// see if there are still 3 users...
	if(userRegistry.size == 3){
		//remove listeners
		actionEmitter.removeAllListeners('action');
		
		//shuffle users
		let arr = [];
		for(u of userRegistry.keys()){
			arr.push(u);
		}//next user
		shuffleArray(arr);
		
		//assign a task each
		console.log(`  assign tasks`);
		let tsk = [];
		for(let i=0; i<arr.length; i++){
			tsk.push( {taskID: 'T1-' + (i+1), userID: arr[i]} );
			console.log(`    ${'T1-' + (i+1)}  ->  ${arr[i]}`);
			//inform user
			let msg = {toPress: i+1};
			let s = userRegistry.get(arr[i]);
			s.emit('setTask', JSON.stringify(msg));
			console.log(`      informed: ${JSON.stringify(msg)}`);
		}//next user
		
		//individual tasks assigned => arrange them in a Sequential Task object
		TASK = new SequentialTask('T1', tsk, actionEmitter);
		
		//start it
		TASK.start(handlePartialResult)
			.then(handleTaskSuccess)
			.catch((err) => handleTaskFailed(err))
			;
		
		console.log(`TASK reset done  -----------------`);
	} else {
		//users needed urgently!
		console.log(`resetTask :: TBD! we have ${userRegistry.size} users instead of 3`);
	}
}
