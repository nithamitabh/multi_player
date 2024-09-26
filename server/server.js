const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors"); // Import cors
const app = express();
const server = http.createServer(app);

// Enable CORS middleware for Express
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from your Vite dev server
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Allow your Vite client to connect
    methods: ["GET", "POST"],
  },
});

let lobby = [];
let games = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add player to the lobby
  lobby.push(socket);

  // Check if there are enough players to start a game
  if (lobby.length >= 2) {
    const player1 = lobby.shift();
    const player2 = lobby.shift();

    const gameId = `${player1.id}-${player2.id}`;
    games[gameId] = {
      player1,
      player2,
      player1Score: 0,
      player2Score: 0,
    };

    // Start the game by notifying both players
    player1.emit("gameStart", { opponent: "Player 2", gameId });
    player2.emit("gameStart", { opponent: "Player 1", gameId });

    console.log(`Game started between ${player1.id} and ${player2.id}`);
  } else {
    // Notify player they are waiting for an opponent
    socket.emit("waiting", "Waiting for another opponent...");
  }

  // Handle the player's move
  socket.on("playerMove", (data) => {
    const { gameId, move } = data;
    const game = games[gameId];

    if (!game) return;

    // Track which player made the move
    if (game.player1.id === socket.id) {
      game.player1Move = move;
    } else {
      game.player2Move = move;
    }

    // If both players have made a move, determine the winner of the round
    if (game.player1Move && game.player2Move) {
      const result = determineWinner(game.player1Move, game.player2Move);

      if (result === "player1") {
        game.player1Score += 1;
      } else if (result === "player2") {
        game.player2Score += 1;
      }

      // Notify both players of the round result and updated score
      game.player1.emit("roundResult", {
        yourMove: game.player1Move,
        opponentMove: game.player2Move,
        yourScore: game.player1Score,
        opponentScore: game.player2Score,
      });
      game.player2.emit("roundResult", {
        yourMove: game.player2Move,
        opponentMove: game.player1Move,
        yourScore: game.player2Score,
        opponentScore: game.player1Score,
      });

      // Check if a player has won the game (3 points)
      if (game.player1Score === 3 || game.player2Score === 3) {
        const winner = game.player1Score === 3 ? "Player 1" : "Player 2";
        game.player1.emit("gameEnd", { winner });
        game.player2.emit("gameEnd", { winner });
        console.log(`${winner} won the game!`);

        // Remove the game
        delete games[gameId];
      }

      // Clear the moves for the next round
      delete game.player1Move;
      delete game.player2Move;
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    lobby = lobby.filter((player) => player.id !== socket.id);
  });
});

// Function to determine round winner
function determineWinner(move1, move2) {
  if (move1 === move2) return "draw";
  if (
    (move1 === "Stone" && move2 === "Scissors") ||
    (move1 === "Paper" && move2 === "Stone") ||
    (move1 === "Scissors" && move2 === "Paper")
  ) {
    return "player1";
  } else {
    return "player2";
  }
}

// function updateScores(result, game) {
//   if (result.winner === "Player 1") game.scores[game.players[0].id]++;
//   if (result.winner === "Player 2") game.scores[game.players[1].id]++;
// }

server.listen(3000, () => {
  console.log("Server listening on *:3000");
});
