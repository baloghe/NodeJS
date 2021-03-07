
function updateUI(){
	console.log(`updateUI :: Application.state=${Application.state}`);

	if( Application.state === 'OPENED' ){
		$('#btnConnect').prop('disabled', true);
		$('#btnPlayAgainstComputer').prop('disabled', true);
		$('#scStartGame').removeClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'CONNECTED' ){
		$('#btnConnect').prop('disabled', false);
		$('#btnPlayAgainstComputer').prop('disabled', false);
		$('#scStartGame').removeClass('hide');
		$('#tblLoginButtons').removeClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'JOIN_GAME' || Application.state === 'START_NEW_GAME' || Application.state === 'PLAY_AGAINST_COMPUTER'){
		$('#btnConnect').prop('disabled', true);
		$('#btnPlayAgainstComputer').prop('disabled', true);
		$('#scStartGame').removeClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'SET_GAME' || Application.state === 'WAIT_SETTING_GAME' || Application.state === 'WAIT_FOR_START' || Application.state === 'PRACTICE' ){
		$('#tblLoginButtons').addClass('hide');
		$('#scGameSettings').removeClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
		enableSettings( Application.state === 'SET_GAME' || Application.state === 'PRACTICE', Application.state === 'PRACTICE' );
		showGameSettingButtons( CLIENT_GAME.currentUser.strJSON == CLIENT_GAME.getInitiatedBy().strJSON );
		if( Application.state === 'WAIT_FOR_START' ){
			$('#pRemainingSecs').removeClass('hide');
			$('#btnFinishSettings').addClass('hide');
			$('#pConnResult').addClass('hide');
		} else {
			$('#pRemainingSecs').addClass('hide');
		}
	} else if( Application.state === 'IN_GAME' ){
		$('#scStartGame').addClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').removeClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'GAME_FINISHED' ){
		$('#scStartGame').addClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').removeClass('hide');
	}
}

//sets name and avatar
function setNameAvatar(inName, inAvatarSrc){
	//local logic
	if( !CURRENT_USER ){
		CURRENT_USER = new User(inName, inAvatarSrc);
	} else {
		CURRENT_USER.name = inName;
		CURRENT_USER.avatar = inAvatarSrc;
	}

	//on local page
	updateProfileOnPage(inName, inAvatarSrc);

	//update UI
	updateUI();
}

//enables/disables game settings options
function enableSettings(inEnable, inPracticeMode){
	inPracticeMode = inPracticeMode || false;
	//console.log(`enableSettings :: inPracticeMode=${inPracticeMode}`);
	$('#setNumCards').prop('disabled', (!inEnable));
	$('#setLimitThinkingTime').prop('disabled', (!inEnable));
	$('#chkComputerPlayer').prop('disabled', ((!inEnable)) || inPracticeMode);
	$('#setMaxHumanPlayers').prop('disabled', ((!inEnable)) || inPracticeMode);
	//$('#setMaxHumanPlayers').prop('disabled', (!inEnable));
	
	//Practice mode: preset obvious options
	$('#chkComputerPlayer').prop('checked', true);
	$('#setMaxHumanPlayers').val("1");
}

//shows necessary buttons based on role
function showGameSettingButtons(inInitiator){
	if(inInitiator){
		$('#btnFinishSettings').removeClass('hide');
		$('#btnLeaveGame').addClass('hide');
		$('#btnCancelGame').removeClass('hide');
	} else {
		$('#btnFinishSettings').addClass('hide');
		$('#btnLeaveGame').removeClass('hide');
		$('#btnCancelGame').addClass('hide');		
	}	
}

function uiRefreshUsersList(){
	if(Application.state === 'SET_GAME' || Application.state === 'WAIT_SETTING_GAME'){
		task = {tableHeaderClass: "tableHeader",
				listCaption: "Users",
				nameClass: "userName",
				elems: Array.from(CLIENT_GAME.getWaitingList()).map((x)=>{var e = JSON.parse(x); return {avatarSrc: e.avatar, name: e.name};})
				};
		html=$.templates('#tmplUserList').render(task);
		$('#dvJoinedAlready').html(html);
	}
}

