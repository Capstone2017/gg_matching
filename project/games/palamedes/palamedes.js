const BLOCKSPEED = 10;
const MOVESPEED = 50;
const AREAW = 500;
const AREAH = 800;
const AVATARW = 40;
const AVATARH = 40;
const COLLENGTH = 10;
const WALLW = 20;
const ROWLENGTH = 9;
const QUEUELENGTH = 10;
const CEIL = 1;
const FLOOR = 6;

var row1 = [ROWLENGTH];
var row2 = [ROWLENGTH];
var row3 = [ROWLENGTH];
var row4 = [ROWLENGTH];
var row5 = [ROWLENGTH];
var row6 = [ROWLENGTH];
var row7 = [ROWLENGTH];
var row8 = [ROWLENGTH];
var row9 = [ROWLENGTH];
var row10 = [ROWLENGTH];
var row11 = [ROWLENGTH];

var count = 0;
//var queue;
var min;
var max;
var p1;
var p2;
var position;
var shotLibrary = new Array(6);
shotLibrary[0] = "blue";
shotLibrary[1] = "green";
shotLibrary[2] = "orange";
shotLibrary[3] = "pink";
shotLibrary[4] = "yellow";
shotLibrary[5] = "brown";
shotLibrary[6] = "grey";
var shot = shotLibrary[0];
var sampleBr;
var sampleY;
var sampleP;
var sampleO;
var sampleBl;
var sampleG;
var shotFlag;
var combo;
var copyCombo;
var comboPoints;
var loadedShotChangedFlag;
var stackChangedFlag;
var sendLinesFlag;
var f;


function Queue() {
    this.oldestIndex = 1;
    this.newestIndex = 1;
    this.storage = {};
}

Queue.prototype.size = function() {
    return this.newestIndex - this.oldestIndex;
};

Queue.prototype.enqueue = function(data) {
    this.storage[this.newestIndex] = data;
    this.newestIndex++;
};

Queue.prototype.dequeue = function() {
    var oldestIndex = this.oldestIndex,
        newestIndex = this.newestIndex,
        deletedData;

    if (oldestIndex !== newestIndex) {
        deletedData = this.storage[oldestIndex];
        delete this.storage[oldestIndex];
        this.oldestIndex++;

        return deletedData;
    }
};


$(document).ready(function() {
    Framework.defineHandleData(recieveData);
    Framework.defineGame(gameStart);
	Framework.defineEndGameCleanUp(endGame);
    Framework.defineInitialState(function(){});
});
function gameStart() {  
    p1 = myGameArea(readInput, initializeQueue, rows, true);
    p1.start();
    p2 = myGameArea(updateOpponentPosition, function(){}, function(){}, false);
    p2.start();
}

function myGameArea(ri, iq, r, temp)  {
    var instance = {
	isP1 : temp,
    canvas : document.createElement("canvas"),
	clearAva : function() {
		this.context.clearRect(0, 550, 500, this.canvas.height);
	},
    clear : function () {
        this.context.clearRect(0, 0, this.canvas.width, 699);
    },
    start : function() {
		combo = [0,0,0,0,0,0];
		copyCombo = [0,0,0,0,0,0];
		sendLinesFlag = false;
		f = false;
        instance.myAvatar = new component(AVATARW, AVATARH, "red", 225, 570, this);
        var leftBound = new component(WALLW, AREAH, "purple", 0, 0, this);
        var rightBound = new component(WALLW, AREAH, "purple", 480, 0, this);
        var floorBound = new component(AREAW, WALLW, "purple", 0, 550, this);
		instance.blank = new component(AVATARW, AVATARH, "grey", 25, 650, this);
		instance.loadedShot = new component(AVATARW, AVATARH, shot, 225, 500, this);
		shotFlag = false;
        min = Math.ceil(CEIL);
        max = Math.floor(FLOOR);
        this.canvas.width = AREAW;
        this.canvas.height = AREAH;
        this.context = this.canvas.getContext("2d");
        $("body").append(this.canvas);
        this.queue = new Queue();
        queue = iq(this.queue);
        this.interval = setInterval(function() {
	    $(instance.canvas).stop(true,true);
            updateGameArea(instance.myAvatar, leftBound, rightBound, floorBound, instance, this.queue, r);
        }, 20);
        for (var i = 0; i < ROWLENGTH; i++) {
            row1[i] = 0;
            row2[i] = 0;
            row3[i] = 0;
            row4[i] = 0;
            row5[i] = 0;
            row6[i] = 0;
            row7[i] = 0;
            row8[i] = 0;
            row9[i] = 0;
            row10[i] = 0;
            row11[i] = 0;
        }
		
		var ctx = this.canvas.getContext("2d");
		ctx.fillStyle = "brown";
		ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleBr = ctx.getImageData(25, 570, AVATARW, AVATARH);
	    ctx.fillStyle = "yellow";
        ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleY = ctx.getImageData(25, 570, AVATARW, AVATARH);
        ctx.fillStyle = "blue";
        ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleBl = ctx.getImageData(25, 570, AVATARW, AVATARH);
		ctx.fillStyle = "pink";
        ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleP = ctx.getImageData(25, 570, AVATARW, AVATARH);
		ctx.fillStyle = "orange";
        ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleO = ctx.getImageData(25, 570, AVATARW, AVATARH);
		ctx.fillStyle = "green";
        ctx.fillRect(25, 570, AVATARW, AVATARH);
        sampleG = ctx.getImageData(25, 570, AVATARW, AVATARH);			
		
        ri(instance);   
        

    }
    }
    return instance;
}

