$( document ).ready(function(){
	connectToServer();
});

const Client = (function() {
	
	function Client(){
		
		function updateUserID(uid){
			$('#spName').html(uid);
		}
		
		function updateUserCount(cnt){
			$('#spUserCnt').html(cnt);
		}
		
		function updateTask(str){
			$('#pTask').html(str);
		}
		
		function activateButtons(){
			for(let i of ['T1-1','T1-2','T1-3']){
				console.log(`unbind and activate click() for ${'#btn' + i}`);
				$('#btn' + i).unbind().click(
					{taskID: i},
					function(evt){
						let taskID = evt.data.taskID;
						console.log(`clicked: taskID=${taskID}`);
						CLIENT_SOCKET.buttonPressed(taskID);
					}
				);
			}//next button
		}
		
		function resetTrafficLights(){
			for(let i of ['T1-1','T1-2','T1-3']){
				$('#dv' + i).removeClass('red');
				$('#dv' + i).removeClass('green');
			}//next light
		}
		
		function setTrafficLight(taskID, color){
			$('#dv' + taskID).removeClass('red');
			$('#dv' + taskID).removeClass('green');
			if(color != null){
				$('#dv' + taskID).addClass(color);
			}
		}
		
		this.login = function(msg){
			//{userID: String, userCnt: int}
			updateUserID(msg["userID"]);
			updateUserCount(msg["userCnt"]);
		};
		
		this.userJoined = function(msg){
			//{userCnt: int}
			updateUserCount(msg["userCnt"]);			
		};
		
		this.setTask = function(msg){
			//{toPress: int}			
			updateTask("Task: press button nr. " + msg["toPress"] + " !");
			activateButtons();
			resetTrafficLights();
		};
		
		this.partialResult = function(msg){
			//{buttons: Array of {0: not yet attempted or 1=success or 2=failure}}
			for(let i=0; i<msg["buttons"].length; i++){
				let color = msg.buttons[i] == 0 ? null : msg.buttons[i] == 1 ? 'green' : 'red';
				setTrafficLight('T1-' + (i+1), color);
			}//next button state
		};
	}
	
	return Client;
	
}());

const CLIENT_APP = new Client();