//ANOTHER user successfully joined to the same game as THIS user => refresh users list with a single user
//OR THIS user joined a game => refresh users list with already joined users at once
function userLoggedIn(inUsers){
	//logically
	if(Array.isArray(inUsers)){
		inUsers.forEach(e => CLIENT_GAME.addUserToWaitingList(JSON.stringify(e)));
	} else {
		CLIENT_GAME.addUserToWaitingList(JSON.stringify(inUsers));
	}

	//on UI
	uiRefreshUsersList();
	if(!(Array.isArray(inUsers))){
		updateUI();
	}
}

$( document ).ready(function(){
	testUI();
	updateUI();
	connectToServer();

	/* Avatar chooser popup / Join game */
	$('#btnJoinGame').click(function(e){
		Application.state = 'JOIN_GAME';
		updateUI();
		//show avatar chooser IF necessary
		$('#pGameIdInput').removeClass('hide');
		$('#pGameIdInput').prop('required',true);
		$('#dvAvChooser').popup('show');
	});

	/* Avatar chooser popup / Start new game */
	$('#btnStartNewGame').click(function(e){
		Application.state = 'START_NEW_GAME';
		updateUI();
		//show avatar chooser IF necessary
		if(Application.hasIdentity){
			CLIENT_SOCKET.loginToServer(null);
		} else {
			$('#pGameIdInput').addClass('hide');
			$('#pGameIdInput').prop('required',false);
			$('#dvAvChooser').popup('show');
		}
	});
	
	/* Avatar chooser popup / Start new game */
	$('#btnPlayAgainstComputer').click(function(e){
		Application.state = 'PLAY_AGAINST_COMPUTER';
		updateUI();
		//show avatar chooser IF necessary
		if(Application.hasIdentity){
			CLIENT_SOCKET.loginToServer(null);
		} else {
			$('#pGameIdInput').addClass('hide');
			$('#pGameIdInput').prop('required',false);
			$('#dvAvChooser').popup('show');
		}
	});

	$('#tblAvChooser .avatar').click(function(e){
		$('#tblAvChooser').find('>*>tr>td, >tr>td').each(
			function(){$(this).removeClass('chosen');}
		);
		$(this).parent().addClass('chosen');
		$('#imgAvSelected').attr('src', $(this).attr('src'));
		$('#avatarSelected').val( $(this).attr('src') );
	});

	$('#frmSelNamAv').submit(function(e) {
		e.preventDefault(); // avoid to execute the actual submit of the form.
		//check if everything is OK
		let valid = true;
		$('[required]').each(function() {
				if ($(this).is(':invalid')) valid=false;
			});
		if (!valid) return;
		$("#btnModSettings").html('Change');
		setNameAvatar( $('#name').val(), $('#avatarSelected').val() );
		var gid = (Application.state==='START_NEW_GAME' ? null : $('#room').val());
		CLIENT_SOCKET.loginToServer(gid);
		$('#dvAvChooser').popup('hide');
	});
	
	$('#btnFinishSettings').click(function(e){
		//TBD: initiator finishes settings =>
		//	1) register settings locally
		//	2) send to Server for further use (store and broadcast)
		CLIENT_GAME.constants = {
			numCards:			$('#setNumCards').val(),
			limitThinkingTime:	$('#setLimitThinkingTime').val(),
			computerPlayer:		$("#chkComputerPlayer").is(":checked"),
			maxHumanPlayers:	$('#setMaxHumanPlayers').val()
		};
		CLIENT_SOCKET.gameSettingsFinalized( CLIENT_GAME.getGameID(), CLIENT_GAME.constants );
	});
	
	$('#btnCancelGame').click(function(e){
		//TBD: initiator decides to call off the game
		//	1) rollback locally to 'CONNECTED' but already having an identity
		//	2) send to Server to kick out everyone of the room and destroy it completely
		Application.state = 'CONNECTED';
		CLIENT_SOCKET.cancelGame( CLIENT_GAME.getGameID() );
		CLIENT_GAME = null;
		updateUI();
	});
	
	$('#btnLeaveGame').click(function(e){
		//TBD: non-initiator user wants to leave the game
		//	1) rollback locally to 'CONNECTED' but already having an identity
		//	2) send to Server to inform other users in room
		Application.state = 'CONNECTED';
		CLIENT_SOCKET.leaveGame( CLIENT_GAME.getGameID() );
		CLIENT_GAME = null;
		updateUI();
	});

	// Initialize the plugin
	$('#dvAvChooser').popup({
		 focusdelay: 300
		,outline: true
	});
});

