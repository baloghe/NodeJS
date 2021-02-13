var Constants = (function(){

	function Constants(){

		this.getNumberOfCardsOptions = function (){
			return [ {"value":"8pairs","caption":"8 pairs"}
					,{"value":"16pairs","caption":"16 pairs"}
					,{"value":"32pairs","caption":"32 pairs"}
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
		
	}

	return Constants;

}());
var CONSTANTS = new Constants();

var Application = {
state : 'OPENED' /*,
isConnected : false,
isLoginStarted: false,
isLoginFinished: false
*/
}

var Game = (function() {
    function Game(inGameID, inInitiatedBy) {
        this.getGameID = function() {
            return inGameID;
        };
        this.getInitiatedBy = function() {
            return inInitiatedBy;
        };
    }

    return Game;
}());

var CLIENT_GAME = null;


//Module export
try {
	module.exports = Game;
} catch (error) {
	//do nothing, locally this makes no sense
}

