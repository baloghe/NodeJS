
$( document ).ready(function(){
	connectToServer();
	CLIENT_APP.renderFlow();
});

const Client = (function(){
	
	function Client(){
		
		//
		//	Render Flow upon creation
		//
		this.renderFlow = function(){

			function getTask(tid){
				return {
						hasInConnector:			false,
						hasOutConnector:		false,
						tdConnClass:			"bottom-conn",
						tblTaskClass:			"elementary-task",
						tdTaskClass:			"elementary-task",
						dvTaskEnvelopeClass:	"elementary-task",
						btnID:					"btnT"+tid,
						btnClass:				"action-button",
						btnValue:				tid,
						btnSpanClass:			"action-button",
						dvID:					"dvT"+tid,
						dvClass:				"traffic-light"
					};
			}

			function _renderFlow(){
				
				for(let i=1; i<=10; i++){
					let tsk = getTask(i);
					let html=$.templates('#tmplElementaryTask-H').render(tsk);
					$('#tdT'+i).html(html);
				} //next task
				
				console.log(`Flowchart rendered`);
			}
			
			_renderFlow();
		}
		//
		//	Flow rendered...
		//
		
		function updateUserID(uid){
			$('#spName').html(uid);
		}
		
		function updateUserCount(cnt){
			$('#spUserCnt').html(cnt);
		}
		
		function updateTask(str){
			$('#pTask').html(str);
		}
		
		function updateResult(str){
			if(str == 'SUCCESS'){
				$('#spResult').addClass('green');
			} else {
				$('#spResult').addClass('red');				
			}
			$('#spResult').html(str);
		}
		
		function setInfo(str){
			$('#spInfo').html(str);
		}
		
		function activateButtons(){
			for( i of Array.from( { length: 10} , (_, i) => 'T'+(i+1) ) ){
				console.log(`unbind and activate click() for ${'#btn' + i}`);
				$('#btn' + i).unbind().click(
					{taskID: i},
					function(evt){
						let taskID = evt.data.taskID;
						console.log(`clicked: taskID=${taskID}`);
						CLIENT_SOCKET.buttonPressed(taskID);
					}
				);
			}//next task
		}		
		
		function resetTrafficLights(){
			//for(i of ['#dvT1-1','#dvT1-2','#dvT1-3']){
			for(i of Array.from( { length: 10} , (_, i) => '#dvT'+(i+1)) ){
				$(i).removeClass('red');
				$(i).removeClass('green');
			}
		}
		
		function resetResults(){
			$('#spResult').removeClass('green');
			$('#spResult').removeClass('red');
			$('#spResult').html(' ');
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
			//{toPress: Array of int}
			updateTask("Task: press the following buttons according to the flowchart: " + msg.toPress.map(e => e.substr(1)).join(", ") + " !");
			activateButtons();
			resetTrafficLights();
			resetResults();
			setInfo("");
		};
		
		this.partialResult = function(msg){
			//{buttons: Array of {taskID: String, state: (0: not yet attempted | 1=success | 2=failure)}}
			for(let i=0; i<msg["buttons"].length; i++){
				let color = msg.buttons[i].state == 0 ? null : msg.buttons[i].state == 1 ? 'green' : 'red';
				setTrafficLight(msg.buttons[i].taskID, color);
			}//next button state
		};
		
		this.overallResult = function(msg){
			//{result: 'SUCCESS' or 'FAILURE'}
			updateResult(msg["result"]);
		};
		
		this.showInfo = function(msg){
			//{txt: String}
			setInfo(msg["txt"]);
		};
		
	}
	
	return Client;
	
}());

const CLIENT_APP = new Client();


