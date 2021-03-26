const path = require('path');
const express = require('express');
const fs = require('fs');
const EventEmitter = require('events');

const {ElementaryTask, SequentialTask, ParallelTask} = require('./public/js/Task');

const approot = 'advancedtask';
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
	res.sendFile('./public/index.html',{"root": __dirname});
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

/* reduces Array of (whatever-except-of-Array | Array) into a 1-dimensional Array of (whatever-except-of-Array) */
function reducer(a){
	let ret = [];
	if(Array.isArray(a)){
		for(const x of a){
			ret=ret.concat(reducer(x));
		}
	} else {
		ret.push(a);
	}
	return ret;
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
	let actRes = reducer( TASK.getStates() );
	console.log(`  ${actRes.map(e => '['+e.taskID+': '+e.state+']').join(',')}  translated to`);
	let msg = actRes.map( e => {
		return {taskID: e.taskID, state: e.state == 'COMPLETED' ? 1 : e.state == 'FAILED' ? 2 : 0};
	});
	console.log(`  ${msg.map(e => '['+e.taskID+': '+e.state+']').join(',')}`);
	io.sockets.emit('partialResult', JSON.stringify({buttons: msg}));
}

function assignTasks(userArr, taskArr, minEach){
	//gets:
	//	userArr: Array of String (userIDs)
	//	taskArr: Array of String (taskIDs)
	//returns: Map(userID -> Array of String (taskIDs))
	console.log(`assignTasks ::`);
	
	let ret = new Map();
	let uarr = [];
	minEach = minEach || 0;
	
	//try to add all users at least minEach times
	for(let t=0, cnt=0; t < minEach && cnt<taskArr.length; t++){
		for(u of userArr){
			if(cnt<taskArr.length){
				uarr.push(u);
				cnt++;
			}//
		}//next u
	}//next t
	//console.log(`after minEach :: ${uarr.length}`);
	
	//add users randomly until we have as many users as tasks
	let cnt = taskArr.length - uarr.length;
	for(let i=0; i<cnt; i++){
		let r = Math.floor(Math.random() * userArr.length);
		uarr.push(userArr[r]);
	}//next i
	//console.log(`after next step :: ${uarr.length}`);
	
	//randomize user order
	shuffleArray(uarr);
	//console.log(`after shuffle :: ${uarr.length}`);
	
	//generate output
	for(let i=0; i<uarr.length; i++){
		let t = taskArr[i];
		let a = ret.get(uarr[i]) || [];
		a.push(t);
		ret.set(uarr[i], a);
		console.log(`  ${t} -> ${uarr[i]}`);
	}//next i
	
	return ret;
}

function buildTask(inElemTasks){
	console.log(`inElemTasks :: ${typeof inElemTasks}, length: ${inElemTasks.length}`);
	//Our task (as depicted by the Flowchart on Client side) is a Composition
	let p23 = new ParallelTask('P23',[ inElemTasks[1], inElemTasks[2] ]);
	let s68 = new SequentialTask('S68',[ inElemTasks[5], inElemTasks[7] ]);
	let s79 = new SequentialTask('S79',[ inElemTasks[6], inElemTasks[8] ]);
	let p6to10 = new ParallelTask('P6-10', [ inElemTasks[9], s68, s79 ]);
	
	return new SequentialTask('T', [ inElemTasks[0], p23, inElemTasks[3], inElemTasks[4], p6to10 ]);
}

function resetTask(){
	console.log(`TASK reset start -----------------`);
	
	//see if there are still 3 users
	if( userRegistry.size == 3 ){
		//remove listeners
		actionEmitter.removeAllListeners('action');
		
		//get users
		let uarr = [];
		for(u of userRegistry.keys()){
			uarr.push(u);
		}//next user
		
		//generate (elementary) Tasks
		let tarr = Array.from( { length: 10} , (_, i) => new ElementaryTask('T'+(i+1), actionEmitter) );
		/*
		let tarr = Array.from( { length: 10} , (_, i) => {
						let t = new ElementaryTask('T'+(i+1), actionEmitter);
						console.log(`  ${i+1}. elementary task: ${t.getID()}`);
						return t;
					});
		*/
		
		//build composite task
		TASK = buildTask(tarr);
		
		//Random assignment: Map(userID -> Array of String (taskIDs))
		let assignment = assignTasks(uarr, tarr.map(e => e.getID()), 1);
		
		//Assign individual ElementaryTasks to users and inform them
		for(const u of uarr){
			let ut = assignment.get(u); //Array of String (taskIDs)
			for(const t of ut){
				tarr.filter(x => x.getID() == t)[0].assignTo(u);
			}//next t
			//inform user about his/her tasks
			let msg = {toPress: ut};
			let s = userRegistry.get(u);
			s.emit('setTask', JSON.stringify(msg));
			console.log(`    informed: ${JSON.stringify(msg)}`);
		}//next u
				
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

