// Connect to Socket.IO server
const socket = io();

// DOM Elements
const waitingScreen = document.getElementById('waiting-screen');
const gameArea = document.getElementById('game-area');
const board = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const gameMessage = document.getElementById('game-message');
const restartBtn = document.getElementById('restart-btn');
const playerXName = document.getElementById('player-x-name');
const playerOName = document.getElementById('player-o-name');
const playerXStatus = document.getElementById('player-x-status');
const playerOStatus = document.getElementById('player-o-status');
const roomFullMessage = document.getElementById('room-full-message');
const disconnectMessage = document.getElementById('disconnect-message');
const copyRoomIdBtn = document.getElementById('copy-room-id');

// Game state
let myTurn = false;
let mySymbol = '';
let currentRoom = null;

// Join the room
socket.emit('joinRoom', { roomId, playerName });

// Copy room ID functionality
copyRoomIdBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(roomId)
    .then(() => {
      const originalText = copyRoomIdBtn.textContent;
      copyRoomIdBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyRoomIdBtn.textContent = originalText;
      }, 2000);
    });
});

// Handle player joining
socket.on('playerJoined', ({ player, room }) => {
  currentRoom = room;
  mySymbol = player.symbol;
  
  // Update player information
  updatePlayerInfo(room);
});

// Handle room full scenario
socket.on('roomFull', () => {
  waitingScreen.classList.add('hidden');
  gameArea.classList.add('hidden');
  roomFullMessage.classList.remove('hidden');
});

// Update the game view when the room state changes
socket.on('roomUpdate', (room) => {
  currentRoom = room;
  updatePlayerInfo(room);
});

// Handle game start
socket.on('gameStart', (room) => {
  currentRoom = room;
  waitingScreen.classList.add('hidden');
  gameArea.classList.remove('hidden');
  updateGameStatus(room);
  updateBoard(room.board);
});

// Handle player moves
socket.on('moveMade', ({ room, move }) => {
  currentRoom = room;
  updateBoard(room.board);
  updateGameStatus(room);
});

// Handle game over
socket.on('gameOver', ({ winner, winningLine }) => {
  let message;
  
  if (winner) {
    message = `Player ${winner} wins!`;
    if (winningLine) {
      highlightWinningLine(winningLine);
    }
  } else {
    message = 'Game ended in a draw!';
  }
  
  gameMessage.textContent = message;
  myTurn = false;
});

// Handle game restart
socket.on('gameRestarted', (room) => {
  currentRoom = room;
  clearBoard();
  updateGameStatus(room);
  cells.forEach(cell => {
    cell.classList.remove('winning-cell');
  });
});

// Handle player disconnect
socket.on('playerLeft', ({ room, leftPlayerId }) => {
  currentRoom = room;
  gameArea.classList.add('hidden');
  disconnectMessage.classList.remove('hidden');
});

// Cell click event
board.addEventListener('click', (e) => {
  if (!e.target.classList.contains('cell')) return;
  
  if (currentRoom && !currentRoom.gameOver && myTurn) {
    const cellIndex = parseInt(e.target.dataset.index);
    
    if (currentRoom.board[cellIndex] === null) {
      socket.emit('makeMove', { roomId, cellIndex });
    }
  }
});

// Restart game button
restartBtn.addEventListener('click', () => {
  socket.emit('restartGame', { roomId });
});

// Wait for new player button
document.getElementById('wait-btn').addEventListener('click', () => {
  disconnectMessage.classList.add('hidden');
  waitingScreen.classList.remove('hidden');
});

// Update the board UI with current game state
function updateBoard(boardState) {
  cells.forEach((cell, index) => {
    cell.textContent = boardState[index] || '';
    if (boardState[index]) {
      cell.classList.add(`cell-${boardState[index].toLowerCase()}`);
    } else {
      cell.classList.remove('cell-x', 'cell-o');
    }
  });
}

// Update game status and turn information
function updateGameStatus(room) {
  myTurn = room.players.find(p => p.symbol === room.currentTurn)?.id === socket.id;
  
  if (room.gameOver) {
    if (room.winner) {
      gameMessage.textContent = `Player ${room.winner} wins!`;
    } else {
      gameMessage.textContent = 'Game ended in a draw!';
    }
  } else {
    gameMessage.textContent = `Current turn: ${room.currentTurn}`;
    
    // Add visual indicator for turns
    if (room.currentTurn === 'X') {
      playerXStatus.textContent = '(Playing)';
      playerOStatus.textContent = '';
    } else {
      playerXStatus.textContent = '';
      playerOStatus.textContent = '(Playing)';
    }
  }
}

// Highlight winning line
function highlightWinningLine(winningLine) {
  winningLine.forEach(index => {
    cells[index].classList.add('winning-cell');
  });
}

// Clear the board for a new game
function clearBoard() {
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('cell-x', 'cell-o', 'winning-cell');
  });
  gameMessage.textContent = `Current turn: ${currentRoom.currentTurn}`;
}

// Update player information in the UI
function updatePlayerInfo(room) {
  const xPlayer = room.players.find(p => p.symbol === 'X');
  const oPlayer = room.players.find(p => p.symbol === 'O');
  
  if (xPlayer) {
    playerXName.textContent = xPlayer.name;
  }
  
  if (oPlayer) {
    playerOName.textContent = oPlayer.name;
  }
}
