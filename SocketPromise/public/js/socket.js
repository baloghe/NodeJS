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
			console.log(`login :: ${data}`);
			let msg = JSON.parse(data); //{userID: String, userCnt: int}
			//TBD
		});
	
		SOCKET.on('userJoined', function(data) {
			console.log(`userJoined :: ${data}`);
			let msg = JSON.parse(data); //{userCnt: int}
			//TBD
		});
		
		
		/////////////////////////////////////
		///////      SOCKET sends     ///////
		/////////////////////////////////////

	}

	return SWP;
	
}());