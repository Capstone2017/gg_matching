/**
 *  PeerJS specific setup code
 */

// New Peer Object
function PeerInstance(configs, rating, isChat) {
"use strict";
var instance = {};
var connectedPeers = {};

function getGameId(gameList) {
	if (isChat) {
		return "C";
	}
	return gameList[window.location.href];
}

// Generates a 14 hex digits followed by a -# of the unique game id and -# for the peer's rating
instance.createPeerId = function(gameList,rating) {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 14; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
	
    s[15] = "-" + getGameId(gameList);
	s[16] = "-" + rating; 
    var peerId = s.join("");
    return peerId;
}

instance.createPeer = function(configs, rating) {
    var peer = new Peer(
        this.createPeerId(configs, rating),
        {
            host : '/',
            port : 9000,
            path : '/',
            debug: 3,
            allow_discovery : true, //https://github.com/sheab/senet/issues/1
            config: {'iceServers': [
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh', username: 'webrtc@live.com' }
            ]},
            logFunction: function() {
                var copy = Array.prototype.slice.call(arguments).join(' ');
                    $('.log').append(copy + '<br>');
        },
    });

    // Show peer id on webpage
    peer.on('open', function(id){
		if (!isChat) {
        	$('#pid').val(id);
        	$('#pid').text(id);
		}
    });

    // Await connections from others
    peer.on('connection', function(c) {
        instance.connect(c, configs);
    });

    // Log Errors
    peer.on('error', function(err) {
		
		console.log(connectedPeers);
		console.log(err);
		delete connectedPeers[String(err).split(" ")[6]];
		console.log(connectedPeers);
    });

    return peer;
}

instance.peer = instance.createPeer(configs, rating);

// Returns a list of all the peers connected to the PeerJS server
instance.getAllConnectionsWithinRange = function(res, range) {
	var listOfUsers = [];
	for (var i = 0, ii = res.length; i < ii; i += 1) {
        if (res[i] != instance.peer.id && instance.getPeerIdSubset(instance.peer.id) == instance.getPeerIdSubset(res[i]) 
			&& (Math.abs(instance.getRating(res[i]) - instance.getRating(instance.peer.id)) <= range) ) {
			listOfUsers.push(res[i]); 
        }
    } 
	return listOfUsers;
}

// Returns the game's unique id
instance.getPeerIdSubset = function(peerId) {
    return peerId.split("-")[1];
}

instance.getRating = function(peerId) {
	return peerId.split("-")[2];
}

// Issue with negative ratings
instance.tryRankedConnection = function(listOfUsers) {
	var myRating = instance.getRating(instance.peer.id);
	var theirId = null;
	$.each(listOfUsers, function( index, value) {
		if (theirId == null || Math.abs(instance.getRating(value) - myRating) < Math.abs(instance.getRating(theirId) - myRating)) {
			theirId = value;
		}
	});

	if (listOfUsers.length == 0 ) console.log("Nothing to connect to within range. Widening search range.");
    else {
		instance.createConnection("rankedAutoConnection", theirId);
		
	}
}

// Uses instance.tryRankedConnection to get cloesest peer's but trys multiple times with multiple ranges
instance.enterRankedConnectionQueue = function() {
	var timeOutArray = [];	
	for ( var i = 0; i <= 10; i++ ) {
		(function(j) {
			timeOutArray[j] = setTimeout(function() {
				instance.attemptConnection(j*100);
				if (j*100 == 10*100) {
					alert("No peer to connect to");
				}
			}, j*1000);				 
		})(i);
	}
/*	
	setTimeout( function () { 
		instance.attemptConnection(100);
	} , 1000);
	setTimeout( function() {
		instance.attemptConnection(1000);
	}, 5000);
*/	
}

// Randomly connect to a valid peer
// Might want to change this to tryRandomConnection
instance.tryRandomConnection = function(listOfUsers) {
	var maximum = listOfUsers.length;
	var minimum = 0;
	var randomPeer = Math.floor(Math.random() * (maximum - minimum)) + minimum;
	if (listOfUsers.length == 0 ) console.log("Nothing to connect to.");
	else instance.createConnection("randomAutoConnection", listOfUsers[randomPeer]);
}


// Displays the peer that you connect to, add them to the connectedPeers list and disconnect from the PeerJS server
instance.setupConnection = function(c) {
	if (!isChat) { 
		$('#rid').val(c.peer);
	}
	connectedPeers[c.peer] = 1;
    //setTimeout(function() { instance.peer.disconnect(); }, 100);
}

// Connects to the specified peer and then disconnects from PeerJS server
instance.createConnection = function(labelVal, requestedPeer) {
	if (!connectedPeers[requestedPeer]) {
		var conn = instance.peer.connect(requestedPeer, {label: labelVal});
		conn.on('open', function() {
			instance.connect(conn);
			//instance.peer.disconnect(); // Still connected to its peer just cant accept any other requests
		});
		conn.on('error', function(err) { alert(err); });
	}
	connectedPeers[requestedPeer] = 1;
}

// Not being used right now - replaced by getAllConnections
instance.autoConnection = function(res) {	
	for (var i = 0, ii = res.length; i < ii; i += 1) {
		if (res[i] != this.peer.id) {
			$("#rid").val(res[i]);
			this.createConnection("autoConnection");
			return true;
		}
	}
	return false;
}

// Try to find a valid peer to connect to and connect
instance.attemptConnection = function(range) {
    // Async Call
    if (!instance.isConnected()) {
		this.peer.listAllPeers( function(res) {
        	var listOfUsers = instance.getAllConnectionsWithinRange(res, range);
        	//instance.tryRandomConnection(listOfUsers);
			instance.tryRankedConnection(listOfUsers);
    	});
	}
}

// Return PeerId for a client that is connected or disconnected from the Express Server
instance.getPeerId = function() {
    if (this.peer.open)
        return this.peer.id;
    else
        return this.peer._lastServerId;
}

// When connecting setupConnection and set the on data function
instance.connect = function(c) {
	instance.setupConnection(c);
	if (isChat) { 
		Framework.displayChat(); 
	}
	else { // Might want option for chat users to disconnect themselves from chat
		setTimeout(function() { instance.peer.disconnect(); }, 100);
	}
    c.on('data', function(data) {
		instance.onData(c,data);
   	});
}

// onData reads the data object and handles it appropriatly
// if it is a FrameworkInfo, gameInfo, or specific to the implemented game call
// the appropriate functions
instance.onData = function(c,data) {
        $("#active").append(data + c.label + "<br>");
		if (data.type == "FrameworkInfo") {
			this.handleFrameworkInfo(data);
		}
		else if (data.type == "gameInfo") {
			this.handleGameInfo(data);
		}
        else {
			this.handleData(data);
		}
}

// Define function to handle framework info that gets created in framework
instance.defineHandleFrameworkInfo = function(func) {
	instance.handleFrameworkInfo = func;
}

// Define function to handle game info that gets created in framework
instance.defineHandleGameInfo = function(func) {
	instance.handleGameInfo = func;
}

// Define handle data that gets created by the game
instance.handleData = function () { throw new Error("handleData(data) is not defined use defineHandleData(func)"); }
instance.defineHandleData = function(func) {
    if (func !== 'undefined' && typeof func === 'function') {
        instance.handleData = func;
    }
    else {
        throw new Error("defineHandleData(func) takes a function as a parameter not " + typeof func);
    }
}

// Handle turn based data - deprecated 
instance.handleTurnData = function(data) {
	instance.handleData(data);	
}

// Loops through each active connection - currently limited to 1
instance.eachActiveConnection = function(fn) {
	var checkedIds = {};
    for (var peerId in connectedPeers) {
    	if (!checkedIds[peerId]) {
        	var conns = instance.peer.connections[peerId];
            for (var i = 0, ii = conns.length; i < ii; i += 1) {
                var conn = conns[i];
                fn(conn, $(this));
            }
        }
        checkedIds[peerId] = 1;
    }
}

// Ask wait for both players to agree to command
instance.askForPeersToAgree = function(command) {
	Framework.sendData({"type":"FrameworkInfo","agreeTo":command});
}

// Returns true if the peer is connected to another peer
instance.isConnected = function() {
	// Might fail on disconnecting and reconnecting peers
	return !($.isEmptyObject(connectedPeers));
}
// When page is closed remove clear up peer objects
window.onunload = window.onbeforeunload = function(e) {
    if (!!instance.peer && !instance.peer.destroyed) {
    	instance.peer.destroy();
	}
};

instance.destroy = function(e) {
	if (!!instance.peer && !instance.peer.destroyed) {
        instance.peer.destroy();
		console.log("Disconnected from peer instance.");
    }	
};

return instance;

}

