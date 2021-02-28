var Constants = (function(){

	function Constants(){
		
		let _waitSec = {
				"none"	: 60,
				"10sec"	: 10,
				"20sec"	: 20
			};
		
		let _layout = {
				"8pairs"	: {"r": 4, "c": 4},
				"12pairs"	: {"r": 6, "c": 4},
				"20pairs"	: {"r": 8, "c": 5}
			};
		let _deckSize = {
				"8pairs"	: 16,
				"12pairs"	: 24,
				"20pairs"	: 40
			};

		this.getNumberOfCardsOptions = function (){
			return [ {"value":"8pairs","caption":"8 pairs"}
					,{"value":"12pairs","caption":"12 pairs"}
					,{"value":"20pairs","caption":"20 pairs"}
				   ];
		}
		
		this.getLimitThinkingTimeOptions = function (){
			return [ {"value":"none","caption":"none"}
					,{"value":"10sec","caption":"10 secs"}
					,{"value":"20sec","caption":"20 secs"}
				   ];
		}
		
		this.getMaxHumanPlayersOptions = function (){
			return [ {"value":"2","caption":"2"}
					,{"value":"3","caption":"3"}
					,{"value":"4","caption":"4"}
				   ];
		}
		
		this.getWaitSecBeforeStart = function (){return 10;}
		
		this.getLayout = function(pairs){
			return _layout[pairs];
		}
		
		this.getDeckSize = function(pairs){
			return _deckSize[pairs];
		}
		
		this.getLimitThinkingTime = function(opt){
			return _waitSec[opt];
		}
		
	}

	return Constants;

}());
var CONSTANTS = new Constants();

var Application = {
	state : 'OPENED' ,
	hasIdentity : false
}

