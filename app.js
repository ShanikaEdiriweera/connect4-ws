var express = require("express");
var http = require("http");
var WebSocket = require("ws");

// var indexRouter = require("./routes/index");
var messages = require("./public/javascripts/messages"); 

var port = process.argv[2];
var app = express(); 

var gameStatus = require("./statTracker"); 
var Game = require("./gamestart"); 

app.get("/splash", function(req, res) {
  res.sendFile("splash.html", { root: "./public" });
});

app.use(express.static(__dirname + "/public"));


app.get("/play", function(req, res) {
  res.sendFile("game.html", { root: "./public" });
});

app.get("/", (req, res) => {
  res.render("splash.js", {
    gameInitialized: gameStatus.gameInitialized,
    gamesCompleted: gameStatus.gamesCompleted
  });
});

var server = http.createServer(app);

var wss = new WebSocket.Server({server});

wss.on('connection', function(WebSocket){
  console.log('made socket connection')
});

var websockets = {};

// setInterval(function() {
//   for (let i in websockets) {
//     if (Object.prototype.hasOwnProperty.call(websockets,i)) {
//       let gameObj = websockets[i];
//       //if the gameObj has a final status, the game is complete/aborted
//       if (gameObj.finalStatus != null) {
//         delete websockets[i];
//       }
//     }
//   }
// }, 50000);

var currentGame = new Game(gameStatus.gamesInitialized++);
var connectionID = 0; //each websocket receives a unique ID

 wss.on("connection", function connection(ws) {
     let con = ws;
     con.id = connectionID++;
     let playerType = currentGame.addPlayer(con);
     websockets[con.id] = currentGame;

  console.log(
    "Player %s placed in game %s as %s",
    con.id,
    currentGame.id,
    playerType
  );

  con.send(playerType == "A" ? messages.S_PLAYER_A : messages.S_PLAYER_B);

  if (currentGame.hasTwoConnectedPlayers()) {
    currentGame = new Game(gameStatus.gamesInitialized++);
  }

ws.on("message", function incoming(message) {
  console.log("[log] " + message);
});
});

// con.on("close", function(code) {
//   /*
//    * code 1001 means almost always closing initiated by the client;
//    * source: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
//    */
//   console.log(con.id + " disconnected ...");

//   if (code == "1001") {
//     /*
//      * if possible, abort the game; if not, the game is already completed
//      */
//     let gameObj = websockets[con.id];

//     if (gameObj.isValidTransition(gameObj.gameState, "ABORTED")) {
//       gameObj.setStatus("ABORTED");

//       try {
//         gameObj.playerA.close();
//         gameObj.playerA = null;
//       } catch (e) {
//         console.log("Player A closing: " + e);
//       }

//       try {
//         gameObj.playerB.close();
//         gameObj.playerB = null;
//       } catch (e) {
//         console.log("Player B closing: " + e);
//       }
//     }
//   }


      

server.listen(port, () =>
  console.log('*** Server is up and running on port ' + port + ' ***')
);
  