function readInput(instance) {
    $(document).keydown(function(e) {
    var keyCode = e.keyCode;
    if (keyCode == 37) {
		e.preventDefault();
        instance.myAvatar.x -= 50;
		if (!shotFlag) {
			instance.loadedShot.x -= 50;
    	}
	}
    if (keyCode == 39) {
		e.preventDefault();
        instance.myAvatar.x += 50;
		if (!shotFlag) {
			instance.loadedShot.x += 50;
		}
    }
    if (keyCode == 38) {
		e.preventDefault();
		shotFlag = true;
    }
    if (keyCode == 40) {
		e.preventDefault();
		//swapShot(instance);
    }
	if (keyCode == 32) {
		e.preventDefault();
		popCombo(instance);
	}
    });

}

function popCombo(p) {
	if (p.isP1) {
		var t = p.context;
		t.clearRect(0, 700, p.canvas.width, 50);	
	}
	for (var i = 0; i < combo.length; i++) {
		combo[i] = 0;
	}
	sendLinesFlag = true;
}

function calcCombo() {
	comboPoints = 0;
	var threePairsFlag = 0;
	var copiesCheck = [-1,-1,-1,-1,-1,-1];
	for (var i = 0; i < combo.length; i++) {
		if (combo[i] != 0){
		switch(countInArray(combo, combo[i])) {
			case 2:
				if (combo[i] != copiesCheck[combo[i]-1]) {
                       copiesCheck[combo[i]-1] = combo[i];
                       threePairsFlag += 1;
                }
                break;
			case 3:
				if (combo[i] != copiesCheck[combo[i]-1]) {
						copiesCheck[combo[i]-1] = combo[i];
						comboPoints += 1;
				}
			    break;
			case 4:
				if (combo[i] != copiesCheck[combo[i]-1]) {
                        copiesCheck[combo[i]-1] = combo[i];
                        comboPoints += 2;
                }
                break;
			case 5:
			case 6:
				 if (combo[i] != copiesCheck[combo[i]-1]) {
                        copiesCheck[combo[i]-1] = combo[i];
                        comboPoints += 3;
                }
                break;
			default:
				break;
		}
		}
		if (threePairsFlag == 3) {
			comboPoints += 3;
			threePairsFlag = 0;
		}
		}
		for (var i = 0; i < combo.length; i++) {
		if (combo[i] != 0) {
		if (i != combo.length-1 && i != combo.length-2) {
			if (combo[i]+1 == combo[i+1] && combo[i+1]+1 == combo[i+2]) {
				comboPoints += 1;
				if (i+3 < combo.length) {
					if (combo[i+2]+1 == combo[i+3]) {
						comboPoints += 1;
						if (i+4 < combo.length) {
							if (combo[i+3]+1 == combo[i+4]) {
								comboPoints += 1;
								if (i+5 < combo.length) {
									if (combo[i+4]+1 == combo[i+5]) {
										comboPoints += 1;
									} else {i+=5;}
								}   
							} else {i+=4;}
						}
					} else {i+=3;}
				}
			}
		}
		}

		
	}
	var tot = 0;
	for (var i = 0; i < combo.length; i++) {
		tot += combo[i];
	}
	if (tot == 21) {
		comboPoints += 1;
	}
	console.log(comboPoints);
	
						        
}

function countInArray(array, what) {
    var count = 0;
    for (var i = 0; i < array.length; i++) {
        if (array[i] === what) {
            count++;
        }
    }
    return count;
}

