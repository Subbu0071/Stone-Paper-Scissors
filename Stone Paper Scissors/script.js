// script.js - Enhanced with Smart AI + Game Modes
// Robust: handles missing optional controls (start/pause/custom inputs) gracefully.

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Core constants & DOM refs ---------- */
    const gestures = ['rock', 'paper', 'scissors'];
    const gestureIcons = { rock: '🪨', paper: '📄', scissors: '✂️' };

    // DOM (some elements may be missing by design; guard later)
    const playerScoreEl = document.getElementById('player-score');
    const computerScoreEl = document.getElementById('computer-score');
    const resultMessageEl = document.getElementById('result-message');
    const playerChoiceEl = document.getElementById('player-choice');
    const computerChoiceEl = document.getElementById('computer-choice');
    const gestureBtns = document.querySelectorAll('.gesture-btn-enhanced');
    const resetBtn = document.getElementById('reset-btn');
    const undoBtn = document.getElementById('undo-btn');
    const funFactEl = document.getElementById('fun-fact');

    const modeSelect = document.getElementById('mode-select');
    const modeInfo = document.getElementById('mode-info');           // optional
    const gameModeBanner = document.getElementById('game-mode-banner');
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-game');          // optional
    const pauseBtn = document.getElementById('pause-game');          // optional
    const customTargetInput = document.getElementById('custom-target'); // optional
    const aiEnableCheckbox = document.getElementById('ai-enable');

    /* ---------- Difficulty UI (stepper + cards) ---------- */
    function setDifficulty(diff) {
        // Stepper
        document.querySelectorAll('#difficulty-stepper .stepper-step').forEach((step, i) => {
            step.classList.toggle('active', (diff === 'easy' && i === 0) || (diff === 'medium' && i === 1) || (diff === 'hard' && i === 2));
        });
        // flip cards
        document.querySelectorAll('#difficulty-cards .flip-card').forEach(card => {
            card.classList.toggle('selected', card.getAttribute('data-difficulty') === diff);
        });
        window._selectedDifficulty = diff;
    }
    document.querySelectorAll('#difficulty-stepper .stepper-step').forEach((step, i) => {
        step.addEventListener('click', () => setDifficulty(['easy','medium','hard'][i]));
    });
    document.querySelectorAll('#difficulty-cards .flip-card').forEach(card => {
        card.addEventListener('click', () => setDifficulty(card.getAttribute('data-difficulty')));
    });
    setDifficulty('medium'); // default

    // Helper to get difficulty
    window.getSelectedDifficulty = function() {
        return window._selectedDifficulty || 'medium';
    };

    /* ---------- Sounds (graceful fallback) ---------- */
    const sounds = {
        click: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
        win: new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3'),
        lose: new Audio('https://www.soundjay.com/buttons/sounds/button-29.mp3'),
        draw: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3')
    };
    Object.values(sounds).forEach(a => { a.addEventListener('error', ()=>{ a.play = ()=>{}; }); });

    /* ---------- Game state ---------- */
    let playerScore = 0;
    let computerScore = 0;
    let roundsPlayed = 0;
    let history = []; // stores {player, computer, result}
    let playerMoves = []; // timeline of player's choices for AI
    let lastRound = null; // for undo
    let gameRunning = false;
    let paused = false;

    // Mode state
    let gameMode = 'bestof'; // bestof / firstto / timed / custom
    let target = 5; // for bestof => best of 5 (rounds); for firstto => wins needed; for timed => seconds
    let timer = null;
    let timeLeft = 0;

    /* ---------- Fun facts ---------- */
    const funFacts = [
        "Did you know? The game is over 2,000 years old!",
        "Tip: Mix up your moves to stay unpredictable.",
        "Fun Fact: 'Rock' is the most common first move.",
        "Try to read your opponent's patterns!",
        "In Japan, it's called 'Jan-Ken'."
    ];
    function showRandomFunFact() {
        if (funFactEl) funFactEl.textContent = funFacts[Math.floor(Math.random()*funFacts.length)];
    }
    showRandomFunFact();

    /* ---------- Utility: getResult ---------- */
    function getResult(player, computer) {
        if (player === computer) return 'draw';
        if ((player === 'rock' && computer === 'scissors') ||
            (player === 'paper' && computer === 'rock') ||
            (player === 'scissors' && computer === 'paper')) return 'win';
        return 'lose';
    }

    /* ---------- Smart AI predictor (Markov-like + frequency fallback) ---------- */
    function predictPlayerNext() {
        if (playerMoves.length === 0) {
            return mostFrequent(playerMoves) || randomChoice(gestures);
        }
        const last = playerMoves[playerMoves.length - 1];
        const transitions = {};
        for (let i = 0; i < playerMoves.length - 1; i++) {
            const a = playerMoves[i], b = playerMoves[i+1];
            if (a === last) transitions[b] = (transitions[b] || 0) + 1;
        }
        const keys = Object.keys(transitions);
        if (keys.length > 0) {
            keys.sort((x,y) => transitions[y] - transitions[x]);
            return keys[0];
        }
        return mostFrequent(playerMoves) || randomChoice(gestures);
    }
    function mostFrequent(arr) {
        if (!arr || arr.length === 0) return null;
        const freq = {};
        for (const v of arr) freq[v] = (freq[v] || 0) + 1;
        let best = null, bestCount = -1;
        for (const k in freq) if (freq[k] > bestCount) { best = k; bestCount = freq[k]; }
        return best;
    }
    function randomChoice(list) { return list[Math.floor(Math.random()*list.length)]; }
    function counterMoveTo(move) {
        if (move === 'rock') return 'paper';
        if (move === 'paper') return 'scissors';
        return 'rock';
    }

    function getComputerChoice() {
        const diff = getSelectedDifficulty();
        const aiEnabled = aiEnableCheckbox ? aiEnableCheckbox.checked : true;

        if (!aiEnabled || diff === 'easy') return randomChoice(gestures);

        const predicted = predictPlayerNext();

        if (diff === 'hard') {
            if (Math.random() < 0.92) return counterMoveTo(predicted);
            return randomChoice(gestures);
        }
        if (Math.random() < 0.65) return counterMoveTo(predicted);
        return randomChoice(gestures);
    }

    /* ---------- UI helpers ---------- */
    function showResultUI(result, player, computer) {
        if (playerChoiceEl) playerChoiceEl.textContent = gestureIcons[player] || '❔';
        if (computerChoiceEl) computerChoiceEl.textContent = gestureIcons[computer] || '❔';
        if (!resultMessageEl) return;
        if (result === 'win') {
            resultMessageEl.textContent = 'You Win! 🎉';
            resultMessageEl.style.color = '#28a745';
            confettiEffect();
        } else if (result === 'lose') {
            resultMessageEl.textContent = 'You Lose! 😢';
            resultMessageEl.style.color = '#dc3545';
        } else {
            resultMessageEl.textContent = "It's a Draw!";
            resultMessageEl.style.color = '#ffc107';
        }
    }
    function updateScoresUI() {
        if (playerScoreEl) playerScoreEl.textContent = playerScore;
        if (computerScoreEl) computerScoreEl.textContent = computerScore;
    }
    function animateHands() {
        if (!playerChoiceEl || !computerChoiceEl) return;
        playerChoiceEl.classList.remove('animated');
        computerChoiceEl.classList.remove('animated');
        void playerChoiceEl.offsetWidth;
        void computerChoiceEl.offsetWidth;
        playerChoiceEl.classList.add('animated');
        computerChoiceEl.classList.add('animated');
        setTimeout(()=>{ playerChoiceEl.classList.remove('animated'); computerChoiceEl.classList.remove('animated'); }, 350);
    }

    /* ---------- Game flow: start / pause / reset / undo ---------- */
    function resetGame(preserveMode = false) {
        playerScore = 0; computerScore = 0; roundsPlayed = 0;
        history = []; playerMoves = []; lastRound = null;
        updateScoresUI();
        if (resultMessageEl) resultMessageEl.textContent = '';
        if (playerChoiceEl) playerChoiceEl.textContent = '❔';
        if (computerChoiceEl) computerChoiceEl.textContent = '❔';
        showRandomFunFact();
        stopTimer();
        gameRunning = false;
        paused = false;
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (undoBtn) undoBtn.disabled = true;
    }

    function undoLast() {
        if (!lastRound) return;
        const r = lastRound;
        if (r.result === 'win') playerScore = Math.max(0, playerScore-1);
        if (r.result === 'lose') computerScore = Math.max(0, computerScore-1);
        history.pop();
        if (playerMoves.length) playerMoves.pop();
        updateScoresUI();
        lastRound = null;
        if (undoBtn) undoBtn.disabled = true;
        if (resultMessageEl) {
            resultMessageEl.textContent = 'Last round undone';
            setTimeout(()=> resultMessageEl.textContent = '', 1200);
        }
    }

    function applyModeSettings() {
        if (!modeSelect) return;
        gameMode = modeSelect.value;
        if (gameMode === 'bestof') {
            target = 5;
            if (modeInfo) modeInfo.textContent = 'Best of 5';
            if (gameModeBanner) gameModeBanner.textContent = 'Mode: Best of 5';
            if (timerDisplay) timerDisplay.textContent = '';
        } else if (gameMode === 'firstto') {
            target = 10;
            if (modeInfo) modeInfo.textContent = 'First to 10';
            if (gameModeBanner) gameModeBanner.textContent = 'Mode: First to 10';
            if (timerDisplay) timerDisplay.textContent = '';
        } else if (gameMode === 'timed') {
            target = 30;
            if (modeInfo) modeInfo.textContent = 'Timed: 30s';
            if (gameModeBanner) gameModeBanner.textContent = 'Mode: Timed - 30s';
        } else if (gameMode === 'custom') {
            const v = customTargetInput && !isNaN(parseInt(customTargetInput.value)) ? parseInt(customTargetInput.value) : target;
            target = v > 0 ? v : target;
            if (modeInfo) modeInfo.textContent = `Custom: ${target}`;
            if (gameModeBanner) gameModeBanner.textContent = `Mode: Custom (${target})`;
        }
    }

    // startGame function (works with or without an actual start button)
    function startGame() {
        applyModeSettings();
        gameRunning = true;
        paused = false;
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        if (undoBtn) undoBtn.disabled = false;
        if (gameMode === 'timed') startTimedMode(target);
    }

    // If optional start button exists, wire it
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    // If optional pause button exists, wire toggle behavior
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (!gameRunning) return;
            paused = !paused;
            if (paused) {
                pauseBtn.textContent = 'Resume';
                stopTimer();
            } else {
                pauseBtn.textContent = 'Pause';
                if (gameMode === 'timed') startTimedMode(timeLeft || target, true);
            }
        });
    }

    if (resetBtn) resetBtn.addEventListener('click', () => resetGame());
    if (undoBtn) undoBtn.addEventListener('click', () => undoLast());

    /* ---------- Timer logic for timed mode ---------- */
    function startTimedMode(seconds, resume=false) {
        if (!resume) timeLeft = seconds;
        if (timerDisplay) timerDisplay.textContent = `Time left: ${timeLeft}s`;
        stopTimer();
        timer = setInterval(() => {
            if (paused) return;
            timeLeft--;
            if (timerDisplay) timerDisplay.textContent = `Time left: ${timeLeft}s`;
            if (timeLeft <= 0) {
                stopTimer();
                endGameByTimed();
            }
        }, 1000);
    }
    function stopTimer() {
        if (timer) { clearInterval(timer); timer = null; }
    }
    function endGameByTimed() {
        gameRunning = false;
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (!resultMessageEl) return;
        if (playerScore > computerScore) {
            resultMessageEl.textContent = `Time's up — You win! 🎉`;
            confettiEffect();
        } else if (playerScore < computerScore) {
            resultMessageEl.textContent = `Time's up — Computer wins!`;
        } else {
            resultMessageEl.textContent = `Time's up — It's a draw!`;
        }
    }

    /* ---------- Main click handlers for gestures ---------- */
    gestureBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Auto-start if no start button (friendly)
            if (!gameRunning) startGame();
            if (paused) return;
            if (sounds.click) { sounds.click.currentTime = 0; sounds.click.play(); }

            // UI animate
            gestureBtns.forEach(b => b.classList.remove('animated'));
            btn.classList.add('animated');
            setTimeout(()=>btn.classList.remove('animated'), 350);

            const playerChoice = btn.getAttribute('data-gesture');
            const computerChoice = getComputerChoice();
            const result = getResult(playerChoice, computerChoice);

            roundsPlayed++;
            if (result === 'win') playerScore++;
            if (result === 'lose') computerScore++;

            lastRound = { player: playerChoice, computer: computerChoice, result };
            history.push(lastRound);
            playerMoves.push(playerChoice);

            updateScoresUI();
            showResultUI(result, playerChoice, computerChoice);
            animateHands();
            showRandomFunFact();
            if (undoBtn) undoBtn.disabled = false;

            if (result === 'win') { if (sounds.win) { sounds.win.currentTime = 0; sounds.win.play(); } }
            else if (result === 'lose') { if (sounds.lose) { sounds.lose.currentTime = 0; sounds.lose.play(); } }
            else { if (sounds.draw) { sounds.draw.currentTime = 0; sounds.draw.play(); } }

            checkModeEnd();
        });
    });

    /* ---------- Mode end conditions ---------- */
    function checkModeEnd() {
        if (gameMode === 'bestof') {
            const roundsNeeded = target;
            const majority = Math.ceil(roundsNeeded / 2);
            if (playerScore >= majority || computerScore >= majority || roundsPlayed >= roundsNeeded) {
                endGameWithWinner();
            }
        } else if (gameMode === 'firstto') {
            if (playerScore >= target || computerScore >= target) endGameWithWinner();
        } else if (gameMode === 'timed') {
            // no-op (timer handles it)
        } else if (gameMode === 'custom') {
            if (playerScore >= target || computerScore >= target) endGameWithWinner();
        }
    }

    function endGameWithWinner() {
        gameRunning = false;
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        stopTimer();
        if (!resultMessageEl) return;
        if (playerScore > computerScore) {
            resultMessageEl.textContent = `Game over — You won! 🎉`;
            confettiEffect();
        } else if (playerScore < computerScore) {
            resultMessageEl.textContent = `Game over — Computer won.`;
        } else {
            resultMessageEl.textContent = `Game over — It's a draw.`;
        }
    }

    /* ---------- Theme toggle ---------- */
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('enhanced-bg');
            if (document.body.classList.contains('enhanced-bg')) themeIcon.textContent = '🌙';
            else themeIcon.textContent = '☀️';
        });
    }

    /* ---------- Confetti (kept) ---------- */
    function confettiEffect() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.position = 'fixed';
        confetti.style.left = '50%';
        confetti.style.top = '20%';
        confetti.style.transform = 'translate(-50%, -50%)';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = 9999;
        confetti.innerHTML = '🎊🎉✨';
        confetti.style.fontSize = '2.5rem';
        confetti.style.opacity = '1';
        document.body.appendChild(confetti);
        setTimeout(() => {
            confetti.style.transition = 'opacity 0.8s';
            confetti.style.opacity = '0';
            setTimeout(() => confetti.remove(), 800);
        }, 900);
    }

    /* ---------- Undo initial state ---------- */
    if (undoBtn) undoBtn.disabled = true;

    /* ---------- Initialize mode display ---------- */
    if (modeSelect) {
        modeSelect.addEventListener('change', applyModeSettings);
        applyModeSettings();
    }

    /* ---------- Keyboard shortcuts ---------- */
    document.addEventListener('keydown', (e) => {
        if (e.key === '1') document.querySelector('[data-gesture="rock"]').click();
        if (e.key === '2') document.querySelector('[data-gesture="paper"]').click();
        if (e.key === '3') document.querySelector('[data-gesture="scissors"]').click();
    });

});
