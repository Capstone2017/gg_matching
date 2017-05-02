var GameInstance = (function(readyList) {
"use strict";
var instance;
function Game(readyList) { // Constructor
    if (instance) return instance;
	instance = this;

	var player1;
 	var player2;
    var player1_rating;
	var player2_rating;

	var playerCurrentTurn;
	var gameOver = false;
    var turnBased = false;
    var allowMoves = false;
    this.setPlayer1(readyList[0]);
    this.setPlayer2(readyList[1]);
	
	var winner;
}

Game.prototype.initializeTurnGame = function() {
	if (this.getGameOver()) { throwError("initializeTurnGame()", "cant be called when game is over"); }
    this.playerCurrentTurn = this.player1;
    this.turnBased = true;
}

Game.prototype.setPlayer1 = function(id) {
    this.player1 = id;
	this.player1_rating = Framework.getRating(id);
    //console.log("Player 1 = " + this.player1);
}

Game.prototype.setPlayer2 = function(id) {
    this.player2 = id;
	this.player2_rating = Framework.getRating(id);
    //console.log("Player 2 = " + id);
}

Game.prototype.getPlayer1 = function() {
    return this.player1;
}

Game.prototype.getPlayer2 = function() {
    return this.player2;
}

Game.prototype.currentTurn = function() {
	if (this.getGameOver()) { throw new Error("currentTurn() cant be called when game is over"); }
    return this.playerCurrentTurn;
}

Game.prototype.nextPlayer = function() {
	if (this.getGameOver()) { throw new Error("nextPlayer() cant be called when game is over"); }
	if (this.currentTurn() == this.player1) return this.player2;
	else return this.player1;
}

Game.prototype._endClientTurn = function() {
	if (this.getGameOver()) { throw new Error("_endClientTurn() cant be called when game is over"); }
    if (this.currentTurn() == this.player1) this.playerCurrentTurn = this.player2;
    else this.playerCurrentTurn = this.player1;
}

Game.prototype.endTurn = function() {
	if (this.getGameOver()) { throw new Error("endTurn() cant be called when game is over"); }
	this._endClientTurn();
	// Might need to hide this somehow so data cant be confused
	Framework.sendData({"type":"gameInfo", "endTurn":true});
}


Game.prototype.movesAllowed = function() {
	if (this.getGameOver()) { throw new Error("movesAllowed() cant be called when game is over"); }
    if (this.turnBased) {
        return this.currentTurn() == getPeerId();
    }
    else {
        return this.allowMoves;
    }
}

Game.prototype.setAllowMoves = function(val) {
	if (this.getGameOver()) { throw new Error("setAllowMoves(val) cant be called when game is over"); }
	if (typeof val != 'boolean') { throw new Error("setAllowMoves(boolean v) takes a boolean as a parameter not " + typeof val); }
	this.allowMoves = val;
}

// posts information to the server to update ratings and scores for both players
Game.prototype._setClientGameOver = function() {
	var result = 0;
	this.gameOver = true;
	
	var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
	Framework.endGameCleanUp();
	if (this.winner == Framework.getPeerId()) {
		result = 1;	
	}
	else if (this.winner == 0) {
		result = .5
	}

	var myRating;
	var theirRating;	

	if (Framework.getPeerId()  == this.player1) {
		theirRating = this.player2_rating;
		myRating = this.player1_rating;
	}
	else {
		theirRating = this.player1_rating;
		myRating = this.player2_rating;
	}

	var game_id = Framework.getGameId();
	var self = this;
	$.ajax({
		type: "POST",
		url: "/updateScore",
		data: {"id": id_token,"result":result, "myRating":myRating, "theirRating":theirRating, "gameId": game_id},
		success: function(data) {
			if (Framework.getPeerId() == self.player1) {
				self.player1_rating = parseInt(self.player1_rating) + parseInt(data.myRatingGain);
				self.player2_rating =  parseInt(self.player2_rating) +  parseInt(data.theirRatingGain);
				Framework.updateRatingDisplay(self.player1_rating);
			}
			else {
				self.player1_rating = parseInt(self.player1_rating) + parseInt(data.theirRatingGain);
                self.player2_rating =  parseInt(self.player2_rating) + parseInt(data.myRatingGain);
				Framework.updateRatingDisplay(self.player2_rating);
			}
		}
	});
	
}

Game.prototype.setWinner = function(id) {
	this.winner = id;
}

Game.prototype.setGameOver = function(isWinner) {
	this._setClientGameOver();
	Framework.sendData({"type":"gameInfo", "gameOver":true});
}

Game.prototype.getGameOver = function() {
	return this.gameOver;
}

Game.prototype._rematch = function() {
	this.gameOver = false;
	this.winner = undefined;
}

Game.prototype.rematch = function() {
	if (!this.gameOver) { throw new Error("rematch() cant be called when game is not over use setGameOver()"); }
	this._rematch();
}

function throwError(func, msg) {
	throw new Error(func + " " + msg);
}


return Game;

}());
