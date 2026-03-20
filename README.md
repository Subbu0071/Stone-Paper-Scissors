# 🎮 Stone Paper Scissors - Enhanced Edition

**Stone Paper Scissors - Enhanced Edition** is a modern web-based version of the classic hand game, upgraded with smart AI behavior, difficulty controls, animations, sound effects, and a polished responsive interface.

This project goes beyond the basic version of the game by adding features that make gameplay feel more interactive, strategic, and visually engaging.

---
website: https://sps-subbu.netlify.app/
---

## ✨ Project Highlights

This is not just a simple Stone Paper Scissors project.

It includes:
- multiple difficulty levels
- predictive AI-based computer behavior
- score tracking
- undo and reset controls
- keyboard shortcuts
- modern UI styling
- responsive design
- sound feedback and visual effects

---

## 🚀 Features

### 🧠 Smart AI Opponent
The computer is not always random.

Depending on the selected difficulty:
- **Easy** → random moves
- **Medium** → somewhat smarter prediction
- **Hard** → tries more aggressively to counter the player

The AI uses player move history to predict the next likely move and respond strategically.

### 🎚 Difficulty Selector
The game includes a stylish difficulty selector with:
- stepper interface
- interactive difficulty cards
- AI type toggle

### 🕹 Core Gameplay
- Stone / Paper / Scissors gesture buttons
- Live round result display
- Player vs Computer score tracking
- Fun fact area for extra personality

### 🔁 Game Controls
- **Reset** button to restart the game
- **Undo** button to revert the last round
- Keyboard shortcuts:
  - `1` for Stone
  - `2` for Paper
  - `3` for Scissors

### 🎵 Sound & Feedback
The game includes:
- click sounds
- win / lose / draw audio feedback
- simple confetti effect on wins
- animated hand/result transitions

### 🎨 UI & Styling
- modern gradient background
- card-based layout
- Bootstrap-powered responsiveness
- animated buttons and gesture cards
- polished difficulty area design

---

## ⚙️ How It Works

1. Open the game in the browser
2. Choose a difficulty level
3. Click on Stone, Paper, or Scissors
4. The AI responds based on the selected difficulty
5. Scores update automatically
6. Use reset or undo whenever needed

---

## 🛠 Tech Stack

- **HTML5**
- **CSS3**
- **JavaScript**
- **Bootstrap 5**

---

## 🧠 AI Logic

The computer uses a lightweight predictive approach based on the player's move history.

### AI behavior:
- tracks previously played moves
- predicts likely next move
- counters that move depending on the selected difficulty
- falls back to random behavior when needed

This makes the game feel smarter than a traditional random opponent.

---

## 📂 Project Structure

```text
stone-paper-scissors-enhanced/
│
├── index.html
├── style.css
└── script.js
