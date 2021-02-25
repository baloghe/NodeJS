
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
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'JOIN_GAME' || Application.state === 'START_NEW_GAME' ){
		$('#btnConnect').prop('disabled', true);
		$('#btnPlayAgainstComputer').prop('disabled', true);
		$('#scStartGame').removeClass('hide');
		$('#scGameSettings').addClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
	} else if( Application.state === 'SET_GAME' || Application.state === 'WAIT_SETTING_GAME' || Application.state === 'WAIT_FOR_START' ){
		$('#tblLoginButtons').addClass('hide');
		$('#scGameSettings').removeClass('hide');
		$('#scGame').addClass('hide');
		$('#scResults').addClass('hide');
		enableSettings( Application.state === 'SET_GAME' );
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
function enableSettings(inEnable){
	$('#setNumCards').prop('disabled', (!inEnable));
	$('#setLimitThinkingTime').prop('disabled', (!inEnable));
	$('#chkComputerPlayer').prop('disabled', (!inEnable));
	$('#setMaxHumanPlayers').prop('disabled', (!inEnable));
	$('#setMaxHumanPlayers').prop('disabled', (!inEnable));
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
	
	//on UI
	$('#setNumCards').val(CLIENT_GAME.getNumCards());
	$('#setLimitThinkingTime').val(CLIENT_GAME.getLimitThinkingTime());
	$('#chkComputerPlayer').prop('checked', CLIENT_GAME.computerPlayerAllowed());
	$('#setMaxHumanPlayers').val(CLIENT_GAME.getMaxHumanPlayers());
	
	updateUI();
	remainingSecToStart(CONSTANTS.getWaitSecBeforeStart());
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
	Application.state = 'SET_GAME';
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

function startTurn(msg){
	//hopefully received: {gameID: , targetUser: user.strJSON, users: game.getUsersJSON(), remainingSec: }
	//enable everything
	//refresh points
	let users = msg["users"];
	for(let i=0; i<users.length; i++){
		refreshPoints(i, users[i]);
	}
	//write remaining secs
	remainingSec(msg["remainingSec"]);
}

function watchTurn(msg){
	//hopefully received: {gameID: , targetUser: user.strJSON, users: game.getUsersJSON(), remainingSec: }
	//disable everything
	//refresh points
	let users = msg["users"];
	for(let i=0; i<users.length; i++){
		refreshPoints(i, users[i]);
	}
	//write remaining secs
	remainingSec(msg["remainingSec"]);
}

function refreshPoints(i, user){
	$('#ptsBoard'+(i+1)).html(user.points);
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

//User list logged in   -- discarded and replaced with Game ID
/*
task = {tableHeaderClass: "tableHeader",
		listCaption: "Users",
		nameClass: "userName",
		elems: [
			{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667325.png", name: "Sarah Windsor"},
			{avatarSrc: "https://image.flaticon.com/icons/png/128/1077/1077114.png", name: "John Doe"},
			{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667250.png", name: "Mr. White"}
		]
		};
html=$.templates('#tmplUserList').render(task);
$('#dvUsers').html(html);
//console.log(html);
console.log('User list rendered...');
*/

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