var Game = (function() {
    function Game(inGameID, inInitiatedBy) {
		let _gameID = inGameID;
		let _initiatedBy = inInitiatedBy;
		let _waitingList = new Set();
		let _gameConstants = null;
		let _gameConstantsSet = false;
		let _deck = null;
		let _users = null; //Array of {human: true/false, data: JSON string, points: int, time: 0}
		let _firstGuess = null; //cardID
		let _guessStack = null; //Array of {linearPosition, cardID}, unshifted with new guess
		let _userPointer = null;
		let _cardsFound = null;
		
		let _clientGuess = [];
		
        this.getGameID = function() {
            return _gameID;
        };
        this.getInitiatedBy = function() {
            return _initiatedBy;
        };
		
		this.setConstants = function(gc){
			//gc received looks like this:
			//	numCards:			
			//	limitThinkingTime:	
			//	computerPlayer:		
			//	maxHumanPlayers:	
			_gameConstants = gc;
			_gameConstantsSet = true;
		};
		this.isConstantsSet = function(){return _gameConstantsSet;};
		this.getGameConstantsJSON = function(){return _gameConstants;};
		
		this.addUserToWaitingList = function(u){
			_waitingList.add(u);
		};		
		this.removeUserFromWaitingList = function(u){
			_waitingList.delete(u);
		};
		this.getWaitingList = function(){return _waitingList;};
		
		this.getNumCards = function(){return parseInt(_gameConstants.numCards);};
		this.getLimitThinkingTime = function(){return CONSTANTS.getLimitThinkingTime(_gameConstants.limitThinkingTime);};
		this.computerPlayerAllowed = function(){return _gameConstants.computerPlayer;};
		this.getMaxHumanPlayers = function(){return parseInt(_gameConstants.maxHumanPlayers);};
		
		this.serverPreInit = function(cardInfoArr){
			//create deck by selecting pictures and form pairs of cards
			//cardInfoArr :: Array of {cardID, url, artist, creationDate, caption, otherInfo}
			_deck = new Deck(
					 CONSTANTS.getDeckSize( _gameConstants["numCards"] )
					,false
					,cardInfoArr.map(
							i => {return new CardInfo( i.cardID, i.url, i.artist, i.creationDate, i.caption, i.otherInfo )}
						)
				);
		};
		
		this.clientPreInit = function(){
			//create deck without any knowledge on card content
			_deck = new Deck(
					 CONSTANTS.getDeckSize( _gameConstants["numCards"] )
					,true
				);
			//generate Board
			let bDim = CONSTANTS.getLayout( _gameConstants["numCards"] );
			CLIENT_BOARD = new Board(bDim.r, bDim.c);
		};
		
		this.serverStartGame = function(){
			_guessStack = []; 
			_userPointer = 0;
			_cardsFound = 0;
			console.log(`Game.serverStartGame :: _users[_userPointer]=${JSON.parse(_users[_userPointer].data).name}`);
		};
		
		this.setUsers = function(userArr, shuffle){
			_users = userArr;
			//append points=0 and time=0 for each user
			for(const u of _users){
				u.points = 0;
				u.time = 0;
			}
			//server-side: selected users are reshuffled
			//client-side: already reshuffled list is received, no further shuffle is needed
			if(shuffle){
				shuffleArray(_users);
			}
			console.log(`Game.setUsers :: len=${_users.length}`);
		};
		
		this.getUsersJSON = function(){return JSON.stringify(_users);};
		
		//iterator over the users in the Game
		this.users = function(){
			let i=0;
			return {
				[Symbol.iterator](){
					return this;
				},
				next: () => ({
					done: i >= _users.length,
					value: _users[i++]
				})
			};
		};
		
		this.getActualUser = function(){
			return _users[_userPointer];
		};
		
		this.incUserPoint = function(userJSON){
			for(let u of _users){
				if(userJSON==u["data"]){
					u.points++;
					return;
				}//endif
			}//next u
		};
		
		this.incUserTime = function(userJSON, timeInSec){
			for(let u of _users){
				if(userJSON==u["data"]){
					u.time += timeInSec;
					return;
				}//endif
			}//next u
		};
		
		this.showCardClient = function(linPos){
			//current user made a guess
			if(_clientGuess.length==0 || _clientGuess.length > 1){
				_clientGuess = [];
			}
			_clientGuess.push(linPos);
		};
		
		this.getGuessClient = function(){return _clientGuess;};
		
		this.showCard = function(inLinPos, inUser){
			//someone made a guess
			let ret = {
						response: '',
						info: null,
						roundFinished: false,
						foundPair: false,
						pair: [],
						gameFinished: false
					};
			
			//check if user and given linear position are valid
			if(inLinPos==null || inLinPos < 0 || inLinPos >= _deck.getSize()){
				ret.response = 'ERR_GUESS_INVALID_LINPOS';
				return ret;
			} else if(inUser != _users[_userPointer].data){
				ret.response = 'ERR_GUESS_INVALID_USER';
				return ret;
			} else {
				ret.response = 'GUESS_VALID';
			}
			
			//valid guess => let's see it
			ret.info = _deck.getCard(inLinPos).getInfoObj();
			let cid = ret.info.cardID;
			_guessStack.unshift({linearPosition: inLinPos, cardID: cid});
			if(_firstGuess==null){
				_firstGuess = cid;
				return ret;
			} else {
				ret.foundPair = ( _firstGuess==cid );
				if( ret.foundPair ){
					//pair found => user remains in turn and points augmented
					ret.foundPair = true;
					ret.pair.push(_guessStack[0]);
					ret.pair.push(_guessStack[1]);
					_users[_userPointer].points++;
					_cardsFound += 2;
				} else {
					//different cards found => advance pointer
					ret.roundFinished = true;					
					_userPointer++;
					if(_userPointer >= _users.length){
						_userPointer = 0;
					}
				}
				//2nd guess made => empty first guess
				_firstGuess = null;
				//all cards found => game finished
				if(_cardsFound == _deck.getSize()){
					ret.gameFinished = true;
				}
			}
			return ret;
		};
		
    }

    return Game;
}());
var CLIENT_GAME = null;

var CardInfo = (function() {
    function CardInfo(cardID, url, artist, creationDate, caption, otherInfo) {
		let _cardID = cardID;
		let _url = url;
		let _artist = artist;
		let _creationDate = creationDate;
		let _caption = caption;
		let _otherInfo = otherInfo;
		
        this.getCardID = function() {
            return _cardID;
        };
        this.getUrl = function() {
            return _url;
        };
        this.getArtist = function() {
            return _artist;
        };
        this.getCreationDate = function() {
            return _creationDate;
        };
        this.getCaption = function() {
            return _caption;
        };
        this.getOtherInfo = function() {
            return _otherInfo;
        };
		this.getInfoObj = function(){
			return {cardID:_cardID, url:_url, artist:_artist, creationDate:_creationDate, caption:_caption, otherInfo:_otherInfo};
		};
    }

    return CardInfo;
}());