function updateProfileOnPage(inName, inAvatarSrc){
	task = {tableHeaderClass: "tableHeader",
			listCaption: "Profile",
			nameClass: "userName",
			elems: [
				{avatarSrc: inAvatarSrc, name: inName}
			]
			};
	html=$.templates('#tmplUserList').render(task);
	$('#dvProfile').html(html);
}

function remainingSec(inSec){
	//TBD: another second elapsed => show it on screen!
	if(Application.state === 'IN_GAME'){
		$('#spRemainingSecsFromTurn').html(inSec);
	} else {
		$('#spRemainingSecsToStart').html(inSec);
	}
}

function gameSettingsFinalized(inGameConstants){
	//TBD: game settings have been finalized => disable them even for the initiator!
	console.log(`client.gameSettingsFinalized :: inGameConstants=${inGameConstants}`);
	//logically
	CLIENT_GAME.setConstants(inGameConstants);
	Application.state = 'WAIT_FOR_START';
	console.log(`  getNumCardsSel()=${CLIENT_GAME.getNumCardsSel()}, getLimitThinkingTimeSel()=${CLIENT_GAME.getLimitThinkingTimeSel()}`);
	
	//on UI
	$('#setNumCards').val(CLIENT_GAME.getNumCardsSel());
	$('#setLimitThinkingTime').val(CLIENT_GAME.getLimitThinkingTimeSel());
	$('#chkComputerPlayer').prop('checked', CLIENT_GAME.computerPlayerAllowed());
	$('#setMaxHumanPlayers').val(CLIENT_GAME.getMaxHumanPlayers());
	
	updateUI();
	remainingSec(CONSTANTS.getWaitSecBeforeStart());
}

function processCreateGame(gameData, asInitiator){
	//Logically
	CLIENT_GAME = new Game(gameData.gameID, gameData.gameInitiator);
	CLIENT_GAME.currentUser = CURRENT_USER;
	
	//game ID
	$('#spGameID').html(gameData.gameID);

	//game initiator
	var task = {avatarSrc: gameData.gameInitiator.avatar, name: gameData.gameInitiator.name};
	html=$.templates('#tmplUserH1').render(task);
	$('#tblInitiatedBy').html(html);

	//users joined already == none
	$('#dvJoinedAlready').html('');
	
	//pConnResult
	$('#pConnResult').removeClass('error');
	$('#pConnResult').addClass('success');
	$('#pConnResult').html(
			asInitiator ? "Game initiated... Now complete settings and push Start!"
			            : "Successfully joined. Wait for Initiator to start it!"
		);
}

function thisUserCreatedGame(gameData){
	//THIS user successfully created a game
	processCreateGame(gameData, true);
	
	//Set application state
	let prvState = Application.state;
	if(prvState === 'PLAY_AGAINST_COMPUTER'){
		Application.state = 'PRACTICE';
	} else {
		Application.state = 'SET_GAME';
	}
	Application.hasIdentity = true;
	updateUI();
}

function thisUserJoinedGame(gameData){
	//THIS user successfully joined to SOMEONE ELSE's game
	processCreateGame(gameData, false);
	
	//Set application state
	Application.state = 'WAIT_SETTING_GAME';
	Application.hasIdentity = true;
	updateUI();
}

function loginRejected(response){
	var msg = 'Login unsuccessful! Game ID ' + $('#room').val()
			+ (response==='ERR_NO_SUCH_GAME'
						? ' does not exists.'
						: (response==='ERR_GAME_NOT_ACCESSIBLE'
									? ' is not accessible.'
									: ' tried with wrong login mode.'
						)
			);
	$('#pConnResult').html(msg);

	//Go back to 'what do you want?'
	Application.state = 'CONNECTED';
	Application.hasIdentity = false;
	updateUI();
}

function userDisconnected(user){
	console.log(`userDisconnected :: user=${user}`);
	//logically
	CLIENT_GAME.removeUserFromWaitingList(JSON.stringify(user));

	//on UI
	uiRefreshUsersList();
}

