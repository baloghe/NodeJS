var Constants = (function(){

function Constants(){

	//TBD

}

return Constants;

})();

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

