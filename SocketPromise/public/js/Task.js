
var ElementaryTask = (function() {
	
	function ElementaryTask(inTaskID, inEmitter){
		
		let _taskID = inTaskID;
		let _emitter = inEmitter;
		
		let _assignee = null;
		let _status = 'CREATED';//CREATED -> PENDING -> EXECUTING (skipped here) -> COMPLETED/FAILED
		
		this.getID = function(){return _taskID;};
		
		this.getAssignee = function(){return _assignee;};
		
		this.getStatus = function(){return _status;};
		
		this.isElementary = function(){return true;};
		
		this.assignTo = function(assignee){
			_assignee = assignee;
			console.log(`ElementaryTask :: ID=${_taskID} assigned to ${_assignee}, status=${_status}`);
		};
		
		this.start = function(cbStateChanged){
			//TBD: create individual Promise
			_status = 'PENDING';
			let ret = new Promise( (resolve, reject) => {
				_emitter.on('action', function _listener(userID, btnPressed){
					//each task should only listen to its specific button
					if(btnPressed == _taskID){
						if(userID != null && _assignee != null && btnPressed != null
							&& _status == 'PENDING'
							&& userID == _assignee){
							//Task properly executed by assignee
							_status = 'COMPLETED';
							console.log(`Task ${_taskID} completed by ${userID}`);
							cbStateChanged();
							resolve(true);
						} else if(userID != null && _assignee != null
							&& _status == 'PENDING'
							&& userID != _assignee){
							//Task executed by someone else => failure!
							_status = 'FAILED';
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} instead of ${_assignee}`);
						} else if(userID != null && _assignee != null
							&& _status != 'PENDING'){
							//Task executed in wrong state!
							let statSaved = _status;
							_status = 'FAILED';
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} in state ${statSaved} instead of PENDING`);
						} else {
							//Task is in invalid state! (either not assigned OR we don't know who tries to execute it)
							let statSaved = _status;
							_status = 'FAILED';
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} in state ${statSaved}, assignee was ${_assignee}`);
						}
					}//btnPressed == _taskID
				});
			});
			console.log(`ElementaryTask :: ID=${_taskID} started, status=${_status}`);
			return ret;
		};
	}
	
	return ElementaryTask;
	
}());


var SequentialTask = (function() {
	
	function SequentialTask(inTaskID, inIdAssigneeArr, inEmitter){
		//inIdAssigneeArr: Array of {taskID: string, userID: string}
		
		let _taskID = inTaskID;
		let _emitter = inEmitter;
		
		let _subTasks = [];
		
		for(e of inIdAssigneeArr){
			let t = new ElementaryTask(e.taskID, _emitter);
			t.assignTo(e.userID);
			_subTasks.push(t);
		}//next assignment
		console.log(`SequentialTask :: ID=${_taskID} --> ${_subTasks.length} subtasks`);
		
		this.start = function(cbStateChanged){
			//TBD: return partial chain
			let ret = _subTasks.reduce(
							 (chain, actualTask) => {
								 return chain.then( _ => actualTask.start(cbStateChanged) );
							 }
							,Promise.resolve()
						)
						;
			console.log(`SequentialTask :: ID=${_taskID} started`);
			return ret;
		};
		
		this.getStates = function(){
			return _subTasks.map( t => t.getStatus() );
		};
	}
	
	return SequentialTask;
	
}());

//Module export
try {
	module.exports = {
			SequentialTask: 		SequentialTask
		};
} catch (error) {
	//do nothing, locally this makes no sense
}
