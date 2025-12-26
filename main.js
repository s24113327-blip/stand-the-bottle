// --- Canvas Setup ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameState = {
    paused: true, // Starts true for the Tutorial Modal
    level: 1,
    score: 0,
    bestScore: localStorage.getItem("bestScore") || 0,
    attempts: 0,
    
    // Position & Physics
    bottleAngle: 0,
    bottleBaseX: 0,
    originalBaseX: 0,
    bottleBaseY: 0,
    ropeAnchorX: 0,
    ropeAnchorY: 40,
    ringX: 0,
    ringY: 0,
    ringRadius: 22,
    
    isDragging: false,
    hasWon: false,
    friction: 0.85, // Level 1 Friction
    
    // Animation/Movement States
    ropeSwing: 0,
    ropeVelocity: 0,
    bottleWobble: 0,
    lastMouseX: 0,
    baseVelocity: 0
};

// --- Initialization ---
function init() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    gameState.originalBaseX = canvas.width / 2 - 80;
    gameState.bottleBaseX = gameState.originalBaseX;
    gameState.bottleBaseY = canvas.height * 0.85;
    gameState.ropeAnchorX = canvas.width / 2;
    
    document.getElementById("bestScore").textContent = gameState.bestScore;
    updateRingPosition();
}

function updateRingPosition() {
    const totalLength = 170; // (bottleLength 135 + neckLength 35)
    gameState.ringX = gameState.bottleBaseX + Math.cos(gameState.bottleAngle) * totalLength;
    gameState.ringY = gameState.bottleBaseY + Math.sin(gameState.bottleAngle) * totalLength;
}

// --- Main Game Loop ---
function gameLoop() {
    if (!gameState.paused) {
        updatePhysics();
        checkWinCondition();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updatePhysics() {
    if (gameState.hasWon) return;

    // Rope Swing Logic
    gameState.ropeVelocity += (0 - gameState.ropeSwing) * 0.1;
    gameState.ropeVelocity *= 0.92;
    gameState.ropeSwing += gameState.ropeVelocity;
    
    gameState.bottleWobble *= 0.9;

    if (!gameState.isDragging) {
        // Return base to center
        gameState.baseVelocity += (gameState.originalBaseX - gameState.bottleBaseX) * 0.05;
        gameState.baseVelocity *= 0.8;
        gameState.bottleBaseX += gameState.baseVelocity;
        
        // Gravity (Bottle fall)
        if (gameState.bottleAngle < 0) gameState.bottleAngle += 0.05;
        if (gameState.bottleAngle > 0) gameState.bottleAngle = 0;
    } else {
        gameState.bottleBaseX += gameState.baseVelocity;
        gameState.baseVelocity *= 0.9;
    }
    updateRingPosition();
}

function checkWinCondition() {
    if (gameState.hasWon) return;
    
    // Threshold for vertical standing
    if (gameState.bottleAngle <= -Math.PI / 2 * 0.97) {
        // Base must be stable to count as a win
        if (Math.abs(gameState.baseVelocity) < 0.3) {
            handleWin();
        }
    }
}

function handleWin() {
    gameState.hasWon = true;
    gameState.isDragging = false;
    gameState.score += 100 * gameState.level;
    
    document.getElementById("score").textContent = gameState.score;
    document.getElementById("status").textContent = "立起來了! (STANDING!) 🎉";

    // Save High Score
    if (gameState.score > gameState.bestScore) {
        gameState.bestScore = gameState.score;
        localStorage.setItem("bestScore", gameState.bestScore);
        document.getElementById("bestScore").textContent = gameState.bestScore;
    }

    // Auto-advance Level after 2 seconds
    setTimeout(() => {
        gameState.level++;
        gameState.friction = Math.max(0.4, gameState.friction - 0.08); // Make it slipperier
        document.getElementById("level").textContent = gameState.level;
        document.getElementById("frictionVal").textContent = gameState.friction.toFixed(2);
        
        gameState.hasWon = false;
        gameState.bottleAngle = 0;
        gameState.bottleBaseX = gameState.originalBaseX;
        document.getElementById("status").textContent = "Level " + gameState.level + ": GO!";
    }, 2000);
}

// --- Drawing ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw Ground/Table (Neon Blue)
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00f3ff";
    ctx.beginPath();
    ctx.moveTo(0, gameState.bottleBaseY + 2);
    ctx.lineTo(canvas.width, gameState.bottleBaseY + 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. Draw Rope (Neon Yellow)
    ctx.strokeStyle = "#ffee00";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gameState.ropeAnchorX, gameState.ropeAnchorY);
    ctx.quadraticCurveTo(
        (gameState.ropeAnchorX + gameState.ringX) / 2 + gameState.ropeSwing,
        (gameState.ropeAnchorY + gameState.ringY) / 2 + 30,
        gameState.ringX, gameState.ringY
    );
    ctx.stroke();

    // 3. Draw Bottle
    ctx.save();
    const wobbleX = Math.sin(Date.now() * 0.05) * gameState.bottleWobble;
    ctx.translate(gameState.bottleBaseX + wobbleX, gameState.bottleBaseY);
    ctx.rotate(gameState.bottleAngle);
    
    // Body (Night Market Green)
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, -21, 135, 42); 
    // Neck
    ctx.fillRect(135, -9, 35, 18); 
    // Cap
    ctx.fillStyle = "#ff0033";
    ctx.fillRect(170, -11, 8, 22);  
    ctx.restore();

    // 4. Draw Ring (Neon Pink)
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff007f";
    ctx.beginPath();
    ctx.arc(gameState.ringX, gameState.ringY, gameState.ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// --- External UI Functions ---
function startGame() {
    document.getElementById("tutorialOverlay").style.display = "none";
    gameState.paused = false;
    init();
}

function togglePause() {
    gameState.paused = !gameState.paused;
    document.getElementById("pauseOverlay").classList.toggle("hidden");
}

function exitGame() {
    location.reload();
}

// --- Events ---
canvas.addEventListener("mousedown", (e) => {
    if (gameState.paused || gameState.hasWon) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (Math.hypot(mx - gameState.ringX, my - gameState.ringY) < 50) {
        gameState.isDragging = true;
        gameState.lastMouseX = mx;
    }
});

window.addEventListener("mousemove", (e) => {
    if (!gameState.isDragging || gameState.hasWon || gameState.paused) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Movement Physics triggers
    const speed = mx - gameState.lastMouseX;
    gameState.ropeVelocity += speed * 0.15;
    if (Math.abs(speed) > 10) gameState.bottleWobble = Math.abs(speed) * 0.4;

    const dx = mx - gameState.bottleBaseX;
    const dy = my - gameState.bottleBaseY;
    let angle = Math.atan2(dy, dx);
    gameState.bottleAngle = Math.max(-Math.PI / 2, Math.min(angle, 0));

    // Tension Slip Logic (Slippery level mechanic)
    const pull = Math.abs(mx - gameState.ringX);
    if (pull > 40) {
        gameState.baseVelocity += (mx > gameState.bottleBaseX ? 1 : -1) * (1.1 - gameState.friction);
    }
    gameState.lastMouseX = mx;
});

window.addEventListener("mouseup", () => {
    if (gameState.isDragging) {
        gameState.isDragging = false;
        gameState.attempts++;
        document.getElementById("attempts").textContent = gameState.attempts;
    }
});

// Setup Game
window.addEventListener("load", () => {
    init();
    gameLoop();
});

// UI Event Binding
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("resetBtn").addEventListener("click", () => location.reload());
