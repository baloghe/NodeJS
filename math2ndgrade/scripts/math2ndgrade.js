var Quiz;
const Constants = {
		  NUM_EXCERCISES : 10
		  ,RANGE_MIN : 0
		  ,RANGE_MAX : 30
		  ,CHAIN_MAX : 6
		  ,MULT_TABS : [1,2,3,10]
		  ,MULT_MIN  : 1
		  ,MULT_MAX  : 10
		  ,OPERATORS  : ['+','-','*','/']
		  ,RELATIONS : ['=','&lt;','&gt;','&le;','&ge;']
}
var Results = [];
var elapsedTimeIntervalRef;


function setup(){
//enable Start button
$('#btnStart').prop('disabled', false);

//hide other elements
$('#tbTasks').empty();
$('#btnSubmit').prop('disabled', true);
$('#scTasks').removeClass();
$('#scTasks').addClass('hide');

$('#tbResults').empty();
$('#scResults').removeClass();
$('#scResults').addClass('hide');

}


function start(){

//reset HTML elements
$('#tbTasks').empty();
$('#btnSubmit').prop('disabled', true);
$('#scTasks').removeClass();
$('#scTasks').addClass('hide');

$('#scResults').removeClass();
$('#scResults').addClass('hide');


//reset game logic
var idCnt = 0;
Quiz = {
		  CLOCK : new Date()
		  ,TASKS : Array.from({length: Constants.NUM_EXCERCISES },
								 function(_,i) {
												var task = generateTask( idCnt, i );
												idCnt += task.result.length;
												return task;
								 }
				  )
};
Quiz.QUESTION_COUNT = idCnt;

//list on page
for(var t of Quiz.TASKS){
		  $('#tbTasks').append( t.html );
}

//show Tasks, enable/disable buttons
$('#scTasks').removeClass();
$('#btnStart').prop('disabled', true);
$('#btnSubmit').prop('disabled', false);

//start clock
$('#pClock').html('0');
elapsedTimeIntervalRef = setInterval(() => {
									   $('#pClock').html( getElapsedTime() );
						}
						,1000
		  );
}


function getElapsedTime(){return Math.round( (new Date() - Quiz.CLOCK)/1000 );}


function submit(){
//stop clock
var elapsedTime = getElapsedTime();
$('#btnSubmit').prop('disabled', true);
clearInterval(elapsedTimeIntervalRef);

//evaluate submissions
//console.log('Evaluation...');
var resEval = Array.from({length: Constants.NUM_EXCERCISES}, (_,i) => Quiz.TASKS[i].result)
			.reduce(
				function(acc,expArr,i){
							   var taskOK = true; //a task is either done well (i.e. all partial answers are good) or not (at least one part is wrong)
							   for(var exp of expArr){
											  var actType = $('#i'+(acc.idCnt)).prop('tagName');
											  var act = (actType == "select" ? $('select#i'+(acc.idCnt)+' option:checked').val()
																			 : $('#i'+(acc.idCnt)).val()
																						  );
											  //console.log(`i=${i}, acc.idCnt=${acc.idCnt}, actType = ${actType}, act=${act}, exp=${exp}`);
											  if(act==exp){
															 acc.good++;
											  } else {
															 taskOK = false;
															 acc.bad++;
											  }
											  acc.idCnt++;
							   }//next exp within expArr (=actual task.Result)
							   //console.log(`  task ${i} :: taskOK=${taskOK}`);
							   //mark excercise
							   if(taskOK){
											  $('#m'+(i)).append('<img src="http://clipart-library.com/images/6cp6Rbyri.jpg" alt="OK"></img>');
							   } else {
											  $('#m'+(i)).append('<img src="http://clipart-library.com/images/8ixngbRxT.jpg" alt="HIBA" ></img>');
							   }
							   return acc;
				}
				,{good: 0, bad: 0, idCnt: 0}
			);
		 
//append to Results
var res = {
	   rowNum     : Results.length+1
	  ,cntGood    : resEval.good
	  ,cntBad     : resEval.bad
	  ,ratSuccess : Math.round(100 * resEval.good / (resEval.good + resEval.bad))
	  ,elapsedTime: elapsedTime
};
Results.push(res);
//$('#tbResults').append('<tr><td>'+Results.length+'.</td><td>'+res.cntGood+'</td><td>'+res.cntBad+'</td><td>'+res.ratSuccess+' %</td><td>'+res.elapsedTime+' sec</td></tr>');
//$('#tbResults').append( $('#resultsRow').tmpl(res) );
$('#tbResults').append( $.templates('#resultsRow').render(res) );

//show results
$('#btnStart').prop('disabled', false);
$('#scResults').removeClass();
}


function randInt(inMin,inMax){
	return Math.round(Math.random() * (inMax - inMin) + inMin);
}


function generateTask(inId, inTaskId){
//return generateRemainderDivision(inId, inTaskId);
	var u = randInt(1,7);
	if(u==1) return generateAddition(inId, inTaskId);
	if(u==2) return generateSubstraction(inId, inTaskId);
	if(u==3) return generateMultiplication(inId, inTaskId);
	if(u==4) return generateDivision(inId, inTaskId);
	if(u==5) return generateSimpleChain(inId, inTaskId);
	if(u==6) return generateAdvancedChain(inId, inTaskId);
	return generateRemainderDivision(inId, inTaskId);
}