function swapShot(instance) {
	switch(shot) {
        case shotLibrary[0] :
            shot = shotLibrary[1];
            break;
        case shotLibrary[1] :
            shot = shotLibrary[2];
            break;
        case shotLibrary[2] :
            shot = shotLibrary[3];
            break;
        case shotLibrary[3] :
            shot = shotLibrary[4];
            break;
        case shotLibrary[4] :
            shot = shotLibrary[5];
            break;
        case shotLibrary[5] :
            shot = shotLibrary[0];
            break;
        default :
            break;
    }
	instance.loadedShot.color = shot;
}

function initializeQueue(queue) {
    for (var i = 0; i < QUEUELENGTH; i++) {
             queue.enqueue(makeRow(min, max));
    }
    return queue;    
}

function component(width, height, color, x, y, p) {
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
	this.color = color;
    this.x = x;
    this.y = y;
	this.crashFlag = true;
    this.update = function() {
        ctx = p.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
    this.crashWith = function(otherobj) {
		if (this.crashFlag) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = false;
        if ((mybottom < othertop) ||
            (mytop > otherbottom) ||
            (myright < otherleft) ||
            (myleft > otherright)) {
            crash = true;
        }

        return crash;
		}

    }
	this.remove = function() {
		ctx = p.context;
		ctx.clearRect(this.x, this.y, this.width, this.height);
		this.crashFlag = false;		
	}
	this.change = function(color, x, y) {
    	this.color = color;
		this.x = x;
		this.y = y;				
	}
}

function updateGameArea(myAvatar, leftBound, rightBound, floorBound, p, queue, rows) {
    if (p.isP1) p.clear();
	else {
		p.clearAva();
		
		p.loadedShot.update();
	}
    myAvatar.update();
    leftBound.update();
    rightBound.update();
    floorBound.update();
	p.blank.update();
	if (shotFlag && p.isP1) {
		p.loadedShot.speedY = -10;
	}
	else {
		p.loadedShot.speedY = 0;
	}
	var OOB = false;
	p.loadedShot.newPos();	
	p.loadedShot.update();
    if (myAvatar.x < 25) {
        myAvatar.x = 25;
		p.loadedShot.x = 25;
		OOB = true;
    }
    if (myAvatar.x > 425) {
        myAvatar.x = 425;
		p.loadedShot.x = 425;
		OOB = true;
    }
	rows(p, queue);
	var ctx = p.canvas.getContext("2d");
    var shotData = ctx.getImageData(p.loadedShot.x, p.loadedShot.y, AVATARW, AVATARH);
    var checkData = ctx.getImageData(p.loadedShot.x, p.loadedShot.y - 50, AVATARW, AVATARH);
	var blankData = ctx.getImageData(225, 650, AVATARW, AVATARH);
    if(compareImages(shotData, checkData) && !OOB) {
	    checkMatch(p);
	}
	else if ((p.loadedShot.y % 50 == 0) && (!(compareImages(checkData, blankData)))) {
	    var whichRow = (p.loadedShot.y) / 50;
        var whichCol = (p.loadedShot.x - 25) / 50;
		var cNum = 0;
		switch(p.loadedShot.color) {
			case "blue" :
				cNum = 1;
				break;
			case "brown" :
                cNum = 2;
                break;
			case "yellow" :
                cNum = 3;
                break;
			case "pink" :
                cNum = 4;
                break;
			case "orange" :
                cNum = 5;
                break;
			case "green" :
                cNum = 6;
                break;
			default :
				break;

		}
        switch(whichRow) {
            case 0 :
                row1[whichCol] = cNum;
                break;
            case 1 :
                row2[whichCol] = cNum;
                break;
            case 2 :
                row3[whichCol] = cNum;
                break;
            case 3 :
                row4[whichCol] = cNum;
                break;
            case 4 :
                row5[whichCol] = cNum;
                break;
            case 5 :
                row6[whichCol] = cNum;
                break;
            case 6 :
                row7[whichCol] = cNum;
                break;
            case 7 :
                row8[whichCol] = cNum;
                break;
            case 8 :
                row9[whichCol] = cNum;
                break;
            case 9 :
                row10[whichCol] = cNum;
                break;
            case 10 :
                row11[whichCol] = cNum;
                break;
            default :
                break;
        }	
		p.loadedShot.x = p.myAvatar.x;
        shotFlag = 0;
        p.loadedShot.y = 500;
		swapShot(p);	
	}
    var j = p1.myAvatar.x;
	
    Framework.sendData({
	"type":"palamedes",
	"row1":row1,
	"row2":row2,
	"row3":row3,
	"row4":row4,
	"row5":row5,
	"row6":row6,
	"row7":row7,
	"row8":row8,
	"row9":row9,
	"row10":row10,
	"combo":combo,
	"comboPoints":comboPoints,
	"lines":sendLinesFlag,
	"ap":j,
	"f":f,
	"shoty":p1.loadedShot.y,
	"shotx":p1.loadedShot.x,
	"shotcolor":p1.loadedShot.color
    });

	if (sendLinesFlag) {
		sendLinesFlag = false;
	}

	//if (f) {
	//	clearInterval(p.interval);
	//}
	
	for (var i = 0; i < row11.length; i++) {
		if (row10[i] != 0) {
			clearInterval(p.interval);
			Framework.getGame().setGameOver();
			//Framework.rematch();	
			f = true;
		}
	} 
	
}

