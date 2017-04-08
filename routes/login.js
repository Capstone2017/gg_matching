function calculateRatingGain(myRating, opponentRating, myGameResult) {
    if ([0, 0.5, 1].indexOf(myGameResult) === -1) {
      	return null;
    }
    
   	var myChanceToWin = 1 / ( 1 + Math.pow(10, (opponentRating - myRating) / 400));
	console.log( Math.round(32 * (myGameResult - myChanceToWin)) );
  	return Math.round(32 * (myGameResult - myChanceToWin));
}




module.exports = {

checkAuth: function(req) {
    var token = req.body.id;
    // http://stackoverflow.com/questions/34833820/do-we-need-to-hide-the-google-oauth-client-id
	// https://developers.google.com/identity/protocols/OAuth2UserAgent

	//https://developers.google.com/identity/protocols/OAuth2
    var CLIENT_ID = "585757099412-82kcg563ohunnb0t4kmq8el85ak8n3rp.apps.googleusercontent.com";
    var GoogleAuth = require('google-auth-library');
    var auth = new GoogleAuth;
    var client = new auth.OAuth2(CLIENT_ID, '', '');
	var userid = null;
    client.verifyIdToken(
        token,
        CLIENT_ID,
        function(e, login) {

            var payload = login.getPayload();
            userid = payload['sub'];
            //https://developers.google.com/identity/sign-in/web/backend-auth
        }
    );
    console.log("Verify: " + userid);
    return userid;

},

retryLogin: function(req,res,connection,r,limit) {
		
	setTimeout(function() {module.exports.login(req,res,connection,r, limit); }, 100);
},

login: function(req,res,connection,r, limit) {
	confirmed_id = module.exports.checkAuth(req);
	if (confirmed_id == null && limit < 10) {
		console.log(limit);
		limit = limit + 1;
		module.exports.retryLogin(req,res,connection,r, limit);		
	}
	
	if (!(limit < 10)) {
		console.log("Failed to verify login on server within 10 tries.");
	}

	if (confirmed_id != null) {
		r.table('users').filter({"id":confirmed_id}).run(connection,
           	function(err, cursor) {
               	if (err) throw err;
               	cursor.toArray(function(err, result) {
                   	if (err) throw err;
                   	//console.log(JSON.stringify(result, null, 2));
                   	if (result.length == 0) {
						var userObj = {"id":confirmed_id, "win":0,"loss":0, "rating" : 1000}
                       	r.table('users').insert([userObj]).run(connection, function(err, result) {
                           	if (err) throw err;
                           	console.log(JSON.stringify(result, null, 2));
                           	// could queyr for it again
                           	res.send( userObj );
                       	})
                   	}
                   	else {
                       	res.send(result);
                   	}
               	});
          	}
    	);
	}
},


setupUser: function(req,res,connection,r) {
	var confirmed_id = module.exports.checkAuth(req);
	if ( confirmed_id != null) {
    	r.table('users').get(confirmed_id).update({"username":req.body.username}).run(connection,
            function(err, cursor) {
                if (err) throw err;
                console.log(req.body.username);
				res.send(req.body.username);
            }
		);
	};

    console.log("New Username: " + req.body.username);
},

updateScore: function(req,res,connection,r) {
	var isWinner = req.body.isWinner;
	var confirmed_id = module.exports.checkAuth(req);
	
	var ratingGain;

	if ( confirmed_id != null) {
		console.log(typeof(isWinner) + isWinner);
		// For ties might want to not increment wins or loss ? or maybe add tie field
		if (isWinner == "true") {
			ratingGain = calculateRatingGain(req.body.myRating, req.body.theirRating, 1);
        	r.table('users').get(confirmed_id).update({"win": r.row("win").add(1)}).run(connection,
            	function(err, cursor) {
            	    if (err) throw err;
            	}
        	);
			r.table('users').get(confirmed_id).update({"rating": r.row("rating").add(ratingGain)}).run(connection,
                function(err, cursor) {
                    if (err) throw err;
					theirRatingGain = calculateRatingGain(req.body.theirRating, req.body.myRating, 0);
					res.send({"myRatingGain":ratingGain,"theirRatingGain":theirRatingGain});
                }
            );	
		}
		else {
			ratingGain = calculateRatingGain(req.body.myRating, req.body.theirRating, 0);
			r.table('users').get(confirmed_id).update({"loss": r.row("loss").add(1)}).run(connection,
                function(err, cursor) {
                    if (err) throw err;
					theirRatingGain = calculateRatingGain(req.body.theirRating, req.body.myRating, 1);
                    res.send({"myRatingGain":ratingGain,"theirRatingGain":theirRatingGain});
                }
            );	
			r.table('users').get(confirmed_id).update({"rating": r.row("rating").add(ratingGain)}).run(connection,
				function(err, cursor) {
					if (err) throw err;
					// send elo?
				}
			);

		}
    };

    console.log("Updated Score for: " + confirmed_id);


},

retryGetRating: function(req,res,connection,r,limit) {
	// Can improve this similar to enterRankedConnectionQueue
    setTimeout(function() {module.exports.getRating(req,res,connection,r, limit); }, 100);
},

getRating: function(req,res,connection,r, limit) {
	var confirmed_id = module.exports.checkAuth(req);
	
	if (confirmed_id == null && limit < 10) {
        console.log(limit);
        limit = limit + 1;
        module.exports.retryGetRating(req,res,connection,r, limit);
    }

    if (!(limit < 10)) {
        console.log("Failed to retrieve rating on server within 10 tries.");
    }

	if ( confirmed_id != null) {
		r.table('users').get(confirmed_id).pluck("rating").run(connection,
                function(err, cursor) {
                    if (err) throw err;
			//		console.log(cursor)	
					res.send(cursor);
                }
    	);
	}
}


}