$( document ).ready(function() {
	var task = {rows: 4, cols: 4};
	var html=$.templates('#tmplBoard').render(task);
	$('#dvCards').html(html);
	console.log(html);
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
	console.log(html);
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
	console.log(html);
	console.log('User list rendered...');

	//Game initiated by
	task = {avatarSrc: "https://image.flaticon.com/icons/png/128/3667/3667250.png", name: "Mr. White"};
	html=$.templates('#tmplUserH1').render(task);
	$('#tblInitiatedBy').html(html);
	console.log(html);
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
	console.log(html);
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
		console.log(html);
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
	console.log(html);
	console.log('Results rendered...');

	//render with tmplResultsNew
	html=$.templates('#tmplResultsNew').render(task);
	console.log(html);
	console.log('Same rendered with tmplResultsNew...');
});