function renderTaskSimple(inType, inOperand, inElems, inIdStart, inTaskId){

	var u = randInt(1,3);
	var elems = (u==1 ? ['X',inOperand,inElems[1],'=',inElems[2]]
					  : u==2 ? [inElems[0],inOperand,'X','=',inElems[2]]
							 : [inElems[0],inOperand,inElems[1],'=','X']
				);
	var results = (u==1 ? [inElems[0]]
						: u==2 ? [inElems[1]]
							   : [inElems[2]]
				);
										  
	var ret = {
			  type: inType
			  ,html: renderTaskHtmlSimple(elems, inIdStart, inTaskId)
			  ,result: results
		};
	return ret;
}

function renderTaskHtmlSimple(inElems, inIdStart, inTaskId){
	var task, html;
	task = {
			 taskId: 't'+inTaskId
			,inputId: 'i'+inIdStart
			,solutionId: 'm'+inTaskId
			,rangeMin: Constants.RANGE_MIN
			,rangeMax: Constants.RANGE_MAX
			,relations: Constants.RELATIONS
			,elems: inElems
		};
	html=$.templates('#simpleTask').render(task);
	return html;
}


function renderTaskHtmlSimple__Old(inElems, inIdStart, inTaskId){
	var uCnt = 0; //count of unknown elements
	var html = '<tr><td><p id="t'+inIdStart+'" class="task">';
	for(var e of inElems){
			  if( e==='X' ){
							//unknown
							html += (' <input id="i'+(inIdStart+uCnt)+'" type="number" min="'+Constants.RANGE_MIN+'" max="'+Constants.RANGE_MAX+'"/>');
							uCnt++;
			  } else if( e==='R' ) {
							//operand chooser
							html += (' <select id="i'+(inIdStart+uCnt)+'">');
							for(var r of Constants.RELATIONS){
										   html += ('<option value="'+r+'">'+r+'</option>');
							}//next r
							uCnt++;
			  } else  {
							//number or operand
							html += (' ' + e);
			  }
	}//next e
	html += ('</p></td><td id="m'+inTaskId+'"></td></tr>');
	return html;
}


function generateAddition(inIdStart, inTaskId){
	//a+b=c where RANGE_MIN <= a,b,c <= RANGE_MAX must hold, one of them is unknown
	var c = randInt(Constants.RANGE_MIN+2, Constants.RANGE_MAX);
	var a = randInt(Constants.RANGE_MIN+1, c);
	var b = c - a;

	return renderTaskSimple('addition', '+', [a,b,c], inIdStart, inTaskId);
}


function generateSubstraction(inIdStart, inTaskId){
	//a-b=c where RANGE_MIN <= a,b,c <= RANGE_MAX must hold, one of them is unknown
	var a = randInt(Constants.RANGE_MIN+2, Constants.RANGE_MAX);
	var b = randInt(Constants.RANGE_MIN+1, a);
	var c = a - b;

	return renderTaskSimple('substraction', '-', [a,b,c], inIdStart, inTaskId);
}


function generateMultiplication(inIdStart, inTaskId){
	//a*b=c where RANGE_MIN <= a,b,c <= RANGE_MAX must hold, one of them is unknown
	//a in {MULT_TABS}, b in [MULT_MIN, MULT_MAX]
	var a = Constants.MULT_TABS[randInt(0, Constants.MULT_TABS.length-1)];
	var b = randInt(Constants.MULT_MIN, Constants.MULT_MAX);
	var c = a * b;

	return renderTaskSimple('multiplication', '*', [a,b,c], inIdStart, inTaskId);
}


function generateDivision(inIdStart, inTaskId){
	//a / b = c where RANGE_MIN <= a,b,c <= RANGE_MAX must hold, one of them is unknown
	//c in {MULT_TABS}, b in [MULT_MIN, MULT_MAX]
	var c = Constants.MULT_TABS[randInt(0, Constants.MULT_TABS.length-1)];
	var b = randInt(Constants.MULT_MIN, Constants.MULT_MAX);
	var a = c * b;

	return renderTaskSimple('division', '/', [a,b,c], inIdStart, inTaskId);
}


function generateSimpleChain(inIdStart, inTaskId){
	//a1 +- a2 +- a3 +- ... +- an = b
	//RANGE_MIN <= a1, a2, ..., an, b <= RANGE_MAX must hold
	//RANGE_MIN <= interim_sum(i) <= RANGE_MAX must also hold (i.e. when computed from left to right,
	//   the interim sum must remain in the range)
	var res = randInt(1,Constants.RANGE_MAX);
	var elems = [res];
	for(var i=0; i<randInt(1, Constants.CHAIN_MAX); i++){
			  if( randInt(0,1) ){
							var x = randInt(0,Constants.RANGE_MAX - res);
							elems.push('+');
							elems.push(x);
							res += x;
			  } else {
							 var x = randInt(0,res);
							elems.push('-');
							elems.push(x);
							res -= x;
			  }
	}//next i
	elems.push('=');
	elems.push('X');
										  
	var ret = {
			  type: 'simpleChain'
			  ,html: renderTaskHtmlSimple(elems, inIdStart, inTaskId)
			  ,result: [res]
	};
	return ret;
}

