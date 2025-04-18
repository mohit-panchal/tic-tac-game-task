const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Set EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/game/:roomId", (req, res) => {
  res.render("game", { roomId: req.params.roomId });
});

// Game state management
const rooms = {};

// Initialize a new game room
function createNewRoom(roomId) {
  return {
    players: [],
    currentTurn: "X",
    board: Array(9).fill(null),
    gameOver: false,
    winner: null,
  };
}

// Check for a win or draw
function checkGameStatus(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  // Check for win
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { gameOver: true, winner: board[a], winningLine: pattern };
    }
  }

  // Check for draw
  if (!board.includes(null)) {
    return { gameOver: true, winner: null };
  }

  // Game still in progress
  return { gameOver: false, winner: null };
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Create or join a room
  socket.on("joinRoom", ({ roomId, playerName }) => {
    socket.join(roomId);

    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = createNewRoom(roomId);
    }

    const room = rooms[roomId];

    // Handle player joining
    if (room.players.length < 2) {
      const playerSymbol = room.players.length === 0 ? "X" : "O";
      const player = { id: socket.id, name: playerName, symbol: playerSymbol };
      room.players.push(player);

      socket.emit("playerJoined", { player, room });
      io.to(roomId).emit("roomUpdate", room);

      if (room.players.length === 2) {
        io.to(roomId).emit("gameStart", room);
      }
    } else {
      // Room is full
      socket.emit("roomFull");
    }
  });

  // Handle player moves
  socket.on("makeMove", ({ roomId, cellIndex }) => {
    const room = rooms[roomId];
    if (!room || room.gameOver) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player || player.symbol !== room.currentTurn) return;

    // Check if the cell is empty
    if (room.board[cellIndex] === null) {
      room.board[cellIndex] = player.symbol;
      room.currentTurn = room.currentTurn === "X" ? "O" : "X";

      // Check game status
      const status = checkGameStatus(room.board);
      if (status.gameOver) {
        room.gameOver = true;
        room.winner = status.winner;
        room.winningLine = status.winningLine;
      }

      io.to(roomId).emit("moveMade", {
        room,
        move: { player, cellIndex },
      });

      if (status.gameOver) {
        io.to(roomId).emit("gameOver", {
          winner: status.winner,
          winningLine: status.winningLine,
        });
      }
    }
  });

  // Handle game restart
  socket.on("restartGame", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.board = Array(9).fill(null);
    room.currentTurn = "X";
    room.gameOver = false;
    room.winner = null;
    room.winningLine = null;

    io.to(roomId).emit("gameRestarted", room);
  });

  // Handle disconnections
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    // Find the room this player was in
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);

      if (playerIndex !== -1) {
        // Remove the player
        room.players.splice(playerIndex, 1);

        if (room.players.length === 0) {
          // Delete empty rooms
          delete rooms[roomId];
        } else {
          // Notify remaining player
          io.to(roomId).emit("playerLeft", {
            room,
            leftPlayerId: socket.id,
          });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
