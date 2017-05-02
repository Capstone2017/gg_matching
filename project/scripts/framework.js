/*
	gg_matching framework visit https://github.com/Capstone2017/gg_matching to learn how to use
*/

isFrameworkSetup = false;

$(document).ready(function() {
	$.getScript("https://apis.google.com/js/platform.js").then(FrameworkInit);
});

var loadedLoginInfo = false;
function FrameworkInit() {
	// maybe redirect back to home page if not logged in
	gapi.auth2.init({client_id : "585757099412-82kcg563ohunnb0t4kmq8el85ak8n3rp.apps.googleusercontent.com"})
	.then(function(authResults) {
		if (!loadedLoginInfo) {
			loadedLoginInfo = true;
			var logged_in = gapi.auth2.getAuthInstance().isSignedIn.get();
			console.log("Logged in is: " + logged_in);	
			if (logged_in) {
				Framework.initializeFramework();
				$.getScript("project/scripts/copyToClip.js");
			}
			else { window.location.href = "http://adb07.cs.appstate.edu:9000" } 
		}
	});
}

// Framework defined here
(function(window) {

'use strict';

function defineFramework() {

var Framework = {};

// Temp function to test open connection
/*$(document).keypress(function ( e) {
	Framework.sendData({});
});*/

var peer;
var chatPeer;
var readyList = [];
var globalGame; 
var gameList = {};

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
	$(".connection_bar").append(r);
	if (rematch_happened == false) $(".connection_bar").append("<hr>");

    $("#readyUp").on("click", function() {
		if (peer.isConnected()) {
			addToReadyList(Framework.getPeerId());
			peer.askForPeersToAgree("readyUp");
			startGame(readyList);	
		
			if (rematch_happened == false) shareUser();
			$("#readyUp").off();
			$("#readyUp").remove();
		}
    });
}


// Returns the globalGame instance 
Framework.getGame = function() {
    if (globalGame == undefined) { throw new Error("Game has not been defined yet. Game gets created when both players readyUp."); }
    return globalGame;
}

// Sets up connection buttons and text boxes aswell as logging 
Framework.initializeFramework = function() {
	isFrameworkSetup = true;
	Framework.readyUp(); // change to private function maybe?
	initializeButtons();
	initializeLogging();
	loadGameInfo(); // game config file
}

// Public rematch function calls the private rematch function and alerts the clients peer to call it aswell
Framework.rematch = function() {
	initializeRematch();
}

Framework.getRating = function(peerId) {
	return peer.getRating(peerId);
}

Framework.getGameId = function() {
	var temp = window.location.href.split("/");
    return temp[temp.length - 1];
}

// Call function with null rating and it will hide the current rating
Framework.toggleRatingDisplay = function(rating) {
	if (rating == null) {
		$("#rating").remove();
	}
	else if ($("#rating").length != 1) {
            $("#nav").prepend("<li id='rating' class='color_orange'>" + rating + "</li>");
    }
}

Framework.updateRatingDisplay = function(rating) {
	$("#rating").html(rating);
}

// Return the PeerId even if they are disconnected
Framework.getPeerId = function() {
	return peer.getPeerId();
}

// Sends passed data to every connected peer
Framework.sendData = function(data) {
    peer.eachActiveConnection(function(c,$c) {
        c.send(data);
    });
}

Framework.sendChatData = function(data) {
	// Can check here for specific person to send data to
	//console.log(data);
	chatPeer.eachActiveConnection(function(c,$c) {
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
	callFunction("forceEndCountdown",_forceEndCountdown);
}

Framework.onLogout = function() {
	$(".connection_bar").html("");
	$(".log").html("");
	isFrameworkSetup = false;
	peer.destroy();
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
	callFunction("initializeRematch", _initializeRematch);
}

// Creates the rematch button and redoes the ReadyUp for the game
// Then calls the globalGames rematch function to restart the game
function _initializeRematch() {
	readyList = [];
	$(".connection_bar").append("<button id='rematch'>Rematch</button>");
	$("#rematch").on("click", function() {
		addToReadyList(Framework.getPeerId());
		peer.askForPeersToAgree("rematch");	
		startRematch();
		$("#rematch").off();
		$("#rematch").remove();
	});
}

var rematch_happened = false;
function startRematch() {
	if (readyList.length == 2) {
		rematch_happened = true;
		Framework.readyUp();
		readyList = [];
		initialState();
		Framework.getGame().rematch();
	}
}

function shareUser() {
	var username = $("#display_name").text();
	Framework.sendData({"type":"FrameworkInfo","callFunction":"shareUser","username":username});
}

function _shareUser(data) {
	$(".connection_bar").append("Opponent Username: " + data.username);
}

// Adds the html for logging at the bottom of the webpage
function initializeLogging() {
	$("body").append('<div class="active connection"></div>');
	$("body").append('<div class="log" style="color:#FF7500;text-shadow:none;padding:15px;background:#eee"><strong>Connection status</strong>:<br></div>');
}

// Adds the connection buttons and text boxes at the top of the webpage
function initializeButtons() {
	$(".connection_bar").prepend('<p>Your ID is <span id="pid"></span> <button id="copyId">Copy</button> <button id="autoConnect">Auto Connect</button></p>');
	$(".connection_bar").prepend('<p>Connect to a peer:<input type="text" id="rid" placeholder="Someone else\'s id"><input class="button" type="button" value="Connect" id="connect"></p>');
	$(".chat_bar").append('<p>Chat with Peer <input type="text" id="chat_username" placeholder="Someone else\'s chat id"> <button id="chatConnect">Chat Connect</button></p>');		
	$('#connect').click(function() {
		console.log($('#rid').val());
		if ( $('#rid').val() != "" ) {
	    	peer.createConnection("manualConnection",$("#rid").val());
		}
		else {
			alert("Enter valid PeerId or use Auto Connect");
		}
    });
	$("#chatConnect").click(function() {
		console.log(chatPeer.getPeerId());
		connectChatWithUsername($("#chat_username").val());
	});
    $('#autoConnect').click(function() {
    	peer.enterRankedConnectionQueue();
    });

}

function connectChatWithUsername(username) {
	var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
	// Can maybe by pass this if i store getFriends on loading
	$.ajax({
		type:"POST",
		url: "/getChatId",
		data: {"id":id_token,"username": username},
		success: function(data) {
			console.log(data);
			var usersId = data.chatId;
			if (usersId != undefined) {
				chatPeer.createConnection("chatConnection",  usersId);
			}
			

		}
	});

}

Framework.displayChat = function() {
	console.log($("#chatbox"));
	if ($("#chatbox").length == 0) {
	var chatbox = $('<div></div>').addClass('connection').addClass('active').attr("id","chatbox");
    var messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
	var textbox = $('<div><input type="text" id="chattextbox" placeholder="Enter Message"></div>');	
	$(textbox).keypress(handleChatData);
	$(chatbox).append(messages);
	$(chatbox).append(textbox);
	$(chatbox).append($("<hr>"));
	$(".chat_bar").append(chatbox);
	$(".log").hide();
	}
}

function handleChatData(data) {
	if (data.type != "chat") {
		if (data.keyCode == 13) {
			$(".messages").append("<br>");
			$(".messages").append($("#display_name").text() + ": "); 
			$(".messages").append( $("#chattextbox").val());
			$(".messages").animate({ scrollTop: $('.messages')[0].scrollHeight}, 100);
			//console.log(chatPeer);
			Framework.sendChatData({"type":"chat","messageFrom": $("#display_name").text(), "message":$("#chattextbox").val()});
		    $("#chattextbox").val("");
		}
	}
	else {
		$(".messages").append("<br>");
		$(".messages").append( data.messageFrom + ": " + data.message);
		$(".messages").animate({ scrollTop: $('.messages')[0].scrollHeight}, 100);
	}
}

/**
 *  Functions to generate Unique PeerId 
 */

// Reads from the game-config.json file and creates a unique number for each game
// This unique number is so that peer's cant connect across different games
function loadGameInfo() {
	var gameCount = 0;
	var rating;
	var gameId = Framework.getGameId();
	var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;
    $.when( $.getJSON("/project/game-config.json", function(json) {        
        		json.games.forEach(function(val) {
            		var path = json.host + "/" +  val.name;
					gameList[path] = gameCount++;
        		});
    		}), 
			$.ajax({
				type: "POST",
				url: "/getRating",
				data: {"id": id_token, "gameId": gameId},
				success: function(data) {
					Framework.toggleRatingDisplay(data.rating);
            		console.log("Your Rating is " + data.rating);
					rating = data.rating;
        		}
			})
	)	
		.done(function() {
				
			peer = PeerInstance(gameList, rating, false);
			chatPeer = PeerInstance(null, rating, true);	
			peer.defineHandleData(tempHandleData);
			peer.defineHandleFrameworkInfo(handleFrameworkInfo);
			peer.defineHandleGameInfo(handleGameInfo);
			chatPeer.defineHandleData(handleChatData);
			setTimeout(function() { 
				var chatId = chatPeer.getPeerId();
				$.ajax({
					type:"POST",
					url:"/setChatId",
					data: {"id": id_token, "chatId": chatId}
				});

			}, 100);
			//console.log(peer);
		})
		.fail(function() {
			console.log("Error: Failed to load Game List");
		});
}

// Handles communication for the framework between clients
function handleFrameworkInfo(data) {
	//console.log(data);
    if (data.callFunction == "forceEndCountdown") {
        _forceEndCountdown();
    }
    if (data.callFunction == "initializeRematch") {
        _initializeRematch();
    }
	if (data.callFunction == "shareUser") {
		//console.log("call _sh");
		_shareUser(data);
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
        globalGame = new GameInstance(readyList);
        initialState();
        game();
    }
}

// Add to readyList used for readyUp and Rematch
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


$(window).on('unload', function() {
	/*if (globalGame != undefined) {
 	var id_token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().id_token;		
	var gameId = Framework.getGameId();
	$.ajax({
        type: "POST",
        url: "/forfiet",
        data: {"id": id_token, "gameId": gameId}
    });
	}*/
});

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