function startGame(users){
	CLIENT_GAME.clientPreInit();
	CLIENT_GAME.setUsers(users, false);//false==no reshuffle on users array
	
	//TBD: a lot of other things before anything can start on client side
	resetBoard();
	resetUsersUnderBoard();
	
	Application.state = 'IN_GAME';
	updateUI();
	console.log('Game started...');
}

function resetBoard(){
	//set board
	let task = {rows: CLIENT_BOARD.getRows(), cols: CLIENT_BOARD.getCols()};
	let html=$.templates('#tmplBoard').render(task);
	$('#dvCards').html(html);
	//console.log(html);
	console.log('Board rendered...');
}
function resetUsersUnderBoard(){
	let i=1;
	//console.log(`resetUsersUnderBoard :: CLIENT_GAME.users ${typeof CLIENT_GAME.users}`);
	for(let e of CLIENT_GAME.users()){
		let u = JSON.parse(e.data);
		let task = {
				"id"			: i++,
				"nameClass"		: "boardUserName",
				"pointsClass"	: "boardUserPoints",
				"pointsIdPfx"	: "ptsBoard",
				"avatarSrc"		: u.avatar,
				"name"			: u.name,
				"points"		: e.points
			};
		let html=$.templates('#tmplUserV').render(task);
		$('#dvUser'+task.id).html(html);
	}
	console.log('Users under board rendered...');
}

function resetCardInfoDivs(){
	$('#dvPic1').empty();
	$('#dvPic2').empty();
}

function selectCard(evt){
	let linPos = evt.data.linearPosition;
	console.log(`selectCard :: ${linPos}`);
	CLIENT_SOCKET.showCard(linPos);
}

function hideCard(linPos, forever){
	let idx=linPos;
	//remove from board when needed
	if(forever){
		$('#dvCard'+idx).addClass('hide');
		return;
	}
	//otherwise: simply flip it back
	//set background
	$('#dvCardBack'+idx).empty();
	$('#dvCardBack'+idx).html('');
	//rotate
	$('#dvCardFront'+idx).addClass('front');
	$('#dvCardFront'+idx).removeClass('card-flipped-front');
	$('#dvCardBack'+idx).addClass('back');
	$('#dvCardBack'+idx).removeClass('card-flipped-back');
}

function showCard(msg){
	let idx = msg["linearPosition"];
	let cinf = msg["cardInfo"];
	if(cinf==null){
		console.log(`showCard :: idx=${idx} -> no card info provided => no right to flip this card!!`);
		return;
	}
	let hasPic = !(cinf.url==null);
	console.log(`showCard :: idx=${idx}, hasPic=${hasPic}, cardID=${cinf.cardID}, foundPair: ${msg["foundPair"]}`);
	
	//immediately unbind Click event!
	$('#dvCard'+idx).unbind( "click" );
	
	//graphically
	if(hasPic){
		$('#dvCardBack'+idx).html('');
		var img = $('<img />').attr({
				'src': cinf.url,
				'class':'showPic',
				'alt': cinf.cardID
			});
		$('#dvCardBack'+idx).append(img);
	} else {
		$('#dvCardBack'+idx).empty();
		$('#dvCardBack'+idx).html( cinf.cardID );
	}
	//rotate
	$('#dvCardFront'+idx).removeClass('front');
	$('#dvCardFront'+idx).addClass('card-flipped-front');
	$('#dvCardBack'+idx).removeClass('back');
	$('#dvCardBack'+idx).addClass('card-flipped-back');
	
	//show card info
	showCardInfo(msg, $('#dvPic1').is(':empty') ? 'dvPic1' : 'dvPic2');
	
	if(msg["foundPair"]){
		//disable the pair
		let pair = msg["pair"];
		console.log(`  pair found=[${pair[0].linearPosition} , ${pair[1].linearPosition}]`);
		$('#dvCard'+pair[0].linearPosition).removeClass("enableFlip");
		$('#dvCard'+pair[0].linearPosition).unbind( "click" );
		$('#dvCard'+pair[1].linearPosition).removeClass("enableFlip");
		$('#dvCard'+pair[1].linearPosition).unbind( "click" );
		//update user points
		let users = msg["users"];
		refreshPointsInTurn(users);
		//wait a little bit and remove from board
		setTimeout(function(){
			 hideCard(pair[0].linearPosition, true);
			 hideCard(pair[1].linearPosition, true);
			 resetCardInfoDivs();
		},2000);
	}
}

