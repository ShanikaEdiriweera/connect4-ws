var express = require("express");
var http = require("http");
var WebSocket = require("ws");

// var indexRouter = require("./routes/index");
var messages = require("./public/javascripts/messages"); 

var port = process.argv[2] || 3000;

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

var currentGame = new Game(gameStatus.gamesInitialized++);
var connectionID = 0; //each websocket receives a unique ID


let pendingUsers = [];
let games = [];

 wss.on("connection", function connection(ws) {
  //  wss.clients.forEach((client) => {
  //    console.log(client.id)
  //  });
  // con.send(playerType == "A" ? messages.S_PLAYER_A : messages.S_PLAYER_B);

  ws.on("message", function incoming(message) {
    console.log("[log] " + message);

    if (message === "PLAY") {
      let con = ws;
      con.id = connectionID++;
      let playerType = currentGame.addPlayer(con);
      websockets[con.id] = currentGame;

      con.send(JSON.stringify({ type: "REGISTER_USER", id: con.id }))

      console.log(`Player ${con.id} placed in game ${currentGame.id} as ${playerType}`);

      if (playerType == "A") con.send(messages.S_GAME_PENDING);
      if (playerType == "B") {
        con.send(messages.S_GAME_START);
        currentGame.playerA.send(messages.S_GAME_START)
      }

      if (currentGame.hasTwoConnectedPlayers()) {
        currentGame = new Game(gameStatus.gamesInitialized++);
      }
    }

    if (message.includes("SELECT-CELL")) {
      let selectMsg = JSON.parse(message);
      if (selectMsg.type === "SELECT-CELL") {
        wss.clients.forEach(function (client) {
          // if (client.id == currentGame.playerA.id) client.send(messages.S_GAME_START);
          client.send(JSON.stringify({ 
            type: "HIGHLIGHT-CELL",
            selectedRow: selectMsg.selectedRow,
            selectedColumn: selectMsg.selectedColumn
         }));
        });
      }
    }
  });

  ws.on("close", function(code) {
    wss.clients.forEach(function (client) {
      client.send(JSON.stringify({ type: "CONNECTION-LOST" }));
    });
    
  });
});


server.listen(port, () =>
  console.log('*** Server is up and running on port ' + port + ' ***')
);
  