function recieveData(data) {

	if(data.type == "palamedes") {
        drawRow(data.row1, 0, p2);
        drawRow(data.row2, 50, p2);
        drawRow(data.row3, 100, p2);
        drawRow(data.row4, 150, p2);
        drawRow(data.row5, 200, p2);
        drawRow(data.row6, 250, p2);
        drawRow(data.row7, 300, p2);
        drawRow(data.row8, 350, p2);
        drawRow(data.row9, 400, p2);
        drawRow(data.row10, 450, p2);
        //drawRow(data.row11, 500, p2);
		//p2.loadedShot.remove();
		p2.myAvatar.x = data.ap;
		if (data.shotx != p2.loadedShot.x) {
            p2.loadedShot.remove();
			p2.loadedShot.x = data.shotx;
		}
		if (data.shoty != p2.loadedShot.y) {
            p2.loadedShot.remove();
			p2.loadedShot.y = data.shoty;
		}
		p2.loadedShot.color = data.shotcolor;
		 for (var i = 0; i < data.combo.length; i++) {
            if (data.combo[i] != 0) {
        if (data.combo[i] == 1) {
            ctx.fillStyle = "blue";
        } else if (data.combo[i] == 2) {
            ctx.fillStyle = "brown";
        } else if (data.combo[i] == 3) {
            ctx.fillStyle = "yellow";
        } else if (data.combo[i] == 4) {
            ctx.fillStyle = "pink";
        } else if (data.combo[i] == 5) {
            ctx.fillStyle = "orange";
        } else if (data.combo[i] == 6) {
            ctx.fillStyle = "green";
        }
		
		var c = p2.context;
        c.clearRect(320,700, 100, 50);
        c.fillRect((i*50)+25, 700, AVATARW, AVATARH);
		c.font = "20px Arial";
        c.fillText("Power: " + data.comboPoints, 320, 725);
		}

		if (data.f) {
			clearInterval(p1.interval);
			Framework.getGame().setWinner(Framework.getPeerId());
			//Framework.rematch();
		}
		
    }
	if (data.lines) {
		for (var i = 0; i < data.comboPoints; i++) {
			insertRow(p1.queue);
		}
	
	}
}
}

function updateOpponentPosition(p) {
    //p.myAvatar.x = position;    
}


function rows(p, queue) {
    drawRow(row1, 0, p);
    drawRow(row2, 50, p);
    drawRow(row3, 100, p);
    drawRow(row4, 150, p);
    drawRow(row5, 200, p);
    drawRow(row6, 250, p);
    drawRow(row7, 300, p);
    drawRow(row8, 350, p);
    drawRow(row9, 400, p);
    drawRow(row10, 450, p);
    //drawRow(row11, 500, p);
    while (p.queue.size < 10) {
        p.queue.enqueue(makeRow(min, max));
    }
    count += 1;
    if (count == 500) {
        insertRow(p.queue);
        count = 0; 
    }

}