function showCardInfo(msg, targetElem){
	let task = msg["cardInfo"];
	let html=$.templates('#tmplCardInfo').render(task);
	$('#'+targetElem).html(html);
}

function setupBoard(enable){
	$( "#dvCards" ).find( "div.card" ).not(".hide").each(
		function(){
			//regardless of currentuser watching/playing it, flip back all cards
			let linPos = parseInt($(this).attr('id').substr(6));
			hideCard(linPos);
			//enable/disable flip as requested
			if(enable){
				$(this).addClass("enableFlip");
				$(this).click( {"linearPosition": linPos}, selectCard );
			} else {
				$(this).removeClass("enableFlip");
				$(this).unbind( "click" );
			}
		}
	);
}

function setTurnInfo(inTxt, inClass){
	$('#pTurnInfo').empty();
	let span = $('<span />').addClass(inClass).html(inTxt);
	$('#pTurnInfo').append(span);
}

function setActiveUser(activeUser, usersJSON){
	let users = JSON.parse(usersJSON);
	let activeUserJSON = JSON.stringify(activeUser);
	console.log(`setActiveUser :: activeUserJSON=${activeUserJSON}, users[0]=${JSON.stringify(users[0].data)}`);
	for(let i=0; i<users.length; i++){
		if( JSON.stringify(users[i].data) == activeUserJSON ){
			$('#dvUser'+(i+1)).addClass('active');
			//console.log(`setActiveUser :: ${i+1} activated`);
		} else {
			$('#dvUser'+(i+1)).removeClass('active');			
		}
	}//next user
}

function setupTurn(enable, msg){
	//msg :: hopefully received: {gameID: , targetUser: user.strJSON, activeUser: user.strJSON, users: Array of {human:,data:,points:,time:}, remainingSec: }
	//clear card detail
	resetCardInfoDivs();
	//enable/disable card selection
	setupBoard(enable);
	//refresh points
	let users = msg["users"];
	refreshPointsInTurn(users);
	let activeUser = msg["activeUser"];
	setActiveUser(activeUser, users);
	//write remaining secs
	remainingSec(msg["remainingSec"]);	
}

function startTurn(msg){
	setupTurn(true, msg);
	setTurnInfo('Your turn!', 'blue');
}

function watchTurn(msg){
	setupTurn(false, msg);
	setTurnInfo("Someone else's turn", 'black');
}

function stopTurn(msg){
	//disable board
	setupBoard(false);
	//refresh user points
	let users = msg["users"];
	refreshPointsInTurn(users);
}

function refreshPointsInTurn(inUsersJSON){
	let users = JSON.parse(inUsersJSON);
	//hopefully received: Array of {human:,data:,points:,time:}
	for(let i=0; i<users.length; i++){
		refreshPoints(i, users[i]);
	}	
}

function refreshPoints(i, user){
	//hopefully received: Array of {human:,data:,points:,time:}
	let dvid = '#ptsBoard'+(i+1);
	$(dvid).html(user.points);
	console.log(`refreshPoints :: i=${i}, dvid=${dvid} -> ${user.points} pts`);
}

function gameOver(msg){
	Application.state = 'GAME_FINISHED';
	
	//extract results
	let users = JSON.parse(msg["users"]);
	let elems = users
					.map(e => {return {"avatarSrc": JSON.parse(e.data).avatar, "name": JSON.parse(e.data).name, "points": e.points, "time": e.time};})
					.sort(function(a,b){
							if(a.points > b.points){
								return -1;
							} else if(a.points == b.points && a.time < b.time){
								return -1;
							} else return 1;
						}
					)
					;
	
	//render results
	let task = {"elems": elems};
	let html=$.templates('#tmplResults').render(task);
	$('#dvResults').html(html);
	
	updateUI();
	console.log('Game over...');
	
	$('#btnNewGame').click(function(){
		Application.state = 'CONNECTED';
		updateUI();
		$('#btnNewGame').unbind("click");
	});
}


