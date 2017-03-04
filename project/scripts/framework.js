/*
	Ready

	Required to define own handleData(data) function to interact with data
	If using countdown you need to define countdownComplete();
*/
$(document).ready(function() {
	Framework.initializeFramework();	
});

(function(window) {

'use strict';

function defineFramework() {

var Framework = {};

// Temp function to test open connection
$(document).keypress(function ( e) {
	Framework.sendData({});
});

/*
	Fields
*/


var peer;

var readyList = [];
var globalGame; 
var gameList = {};

/*
	Public functions can call by using Framework.XXXX
*/

// Maybe setting functions can be done with the abstract game
// When data is sent this is the function that recieves the data

var tempHandleData;
Framework.defineHandleData = function(func) {
	tempHandleData = func;
}

// Function that runs when the Framework.countdown completes
var countdownComplete = function () { throw new Error("countdownComplete() is not defined use defineCountdownComplete(func)"); }
Framework.defineCountdownComplete = function(func) {
    if (func !== 'undefined' && typeof func === 'function') {
        countdownComplete = func;
    }
    else {
        throw new Error("defineCountdownComplete(func) takes a function as a parameter not " + typeof func);
    }
}

// Function to start the game - maybe should rename to startGame?
var game = function() { throw new Error("game() is not defined use defineGame(func)"); }
Framework.defineGame = function(func) {
    if (func !== 'undefined' && typeof func === 'function') {
        game = func;
    }
    else {
        throw new Error("defineGame(func) takes a function as a parameter not " + typeof func);
    }

}

// Delete created objects and remove listeners
var endGameCleanUp = function() { throw new Error("endGameCleanUp() is not defined use defineEndGameCleanUp(func)"); }
Framework.defineEndGameCleanUp = function(func) {
    if (func !== 'undefined' && typeof func === 'function') {
        endGameCleanUp = func;
    }
    else {
        throw new Error("defineEndGameCleanUp(func) takes a function as a parameter not " + typeof func);
    }

}

// Initial State of Game
var initialState = function() { throw new Error("initialState() is not defined use defineInitialState(func)"); }
Framework.defineInitialState = function(func) {
    if (func !== 'undefined' && typeof func === 'function') {
        initialState = func;
    }
    else {
        throw new Error("defineInitialState(func) takes a function as a parameter not " + typeof func);
    }

}

// Calls the user defined endGameCleanUp
Framework.endGameCleanUp = function() {
	endGameCleanUp();
}

// Creates a Ready Up button and sets up its on click event to start the game when both players are ready.
Framework.readyUp = function() {
	var r = $('<button>');
	r.attr("id", "readyUp");
	r.html("Ready Up");
	$("#ui").append(r);
	$("#ui").append("<hr>");

    $("#readyUp").on("click", function() {
		addToReadyList(Framework.getPeerId());
		peer.askForPeersToAgree("readyUp");
		startGame(readyList);	
		
		$("#readyUp").off();
		$("#readyUp").remove();
    });
}


// Returns the globalGame instance 
Framework.getGame = function() {
    if (globalGame == undefined) { throw new Error("Game has not been defined yet. Game gets created when both players readyUp."); }
    return globalGame;
}

// Sets up connection buttons and text boxes aswell as logging 
Framework.initializeFramework = function() {
	initializeButtons();
	initializeLogging();
	loadGameList(); // game config file
}

// Public rematch function calls the private rematch function and alerts the clients peer to call it aswell
Framework.rematch = function() {
	initializeRematch();
	//Framework.sendData({"type":"FrameworkInfo","callFunction":"rematch"});
	
}

// Return the PeerId even if they are disconnected
Framework.getPeerId = function() {
	return peer.getPeerId();
}

// Sends passed data to every connected peer
Framework.sendData = function(data) {
    peer.eachActiveConnection(function(c,$c) {
		data.time = (new Date()).getTime();
        c.send(data);
    });
}

// Public function that sleeps for delay ms
Framework.sleep = function(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

// Public countdown function that counts down using counter.js
var countdownWorker;
Framework.countdown = function() {
    if (typeof(Worker) !== "undefined") {
        if (typeof(countdownWorker) == "undefined") {
            countdownWorker = new Worker("project/scripts/counter.js");
        }
        countdownWorker.onmessage = function(event) {
            $("#countdown").html(event.data);
            if (event.data == 0) {
                stopCountdownWorker();
				
                countdownComplete();
            }
        };
    }
    else {
        $("#countdown").html("WW Error");
    }
}

// Calls the private _forceEndCountdown() function and tells the other peer to do the same
Framework.forceEndCountdown = function() {
	//_forceEndCountdown();
	callFunction("forceEndCountdown",_forceEndCountdown);
	//Framework.sendData({"type":"FrameworkInfo","callFunction":"forceEndCountdown"});
}


/*
	Private functions only can be called internally
*/

// Dynamically calls the passed in function for both clients
function callFunction(name, func) {
	Framework.sendData({"type":"FrameworkInfo","callFunction":name});
	func();
}

function initializeRematch() { 
	//Framework.sendData({"type":"FrameworkInfo","callFunction":"initializeRematch"});
	//_initializeRematch();
	callFunction("initializeRematch", _initializeRematch);
}

// Creates the rematch button and redoes the ReadyUp for the game
// Then calls the globalGames rematch function to restart the game
function _initializeRematch() {
	readyList = [];
	$("#ui").append("<button id='rematch'>Rematch</button>");
	$("#rematch").on("click", function() {
		addToReadyList(Framework.getPeerId());
		peer.askForPeersToAgree("rematch");	
		startRematch();
		$("#rematch").off();
		$("#rematch").remove();
	});
}

function startRematch() {
	if (readyList.length == 2) {
		Framework.readyUp();
		readyList = [];
		initialState();
		Framework.getGame().rematch();
	}
}


// Adds the html for logging at the bottom of the webpage
function initializeLogging() {
	$("body").append('<div class="active connection"></div>');
	$("body").append('<div class="log" style="color:#FF7500;text-shadow:none;padding:15px;background:#eee"><strong>Connection status</strong>:<br></div>');
}

// Adds the connection buttons and text boxes at the top of the webpage
function initializeButtons() {
	$("body").prepend("<div id='ui'></div>");
	$("#ui").append('<p>Your ID is <span id="pid"></span> <button id="copyId">Copy</button> <button id="autoConnect">Auto Connect</button></p>');
	$("#ui").append('<p>Connect to a peer:<input type="text" id="rid" placeholder="Someone else\'s id"><input class="button" type="button" value="Connect" id="connect"></p>');
	$("#ui").append("<hr>");
		
	$('#connect').click(function() {
    	peer.createConnection("manualConnection",$("#rid").val());
    });
    $('#autoConnect').click(function() {
    	peer.attemptConnection();
    });

}


/**
 *  Functions to generate Unique PeerId 
 */

// Reads from the game-config.json file and creates a unique number for each game
// This unique number is so that peer's cant connect across different games
function loadGameList() {
	var gameCount = 0;
    $.getJSON("/project/game-config.json", function(json) {        
        json.games.forEach(function(val) {
            var path = json.host + "/" +  val.name;
			gameList[path] = gameCount++;
        });
    })
		.done(function() {
				
			peer = PeerInstance(gameList);
			peer.defineHandleData(tempHandleData);
			peer.defineHandleFrameworkInfo(handleFrameworkInfo);
			peer.defineHandleGameInfo(handleGameInfo);
			console.log(peer);
		})
		.fail(function() {
			console.log("Error: Failed to load Game List");
		});
}

function handleFrameworkInfo(data) {
    if (data.callFunction == "forceEndCountdown") {
        _forceEndCountdown();
    }
    if (data.callFunction == "initializeRematch") {
        _initializeRematch();
    }
    // Could be issues with this being run before readyList cleared in other client
    if (data.agreeTo == "rematch") {
        addToReadyList($("#rid").val());
        startRematch();
    }
    if (data.agreeTo == "readyUp") {
        addToReadyList($("#rid").val()); // Need to add a function to get peer that is connected
        startGame(readyList); // Dont need to pass readyList
    }
}

// Handles Game Object Info specifi data sent
// Might want to rename to something more abstract
function handleGameInfo(data) {
    if (data.endTurn) {
        Framework.getGame()._endClientTurn();
    }
    if (data.gameOver) {
        Framework.getGame()._setClientGameOver();
    }
    if (data.rematch) {
        Framework.getGame()._rematch();
    }
}


// Creates a GameInstance and calls the defined game method
function startGame(readyList) {
    if (readyList.length == 2) {
        // GameInstance is singleton pattern now so it can only be used once but if something
        // makes a GameInstance before this method it will use that one.
        globalGame = new GameInstance(readyList);
        initialState();
        console.log(JSON.stringify(globalGame));
        game();
    }
}

function addToReadyList(id) {
    readyList.push(id);
    readyList = $.unique(readyList);
}


/**
 *  Private WebWorker Functions
 */

// End the specified web worker
function stopCountdownWorker() {
    if (typeof(countdownWorker) != "undefined" ) {
		countdownWorker.terminate();
    	countdownWorker = undefined;
	}
}

// Private function to force end a countdown
function _forceEndCountdown() {
    $("#countdown").html("0");
    stopCountdownWorker();
}

// Not sure what this is for
function setCountdownWorker(w) {
	
}

// Framework object that can access all the public methods
return Framework;
}

// Ensure that only one Framework gets defined
if (typeof(Framework) === 'undefined') {
	window.Framework = defineFramework();
}
else {
	console.log("Framework already defined");
}

})(window);