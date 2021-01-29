
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
} else if( Application.state === 'LOGGING_IN' ){
	$('#btnConnect').prop('disabled', true);
	$('#btnPlayAgainstComputer').prop('disabled', true);
	$('#scStartGame').removeClass('hide');
	$('#scGameSettings').addClass('hide');
	$('#scGame').addClass('hide');
	$('#scResults').addClass('hide');
} else if( Application.state === 'SET_GAME' ){
	$('#btnConnect').prop('disabled', true);
	$('#btnPlayAgainstComputer').prop('disabled', true);
	$('#scStartGame').addClass('hide');
	$('#scGameSettings').removeClass('hide');
	$('#scGame').addClass('hide');
	$('#scResults').addClass('hide');
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
if( !Game.currentUser ){
	Game.currentUser = new User(inName, inAvatarSrc);
} else {
	Game.currentUser.name = inName;
	Game.currentUser.avatar = inAvatarSrc;
}

//on local page
updateProfileOnPage(inName, inAvatarSrc);

//update UI
updateUI();
}

function userLoggedIn(inUser){
//logically
if(Game.otherUsers == null){
	Game.otherUsers = new Set();
}
Game.otherUsers.add(inUser);

//on UI
if(Application.state === 'SET_GAME'){
	task = {tableHeaderClass: "tableHeader",
			listCaption: "Users",
			nameClass: "userName",
			elems: Game.otherUsers.values().map((e)=>{return {avatarSrc: e.avatar, name: e.name};})
			/*[
				{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667325.png", name: "Sarah Windsor"},
				{avatarSrc: "https://image.flaticon.com/icons/png/128/1077/1077114.png", name: "John Doe"},
				{avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667250.png", name: "Mr. White"}
			]*/
			};
	html=$.templates('#tmplUserList').render(task);
	$('#dvUsers').html(html);
}
}

$( document ).ready(function(){
testUI();
updateUI();
connectToServer();

/* Avatar chooser popup */
$('#btnConnect').click(function(e){
	console.log('#btnConnect clicked!');
	Application.state = 'LOGGING_IN';
	updateUI();
	//show avatar chooser
	$('#dvAvChooser').popup('show');
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
	loginToServer();
	$('#dvAvChooser').popup('hide');
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

//User list logged in
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
}