function testUI() {
var task = {rows: 4, cols: 4};
var html=$.templates('#tmplBoard').render(task);
$('#dvCards').html(html);
//console.log(html);
console.log('Board rendered...');

//Profile when not logged yet
task = {tableHeaderClass: "tableHeader",
		listCaption: "Profile",
		nameClass: "userName",
		elems: [
			{avatarSrc: "https://image.flaticon.com/icons/png/128/2432/2432846.png", name: "No name"}
		]
		};
html=$.templates('#tmplUserList').render(task);
$('#dvProfile').html(html);
//console.log(html);
console.log('Profile when not logged yet rendered...');

//Game initiated by
task = {avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667250.png", name: "Mr. White"};
html=$.templates('#tmplUserH1').render(task);
$('#tblInitiatedBy').html(html);
//console.log(html);
console.log('Profile when not logged yet rendered...');

//User list that joined already
task = {tableHeaderClass: "tableHeader",
		listCaption: "Joined already",
		nameClass: "userName",
		elems: [
			{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667325.png", name: "Sarah Windsor"},
			{avatarSrc: "https://image.flaticon.com/icons/png/128/1077/1077114.png", name: "John Doe"}
		]
		};
html=$.templates('#tmplUserList').render(task);
$('#dvJoinedAlready').html(html);
//console.log(html);
console.log('Users joined already rendered...');

//Users under the board
task = {elems: [
			{id: 1, nameClass: "boardUserName", pointsClass: "boardUserPoints", pointsIdPfx: "ptsBoard", avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667325.png", name: "Sarah Windsor", points: "7"},
			{id: 2, nameClass: "boardUserName", pointsClass: "boardUserPoints", pointsIdPfx: "ptsBoard", avatarSrc: "https://image.flaticon.com/icons/png/128/1077/1077114.png", name: "John Doe", points: "6"}
		]
		};
for(var elem of task.elems){
	html=$.templates('#tmplUserV').render(elem);
	$('#dvUser'+elem.id).html(html);
	//console.log(html);
}
console.log('Users under Board rendered...');

//Picture info next to the board
task = {
	 "cardID":		"P1"
	,"url":			"https://upload.wikimedia.org/wikipedia/commons/4/41/Barend_van_Orley_-_Portrait_of_Charles_V_-_Google_Art_Project.jpg"
	,"artist":		"Barend van Orley"
	,"creationDate":"1519"
	,"caption":		"Portrait of Charles V"
	,"otherInfo":	"Charles V. (1500-1558) Holy Roman Emperor, Habsburg"
};
html=$.templates('#tmplCardInfo').render(task);
$('#dvPic1').html(html);
task = {
	 "cardID":		"P11"
	,"url":			"https://upload.wikimedia.org/wikipedia/commons/a/af/Darnley_stage_3.jpg"
	,"artist":		"unknown"
	,"creationDate":"1554"
	,"caption":		"Elizabeth I"
	,"otherInfo":	"Elizabeth I. (1533–1603) King of England, Tudor<br/>Called the 'Darnley Portrait' after a previous owner"
};
html=$.templates('#tmplCardInfo').render(task);
$('#dvPic2').html(html);

//Results
task = {elems: [
			{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667325.png", name: "Sarah Windsor", points: "10"},
			{avatarSrc: "https://image.flaticon.com/icons/png/128/1077/1077114.png", name: "John Doe", points: "6"}
		]
		};
html=$.templates('#tmplResults').render(task);
$('#dvResults').html(html);
//console.log(html);
console.log('Results rendered...');

//render with tmplResultsNew
html=$.templates('#tmplResultsNew').render(task);
//console.log(html);
console.log('Same rendered with tmplResultsNew...');

//render game options
task = {elems: CONSTANTS.getNumberOfCardsOptions()};
html=$.templates('#tmplSelectOptions').render(task);
$('#setNumCards').html(html);
task = {elems: CONSTANTS.getLimitThinkingTimeOptions()};
html=$.templates('#tmplSelectOptions').render(task);
$('#setLimitThinkingTime').html(html);
task = {elems: CONSTANTS.getMaxHumanPlayersOptions()};
html=$.templates('#tmplSelectOptions').render(task);
$('#setMaxHumanPlayers').html(html);

console.log('Game options rendered...');
}
