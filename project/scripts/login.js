// display login and logout buttons
$(document).ready(function() {
	$("#nav").prepend('<li><button class="g-signout2" >Sign out</button></li>');	
	$(".g-signout2").on("click", signOut);
});

/**
 * Handle successful sign-ins.
 */
var onSuccess = function(user) {
    console.log('Signed in as ' + user.getBasicProfile().getName());
 };

/**
 * Handle sign-in failures.
 */
var onFailure = function(error) {
    console.log(error);
};


function onSignIn(googleUser) {
	// Useful data for your client-side scripts:
    var profile = googleUser.getBasicProfile();
    //console.log("ID: " + profile.getId()); // Don't send this directly to your server
    console.log('Full Name: ' + profile.getName());
    // The ID token you need to pass to your backend:
    var id_token = googleUser.getAuthResponse().id_token;
    //console.log("ID Token: " + id_token);
	$.ajax({
		type: "POST",
		url: "/login",
		data: {"id" : id_token},
		success: function(data) {
			
			if (data[0] != undefined) { 
				displayUsername(data[0].username, id_token, profile);
				displayFriends(id_token,data[0].friends);
			}
			else { 
				setUsername(id_token, profile);
				displayFriends(id_token,data[0].friends);
			}
		}
	});
};

// Clear page so on logout you cant see the actions you cant perform
function clearPage() {
	$("#display_name").html("");
    $("#gameList").html("");
    $("#friendsList").html("");
    $("#gameLinks").html("");
}

// cleanup on logout
function signOut() {
   	var auth2 = gapi.auth2.getAuthInstance();
	clearPage();
   	auth2.signOut().then(function () {
   		console.log('User signed out.');
   	});
	// delete framework components
	if (Framework != undefined) Framework.onLogout();	
	auth2.disconnect();
			
}

// on initial login set a username
function setUsername(id_token, profile) {
	var username = prompt("Please select a username that isnt already taken",
            profile.getName());
	$.ajax({
		type: "POST",
		url: "/setupUser",
		data: { "id": id_token, "gu" : "verify", "username" : username},
		success: function(data) {
			if (data.setUsername == true) {
				displayUsername(data.username,id_token,profile);
				displayFriends(id_token,undefined);
			}
			else {
				setUsername(id_token, profile);
			}
		}
	});
}

// show friends list
function displayFriends(id_token,friends) {
	
	// show friends list if it doesnt already exist	
	if ($("#friendsList").length == 1) { 

     	$("#friendsList").append($("<br>"));
		$("#friendsList").append("Friends");
		$("#friendsList").append($("<ul>").attr("id","name_list"));
		$("#friendsList").append("<br>");
		$("#friendsList").append("<input type='text' id='addFriend' placeholder='Add friend by username.'>");
		$("#addFriend").keypress(function (e) { // add friend to list and database

        	if (e.which == 13) { // error if not logged in change to only trigger a
            	var friend = $("#addFriend").val();
            	$("#addFriend").val("");

            	$.ajax({
                	type: "POST",
                	url: "/addFriend",
                	data : {"id": id_token, "friend": friend},
                	success : function(data) {
                    	console.log(data);
						if (data.addFriend == true) {
							$("#name_list").append($("<li>").attr("id","name_list_" + data.username).html(data.username));
						}
                	}

            	})
        	}
    	});	
		// display all friends in friends variable
		$.each(friends, function( value ) {
			$("#name_list").append($("<li>").attr("id","name_list_" + friends[value].username).html(friends[value].username));
		});

		$("#friendsList").append("<input type='text' id='delFriend' placeholder='Delete friend by username.'>");
		$("#delFriend").keypress(function (e) { // delete friends from list and database

            if (e.which == 13) { // error if not logged in change to only trigger a
                var friend = $("#delFriend").val();
                $("#delFriend").val("");

                $.ajax({
                    type: "POST",
                    url: "/deleteFriend",
                    data : {"id": id_token, "friend": friend},
                    success : function(data) {
                        console.log(data);
                        if (data.deleteFriend == true) {
							$("[id='name_list_" + data.username + "']").remove();
                        }
                    }
                })
            }
        });
	}
}

// append username to top right aswell as games
function displayUsername(username, id_token, profile) {
	if (username == "") {
		setUsername(id_token, profile);
	}
    else if (username != undefined)
    {
		if ($("#display_name").val() == undefined || $("#display_name").val() == 0) {
    		$("#nav").prepend("<li id='display_name' class='color_orange'>" + username + "</li>");
		}
    }
	else {
		console.log("Login Data undefined");
	}

	if (typeof(Framework) == "undefined") {
		linkGames();
	}
	if (typeof(Framework) != "undefined") {
		if (isFrameworkSetup == false) {
			FrameworkInit();
		}
	}
	
}

// Restrict so that on displays on homepage
function linkGames() {
    $.getJSON("/project/game-config.json", function(json) {
        json.games.forEach(function(val) {
			$("#gameLinks").append("<a href=\"" + val.name + "\">" + val.name + "<\a><br>");
        });
    })
}


