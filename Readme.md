# Multiplayer Tic-Tac-Toe Game

A real-time multiplayer Tic-Tac-Toe game built with Node.js, Express, EJS, and Socket.IO.

## Features

- 3x3 game grid
- Two-player gameplay (X and O)
- Alternating turns
- Real-time move synchronization
- Win/loss/draw detection
- Game restart functionality
- Room-based gameplay
- Player disconnection handling
- Mobile responsive design

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templates, CSS, JavaScript
- **Real-time Communication**: Socket.IO

## Setup Instructions

1. Clone the repository or extract the zip file
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Open a browser and navigate to `http://localhost:5001`
5. Open another browser window/tab or device and navigate to the same URL to play against yourself

## Project Structure

```
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── game.js
├── views/
│   ├── index.ejs
│   └── game.ejs
├── package.json
└── server.js
```

## Game Rules

- The game is played on a 3x3 grid
- Players take turns placing their mark (X or O) in an empty cell
- The first player to get three of their marks in a row (horizontally, vertically, or diagonally) wins
- If all cells are filled and no player has won, the game is a draw