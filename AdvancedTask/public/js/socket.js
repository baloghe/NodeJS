//server connection	
let CLIENT_SOCKET=null;

function connectToServer(){
	CLIENT_SOCKET = new SWP();
}

/* Socket WraPper */
const SWP = (function(){
	
	function SWP(){
		let SOCKET=io.connect('http://localhost:4000');
		
		/////////////////////////////////////
		///////    SOCKET receives    ///////
		/////////////////////////////////////
	
		SOCKET.on('login', function(data) {
			console.log(`login (received) :: ${data}`);
			let msg = JSON.parse(data); //{userID: String, userCnt: int}
			CLIENT_APP.login(msg);
		});
	
		SOCKET.on('userJoined', function(data) {
			console.log(`userJoined (received) :: ${data}`);
			let msg = JSON.parse(data); //{userCnt: int}
			CLIENT_APP.userJoined(msg);
		});
		
		SOCKET.on('setTask', function(data) {
			console.log(`setTask (received) :: ${data}`);
			let msg = JSON.parse(data); //{toPress: Array of String (taskIDs)}
			CLIENT_APP.setTask(msg);
		});
		
		SOCKET.on('partialResult', function(data) {
			console.log(`partialResult (received) :: ${data}`);
			let msg = JSON.parse(data); //{buttons: Array of {0=not yet attempted or 1=success or 2=failure or 3=running}}
			CLIENT_APP.partialResult(msg);
		});
		
		SOCKET.on('overallResult', function(data) {
			console.log(`partialResult (received) :: ${data}`);
			let msg = JSON.parse(data); //{result: "success" or "failure"}
			CLIENT_APP.overallResult(msg);
		});
		
		SOCKET.on('tick', function(data) {
			console.log(`tick (received) :: ${data}`);
			let msg = JSON.parse(data); //{taskID: String, remainingSec: int}
			CLIENT_APP.tick(msg);
		});
		
		
		/////////////////////////////////////
		///////      SOCKET sends     ///////
		/////////////////////////////////////

		this.buttonPressed = function(btnID){
			let msg = {"btnID": btnID};
			SOCKET.emit('buttonPressed', JSON.stringify(msg));
			console.log(`buttonPressed (sent) :: ${JSON.stringify(msg)}`);
		};
	}

	return SWP;
	
}());
