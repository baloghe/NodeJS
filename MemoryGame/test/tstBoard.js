
let CARDS_INFO = 
[
{
	 "cardID":		"P1"
	,"url":			"https://upload.wikimedia.org/wikipedia/commons/4/41/Barend_van_Orley_-_Portrait_of_Charles_V_-_Google_Art_Project.jpg"
	,"artist":		"Barend van Orley"
	,"creationDate":"1519"
	,"caption":		"Portrait of Charles V"
	,"otherInfo":	"Charles V. (1500-1558) holy roman emperor"
},
{
	 "cardID":		"P2"
	,"url":			"https://upload.wikimedia.org/wikipedia/commons/0/02/Joos_van_Cleve_-_Portrait_of_Francis_I%2C_King_of_France_%28ca._1532-1533%29_-_Google_Art_Project.jpg"
	,"artist":		"Joos van Cleve"
	,"creationDate":"around 1532-33"
	,"caption":		"Fran&#231;ois I"
	,"otherInfo":	"Fran&#231;ois I. (1494-1547) king of France"
}
];

$( document ).ready(function(){
	testUI();

	//test classes
	testCardInfo();
	testCard();
	testDeck();
	testEmptyDeck();
	testBoard();
	
	//set Board on button click
	$('#btnShuffle').click( setBoard );

});

function setBoard(){
	console.log(`--- enter setBoard ---`);
	
	let deck = new Deck(
				 16
				,false
				,CARDS_INFO.map(
						i => {return new CardInfo( i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo )}
					)
			);	
	let board = new Board(4, 4);
	
	let task = {rows: board.getRows(), cols: board.getCols()};
	let html=$.templates('#tmplBoard').render(task);
	$('#dvCards').html(html);
	//console.log(html);
	console.log('Board rendered...');
	
	for(const c of deck.cards()){
		//set visibility randomly
		if(Math.random() > 0.5){
			c.found(true);
		}
		showCard(c);		
		console.log(`  ${c.getLinearPos()}: found=${c.found()}, pic: ${c.hasPic() ? c.info().getCaption() : 'no pic'}`);
		
	}//next card
	
	$('#btnInvert').click( function(){
		for(const c of deck.cards()){
			c.found(!c.found());
			showCard(c);
		}
	});
	
	console.log(`--- leave setBoard ---`);
}

function showCard(c){
	let idx = c.getLinearPos();
	if(c.found()){
		//set background
		if(c.hasPic()){
			$('#dvCardBack'+idx).html('');
			var img = $('<img />').attr({
					'src': c.info().getUrl(),
					'class':'showPic'
				});
			$('#dvCardBack'+idx).append(img);
		} else {
			$('#dvCardBack'+idx).empty();
			$('#dvCardBack'+idx).html( c.info().getCardID() );
		}
		//rotate
		$('#dvCardFront'+idx).removeClass('front');
		$('#dvCardFront'+idx).addClass('card-flipped-front');
		$('#dvCardBack'+idx).removeClass('back');
		$('#dvCardBack'+idx).addClass('card-flipped-back');
	} else {
		//set background
		$('#dvCardBack'+idx).empty();
		$('#dvCardBack'+idx).html('');
		//rotate
		$('#dvCardFront'+idx).addClass('front');
		$('#dvCardFront'+idx).removeClass('card-flipped-front');
		$('#dvCardBack'+idx).addClass('back');
		$('#dvCardBack'+idx).removeClass('card-flipped-back');		
	}
}

function testBoard(){
	console.log(`--- enter testBoard ---`);
	
	let deck = new Deck(
				 16
				,false
				,CARDS_INFO.map(
						i => {return new CardInfo( i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo )}
					)
			);	
	let board = new Board(4, 4);
	
	let deckCards = Array.from({length: deck.getSize()}).map((e,i) => deck.getCard(i));
	console.log(`  full deck:\n${deckCards.map(e => '(' + board.getRCPos(e.getLinearPos()).row + ', ' + board.getRCPos(e.getLinearPos()).col + ') :: ' + e.info().getCardID() + ( e.hasPic() ? ' -> ' + e.info().getCaption() : '' )).join('\n')}`);
	
	console.log(`--- leave testBoard ---`);
}

function testEmptyDeck(){
	console.log(`--- enter testEmptyDeck ---`);
	
	let deck = new Deck(
				 16
				,true
			);
	let deckCards = Array.from({length: deck.getSize()}).map((e,i) => deck.getCard(i));
	console.log(`  full deck: ${deckCards.map(e => e.getLinearPos()).join('\n')}`);
	
	console.log(`--- leave testEmptyDeck ---`);
}

function testDeck(){
	console.log(`--- enter testDeck ---`);
	
	let deck = new Deck(
				 16
				,false
				,CARDS_INFO.map(
						i => {return new CardInfo( i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo )}
					)
			);
			
	let deckCards = Array.from({length: deck.getSize()}).map((e,i) => deck.getCard(i));
	let hasPic = deckCards.filter(e=>e.hasPic());
	console.log(`  hasPic: ${hasPic.map(e => {return e.getLinearPos() + ' -> ' + e.info().getCardID() + ": " + e.info().getCaption()}).join(", ")}`);
	console.log(`  full deck: ${deckCards.map(e => e.getLinearPos() + ' :: ' + e.info().getCardID() + ( e.hasPic() ? ' -> ' + e.info().getCaption() : '' )).join('\n')}`);
	
	console.log(`--- leave testDeck ---`);
}

function testCard(){
	console.log(`--- enter testCard ---`);
	
	let i = CARDS_INFO[0];
	let ci = new CardInfo(i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo);
	let c3 = new Card(3);
	let c5 = new Card(5);
	
	console.log(`  testCard / C3 :: typeof = ${typeof c3}, linearPos=${c3.getLinearPos()}, info=${c3.info()}, hasPic=${c3.hasPic()}`);
	
	c5.info(ci);
	c5.hasPic(true);
	console.log(`  testCard / C5 :: typeof = ${typeof c5}, linearPos=${c5.getLinearPos()}, info=${c5.info()}`);
	console.log(`    hasPic=${c5.hasPic()}, info.cardID=${c5.info().getCardID()}, info.artist=${c5.info().getArtist()}`);
	
	
	console.log(`--- leave testCard ---`);
}

function testCardInfo(){
	console.log(`--- enter testCardInfo ---`);
	
	let i = CARDS_INFO[0];
	let ci = new CardInfo(i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo);
	console.log(`  testCardInfo :: typeof = ${typeof ci}, cardID=${ci.getCardID()}, artist=${ci.getArtist()}, caption=${ci.getCaption()}, url=${ci.getUrl()}`);
	
	ci.cardID = 'MODIFIED';
	console.log(`  after modification :: typeof = ${typeof ci}, cardID=${ci.getCardID()}, artist=${ci.getArtist()}, caption=${ci.getCaption()}, url=${ci.getUrl()}`);
	
	console.log(`--- leave testCardInfo ---`);
}

function testUI() {
	let task = {rows: 4, cols: 4};
	let html=$.templates('#tmplBoard').render(task);
	$('#dvCards').html(html);
	//console.log(html);
	console.log('Board rendered...');
}
