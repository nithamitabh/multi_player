import io from "socket.io-client";

const socket = io("http://localhost:3000");
function startGame() {
  const playerName = document.getElementById("playerName").value;
  if (playerName) {
    // Emit name to server and hide modal
    socket.emit("playerName", playerName);
    document.getElementById("nameModal").style.display = "none";
  } else {
    alert("Please enter a name!");
  }
}

// Update the game status and scores when received
socket.on("roundResult", (data) => {
  document.getElementById("status").innerText = `
        You chose: ${data.yourMove} | Opponent chose: ${data.opponentMove}
    `;
  document.getElementById("yourScore").innerText =
    `Your Score: ${data.yourScore}`;
  document.getElementById("opponentScore").innerText =
    `Opponent Score: ${data.opponentScore}`;
});

// Make a move and send it to the server
function makeMove(move) {
  console.log(`Player chose: ${move}`);
  document.getElementById("status").innerText = `You chose ${move}`;

  // Send the player's move to the server
  socket.emit("playerMove", { gameId: window.gameId, move });
}

// Handle game start
socket.on("gameStart", (data) => {
  document.getElementById("status").innerText =
    `Game started against ${data.opponent}`;
  window.gameId = data.gameId; // Save the gameId to send moves later
  document.getElementById("spinner").style.display = "none";
});

// Handle waiting message
socket.on("waiting", (message) => {
  document.getElementById("status").innerText = message;
  document.getElementById("spinner").style.display = "block";
});
function showNameModal() {
  document.getElementById("nameModal").style.display = "block";
}
// Call this function when the socket connects or when you want to prompt for the name
socket.on("connect", () => {
  showNameModal(); // Show modal to enter player name
});

// Handle the round result and update score
socket.on("roundResult", (data) => {
  document.getElementById("status").innerText = `
    You chose: ${data.yourMove} | Opponent chose: ${data.opponentMove}
    Your score: ${data.yourScore} | Opponent score: ${data.opponentScore}
  `;
});

// Handle game end and show the winner
socket.on("gameEnd", (data) => {
  document.getElementById("status").innerText =
    `Game over! ${data.winner} wins!`;
});

// Expose makeMove to the global scope for HTML to use
window.makeMove = makeMove;
window.startGame = startGame;