var Card = (function() {
    function Card(inLinearPos) {
		let _linPos = inLinearPos;
		let _hasPic = false;
		let _info = null;
		let _found = false;
		let _foundBy = null;
		
        this.getLinearPos = function() {
            return _linPos;
        };
		
		this.hasPic = function(b) {
			if(typeof b !== 'undefined') {
				_hasPic = (b ? true : false);
            } else return _hasPic;
        };
		
		this.info = function(data) {
            if(typeof data !== 'undefined') {
				_info = data;
            } else return _info;
        };
		
		this.getInfoObj = function(){
			return _info==null ? {} : _info.getInfoObj();
		};
		
		this.found = function(b) {
			if(typeof b !== 'undefined') {
				_found = (b ? true : false);
            } else return _found;
        };
		
		this.foundBy = function(data) {
            if(typeof data !== 'undefined') {
				_foundBy = data;
				this.found( (data!=null) );
            } else return _foundBy;
        };
		
    }

    return Card;
}());

/* source: JavaScript implementation of the Durstenfeld shuffle, https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

var Deck = (function() {
	function Deck(inSize, isEmpty, cardInfoArray) {
		
		let _cardInfoArray = cardInfoArray || []; //must work without any pictures as well!
		let _numPairs = Math.floor(inSize/2);
		let _size = _numPairs * 2;
		let _deck = null;
		
		//Pictures and info in general should only be added at creation on server side
		//Client side generates an 'empty' deck where even pairs are not marked
		if(!isEmpty){
			//more picture than needed => pick a random subset for the game
			if(_cardInfoArray.length > _numPairs){
				shuffleArray(_cardInfoArray);
			}
			
			//prepare array by selecting each pictures twice
			let d = Array.from({length: _size}).map(
							(e,i)=>{
								let idx = Math.floor(i/2);
								if(idx < _cardInfoArray.length){
									//console.log(`Deck :: ${i} -> ${_cardInfoArray[idx].getCaption()}`);
									return _cardInfoArray[idx];
								} else {
									//console.log(`Deck :: ${i} -> null}`);
									return new CardInfo("Q"+idx, null, null, null, null, null);
								}
							}
						);
			//shuffle them
			shuffleArray(d);
			
			//final deck: each item represented by a proper Card object
			_deck = Array.from({length: _size}).map(
						(e,i) => {
							let ret = new Card(i);
							ret.info( d[i] );
							if(ret.info().getUrl()){
								ret.hasPic(true);
							}
							console.log(`_deck :: ${i} -> ${ret.getLinearPos()}: ${ret.info() != null ? ret.info().getCaption() : false}`);
							return ret;
						}
					);
		}//isEmpty
		else {
			_deck = Array.from({length: _size}).map(
						(e,i) => new Card(i)
					);
		}
					
		this.getSize = function(){return _size;};
		this.getNumPairs = function(){return _numPairs;};
					
		this.getCard = function(i){
			return _deck[i];
		};
		
		//iterator over the cards in the Deck
		this.cards = function(){
			let i=0;
			return {
				[Symbol.iterator](){
					return this;
				},
				next: () => ({
					done: i >= _size,
					value: _deck[i++]
				})
			};
		};
    }
	
    return Deck;
}());

var Board = (function() {
    function Board(inRow, inCol) {
		let _rows = inRow;
		let _cols = inCol;
		
        this.getRows = function() {
            return _rows;
        };
        this.getCols = function() {
            return _cols;
        };
        this.getLinearPos = function(r, c) {
            return (r-1) * _cols + c;
        };
        this.getRCPos = function(idx) {
            return {
					"row": Math.floor(idx / _cols)+1,
					"col": idx % _cols + 1
					};
        };
    }

    return Board;
}());
var CLIENT_BOARD = null;


//Module export
try {
	module.exports = {
			Game: 		Game,
			Constants:	Constants,
			CardInfo:	CardInfo,
			Card:		Card,
			Deck:		Deck
		};
} catch (error) {
	//do nothing, locally this makes no sense
}