function checkMatch(p) {
    if(p.isP1) { 	
		ctx.fillStyle = "grey";
		var whichRow = (p.loadedShot.y - 50) / 50;
		var whichCol = (p.loadedShot.x - 25) / 50;
		var savedBlock;
		switch(whichRow) {
			case 0 :
				savedBlock = row1[whichCol];
				row1[whichCol] = 0;
				break;
			case 1 :
				savedBlock = row2[whichCol];
                row2[whichCol] = 0;
                break;
			case 2 :
				savedBlock = row3[whichCol];
                row3[whichCol] = 0;
                break;
			case 3 :
				savedBlock = row4[whichCol];
                row4[whichCol] = 0;
                break;
			case 4 :
				savedBlock = row5[whichCol];
                row5[whichCol] = 0;
                break;
			case 5 :
				savedBlock = row6[whichCol];
                row6[whichCol] = 0;
                break;
			case 6 :
				savedBlock = row7[whichCol];
                row7[whichCol] = 0;
                break;
			case 7 :
				savedBlock = row8[whichCol];
                row8[whichCol] = 0;
                break;
			case 8 :
				savedBlock = row9[whichCol];
                row9[whichCol] = 0;
                break;
			case 9 :
				savedBlock = row10[whichCol];
                row10[whichCol] = 0;
                break;
			case 10 :
				savedBlock = row11[whichCol];
                row11[whichCol] = 0;
                break;
			default :
				break;	
		}
		p.loadedShot.x = p.myAvatar.x;
		shotFlag = 0;
		p.loadedShot.y = 500;
		
		for (var i = 0; i < 5; i++) {
			combo[i] = combo[i+1];
		}
		combo[5] = savedBlock;
		//copyCombo[5] = savedBlock;
		console.log(combo);
	    for (var i = 0; i < combo.length; i++) {
			if (combo[i] != 0) {
        if (combo[i] == 1) {
            ctx.fillStyle = "blue";
        } else if (combo[i] == 2) {
            ctx.fillStyle = "brown";
        } else if (combo[i] == 3) {
            ctx.fillStyle = "yellow";
        } else if (combo[i] == 4) {
            ctx.fillStyle = "pink";
        } else if (combo[i] == 5) {
            ctx.fillStyle = "orange";
        } else if (combo[i] == 6) {
            ctx.fillStyle = "green";
        }
		ctx.clearRect(320,700, 100, 50); 
        ctx.fillRect((i*50)+25, 700, AVATARW, AVATARH);
		calcCombo();
		ctx.font = "20px Arial";
		ctx.fillText("Power: " + comboPoints, 320, 725); 
        }

		}		
}
	
}

function compareImages(img1, img2) {
	if(img1.data.length != img2.data.length)
		return false;
	for(var i = 0; i < img1.data.length; ++i){
		if(img1.data[i] != img2.data[i])
			return false;
	}
    return true;	
}

function makeRow(min, max) {
    var a = new Array(ROWLENGTH);
    for (var i = 0; i < ROWLENGTH; i++) {
        a[i] = Math.floor((Math.random() * (max - min + 1))) + min; 
    }

    return a;
}

function insertRow(queue) {
    var d = queue.dequeue();
    for (var i = 0; i < ROWLENGTH; i++) {
            row11[i] = row10[i];
            row10[i] = row9[i];
            row9[i] = row8[i];
            row8[i] = row7[i];
            row7[i] = row6[i];
            row6[i] = row5[i];
            row5[i] = row4[i];
            row4[i] = row3[i];
            row3[i] = row2[i];
            row2[i] = row1[i];
            row1[i] = d[i];
    }
    queue.enqueue(makeRow(min, max));
}


function drawRow(row, y, p) {

    var x = 25;
    var ctx = p.context;
    for (var i = 0; i < ROWLENGTH; i++) {
        if (row[i] != 0) {
        if (row[i] == 1) {
            ctx.fillStyle = "blue";
        } else if (row[i] == 2) {
            ctx.fillStyle = "brown";
        } else if (row[i] == 3) {
            ctx.fillStyle = "yellow";
        } else if (row[i] == 4) {
            ctx.fillStyle = "pink";
        } else if (row[i] == 5) {
            ctx.fillStyle = "orange";
        } else if (row[i] == 6) {
            ctx.fillStyle = "green";
        }
        ctx.fillRect(x, y, AVATARW, AVATARH);
        }
        x += 50;

    }

}


function endGame() {
	//clearInterval(p.interval);
	//clearInterval(p.interval);
	console.log("endgame");
	//Framework.getGame().setWinner(Framework.getGame().getPlayer2());
	console.log("loser is " + Framework.getPeerId());
	//Framework.getGame().setGameOver();
	//clearInterval(p.interval);
	/*
	var flag = false;
	for (var i = 0; i < row11.length; i++) {
		if (row11[i] != 0) {
			flag = true;		
		}
	}	
	//var cont = p.context;
    //cont.fillStyle = "black";
    //cont.fillRect(0,0, p.canvas.width, 550);
	//cont.fillStyle = "white";
	//cont.font = "50px Arial";
	if (!flag) {
		//cont.fillText("WIN", 200, 350); 
		alert("WIN");
		Framework.getGame().setWinner(Framework.getPeerId());
	}
	clearInterval(p.interval);
	*/
}

