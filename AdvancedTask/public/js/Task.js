
var ElementaryTask = (function() {
	
	function ElementaryTask(inTaskID, inEmitter){
		
		let _taskID = inTaskID;
		let _emitter = inEmitter;
		
		let _assignee = null;
		let _status = 'CREATED';//CREATED -> PENDING -> EXECUTING (skipped here) -> COMPLETED/FAILED
		
		let _remainingSec = 10;
		let _countDown = null;
		
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
			cbStateChanged();
			//start countdown
			this.setCountDown();
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
							clearCountDown();
							resolve(true);
						} else if(userID != null && _assignee != null
							&& _status == 'PENDING'
							&& userID != _assignee){
							//Task executed by someone else => failure!
							_status = 'FAILED';
							clearCountDown();
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} instead of ${_assignee}`);
						} else if(userID != null && _assignee != null
							&& _status != 'PENDING'){
							//Task executed in wrong state!
							let statSaved = _status;
							_status = 'FAILED';
							clearCountDown();
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} in state ${statSaved} instead of PENDING`);
						} else {
							//Task is in invalid state! (either not assigned OR we don't know who tries to execute it)
							let statSaved = _status;
							_status = 'FAILED';
							clearCountDown();
							cbStateChanged();
							reject(`Task ${_taskID} attempted by ${userID} in state ${statSaved}, assignee was ${_assignee}`);
						}
					}//btnPressed == _taskID
				});
				_emitter.on('overdue', function _listener(taskID){
					//each task should only listen to its specific countdown
					if(taskID == _taskID){
						//Task overdue!
						let statSaved = _status;
						_status = 'FAILED';
						clearCountDown();
						cbStateChanged();
						reject(`Task ${_taskID} overdue`);
					}//taskID == _taskID
				});
			});
			console.log(`ElementaryTask :: ID=${_taskID} started, status=${_status}`);
			return ret;
		};
				
		this.setCountDown = function(){
			clearCountDown();
			_emitter.emit('tick', _taskID, _remainingSec);
			console.log(`countDown set for ${_taskID}, tick emitted: ${_remainingSec}`);
			_countDown = setInterval(() => {
					if( _remainingSec > 0 ){
						_remainingSec--;
						_emitter.emit('tick', _taskID, _remainingSec);
						console.log(`tick emitted by ${_taskID} : ${_remainingSec}`);
					} else {
						_emitter.emit('overdue', _taskID);
						console.log(`overdue emitted by ${_taskID}`);
						clearCountDown();
					}
				}
				,1000
			);
			console.log(`ElementaryTask :: ID=${_taskID} countDown set`);
		};
		
		function clearCountDown(){
			if( _countDown != null ){
				clearInterval(_countDown);
				_countDown = null;
				console.log(`ElementaryTask :: ID=${_taskID} countDown cleared`);
			}
		};
		
	}
	
	return ElementaryTask;
	
}());


var SequentialTask = (function(){
	
	function SequentialTask(inTaskID, inSubTasks){
		
		let _taskID = inTaskID;
		
		this.getID = function(){return _taskID;};
		this.isElementary = function(){return false;};
		
		//inSubTasks :: Array of (ElementaryTask | SequentialTask | ParallelTask)
		let _subTasks = [];
		
		for(e of inSubTasks){
			_subTasks.push(e);
		}
		console.log(`SequentialTask :: ID=${_taskID}  -->  ${_subTasks.length} subtasks`);
		
		this.start = function(cbStateChanged){
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
			return _subTasks.map( t => {
						return t.isElementary() 
								? {taskID: t.getID(), state: t.getStatus()}
								: t.getStates()
								;
							}
						);
		};
		
	}
	
	return SequentialTask;

}());

var ParallelTask = (function(){
	
	function ParallelTask(inTaskID, inSubTasks){
		
		let _taskID = inTaskID;
		
		this.getID = function(){return _taskID;};
		this.isElementary = function(){return false;};
		
		//inSubTasks :: Array of (ElementaryTask | SequentialTask | ParallelTask)
		let _subTasks = [];
		
		for(e of inSubTasks){
			_subTasks.push(e);
		}
		console.log(`ParallelTask :: ID=${_taskID}  -->  ${_subTasks.length} subtasks`);
		
		this.start = function(cbStateChanged){
			let ret = _subTasks.map(
						(currentTask) => {
							return currentTask.start(cbStateChanged);
						}
				)
				;
			console.log(`ParallelTask :: ID=${_taskID} started`);
			return Promise.all( ret );			
		}
		
		this.getStates = function(){
			return _subTasks.map( t => {
						return t.isElementary() 
								? {taskID: t.getID(), state: t.getStatus()} 
								: t.getStates()
								;
							}
						);
		};
		
	}
	
	return ParallelTask;

}());

//Module export
try {
	module.exports = {
			ElementaryTask: 		ElementaryTask,
			SequentialTask: 		SequentialTask,
			ParallelTask:			ParallelTask
		};
} catch (error) {
	//do nothing, locally this makes no sense
}