function renderAdvancedChainHtml(inElems, inIdStart, inTaskId){
	var task, html, uCnt;
	uCnt = 0;
	task = {
			 taskId: 't'+inTaskId
			,solutionId: 'm'+inTaskId
			,rangeMin: Constants.RANGE_MIN
			,rangeMax: Constants.RANGE_MAX
			,elems: inElems.map(function(e) {
							if(e==='X' || e==='O'){
								var ret = {value: e, inputId: 'i'+(inIdStart+uCnt)};
								uCnt++;
								return ret;
							} else return {value: e};
						})
		};
	html=$.templates('#advancedChain').render(task);
	return html;
}


function generateAdvancedChain(inIdStart, inTaskId){
	// b1 +- a1 = b2
	//            b2 +- a2 = b3
	//   ... etc...
	//                       b(n-1) +- a(n-1) = bn
	// RANGE_MIN <= a1, a2, ..., an, b <= RANGE_MAX must hold
	// RANGE_MIN <= interim_sum(i) <= RANGE_MAX must also hold
	// the solution must be deterministic, that is:
	//   bi and ai cannot be unknown at the same time for any i
	//   ai and b(i+1) cannot be unknown at the same time for any i
	//   at least one bi must be given
	// representation: [node1] -> [op1 edge1] -> [node2] -> [op2 edge2] -> ... -> [node(n+1)]

	var res = randInt(1,Constants.RANGE_MAX); //interim_sum
	var bUnknown = ( Math.random() > 0.5 );   //keeps track of whether last element was unknown
	//console.log(`advChain :: inIdStart=${inIdStart}, before 1st elem: bUnknown=${bUnknown}`);
	var elems = (bUnknown ? ['X'] : [res]);
	var results = (bUnknown ? [res] : []);
	//console.log(`advChain :: inIdStart=${inIdStart}, after 1st elem: bUnknown=${bUnknown}`);

	for(var i=0; i<randInt(3, Constants.CHAIN_MAX); i++){
		  var operator, x;
		  if( randInt(0,1) ){
						x = randInt(0,Constants.RANGE_MAX - res);
						operator = '+';
						res += x;
		  } else {
						x = randInt(0,res);
						operator = '-';
						res -= x;
		  }
		  //operator+edge := unknown?
		  if(!bUnknown && (Math.random() > 0.5)){
						if(x!=0)
									   elems.push('O');
						else elems.push(operator);
						elems.push('X');
						if(x!=0)
									   results.push(operator);
						results.push(x);
						bUnknown = true;
		  } else {
						elems.push(operator);
						elems.push(x);  
						bUnknown = false;                        
		  }
		  //interim result := unknown?
		  if(!bUnknown && (Math.random() > 0.5)){
						elems.push('X');
						results.push(res);
						bUnknown = true;
		  } else {
						elems.push(res);              
						bUnknown = false;                        
		  }
	}//next i
	
	//check if all nodes are set unknown
	var knownNodesCnt = elems.filter((e,i)=>(e!='X' && i%3==0)).length;
	if(knownNodesCnt==0){
		//then let the first node be known!
		elems[0] = results.shift();		
	}

	//render result
	var ret = {
		   type: 'advancedChain'
		  ,html: renderAdvancedChainHtml(elems, inIdStart, inTaskId)
		  ,result: results
	};
	return ret;
}

function renderRemainderDivisionHtml(inElems, inIdStart, inTaskId){
	var task, html;
	task = {
			 taskId: 't'+inTaskId
			,inputId: 'i'+inIdStart
			,solutionId: 'm'+inTaskId
			,rangeMin: Constants.RANGE_MIN
			,rangeMax: Constants.RANGE_MAX
			,dividend: inElems[0]
			,divisor: inElems[1]
			,quotient: inElems[2]
			,remainder: inElems[3]
		};
	html=$.templates('#remainderDivision').render(task);
	return html;
}


function generateRemainderDivision(inIdStart, inTaskId){
	// int(c / b) = a and c%b = r where RANGE_MIN <= a,b,c,r <= RANGE_MAX
	// representation: c : b = a
	//                 r
	// that is: a 2nd table row is created for the remainder

	var a = Constants.MULT_TABS[randInt(0, Constants.MULT_TABS.length-1)];
	var b = randInt(Constants.MULT_MIN, Constants.MULT_MAX);
	var r = randInt(1,b-1);
	var c = a * b + r;

	var elems = [c,b,a,r];
	var i = randInt(0,3);
	var results = [elems[i]];
	elems[i] = 'X';

	//render result
	var ret = {
	  type: 'advancedChain'
	  ,html: renderRemainderDivisionHtml(elems, inIdStart, inTaskId)
	  ,result: results
	};
	return ret;
}


$( document ).ready(function() {
	setup();

	$("#btnStart").click(start);
	$("#btnSubmit").click(submit);
});

