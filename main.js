const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameState = {
    paused: true,
    level: 1,
    score: 0,
    bestScore: localStorage.getItem("bestScore") || 0,
    attempts: 0,
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
    friction: 0.85,
    ropeSwing: 0,
    ropeVelocity: 0,
    bottleWobble: 0,
    lastMouseX: 0,
    baseVelocity: 0
};

// --- Core Initialization ---
function init() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return; 

    canvas.width = rect.width;
    canvas.height = rect.height;
    
    gameState.originalBaseX = canvas.width / 2 - 80;
    gameState.bottleBaseX = gameState.originalBaseX;
    gameState.bottleBaseY = canvas.height * 0.85;
    gameState.ropeAnchorX = canvas.width / 2;
    
    document.getElementById("bestScore").textContent = gameState.bestScore;
    updateRingPosition();
    console.log("Game dimensions initialized: ", canvas.width, "x", canvas.height);
}

function updateRingPosition() {
    const totalLength = 170; 
    gameState.ringX = gameState.bottleBaseX + Math.cos(gameState.bottleAngle) * totalLength;
    gameState.ringY = gameState.bottleBaseY + Math.sin(gameState.bottleAngle) * totalLength;
}

// --- Physics Logic ---
function updatePhysics() {
    if (gameState.hasWon) return;

    gameState.ropeVelocity += (0 - gameState.ropeSwing) * 0.1;
    gameState.ropeVelocity *= 0.92;
    gameState.ropeSwing += gameState.ropeVelocity;
    gameState.bottleWobble *= 0.9;

    if (!gameState.isDragging) {
        gameState.baseVelocity += (gameState.originalBaseX - gameState.bottleBaseX) * 0.05;
        gameState.baseVelocity *= 0.8;
        gameState.bottleBaseX += gameState.baseVelocity;
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
    // Win logic: Bottle must be nearly 90 degrees vertical and base must be still
    if (gameState.bottleAngle <= -Math.PI / 2 * 0.97 && Math.abs(gameState.baseVelocity) < 0.3) {
        gameState.hasWon = true;
        gameState.score += 100 * gameState.level;
        document.getElementById("score").textContent = gameState.score;
        document.getElementById("status").textContent = "立起來了! 🎉";
        
        setTimeout(() => {
            gameState.hasWon = false;
            gameState.bottleAngle = 0;
            gameState.level++;
            gameState.friction = Math.max(0.4, gameState.friction - 0.08);
            document.getElementById("level").textContent = gameState.level;
            document.getElementById("frictionVal").textContent = gameState.friction.toFixed(2);
            document.getElementById("status").textContent = "Level " + gameState.level;
        }, 2000);
    }
}

// --- Rendering ---
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Table
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, gameState.bottleBaseY + 2);
    ctx.lineTo(canvas.width, gameState.bottleBaseY + 2);
    ctx.stroke();

    // 2. Rope
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

    // 3. Bottle
    ctx.save();
    const wobbleX = Math.sin(Date.now() * 0.05) * gameState.bottleWobble;
    ctx.translate(gameState.bottleBaseX + wobbleX, gameState.bottleBaseY);
    ctx.rotate(gameState.bottleAngle);
    ctx.fillStyle = "#10b981"; // Green bottle
    ctx.fillRect(0, -21, 135, 42); 
    ctx.fillRect(135, -9, 35, 18); 
    ctx.fillStyle = "#ff0033"; // Red cap
    ctx.fillRect(170, -11, 8, 22);  
    ctx.restore();

    // 4. Ring
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(gameState.ringX, gameState.ringY, gameState.ringRadius, 0, Math.PI * 2);
    ctx.stroke();
}

// --- UI Interaction ---
function handleStart() {
    console.log("Start button clicked");
    const overlay = document.getElementById("tutorialOverlay");
    if (overlay) overlay.style.display = "none";
    gameState.paused = false;
    init(); // Recalculate size when overlay disappears
}

function handlePause() {
    gameState.paused = !gameState.paused;
    document.getElementById("pauseOverlay").classList.toggle("hidden");
}

// --- Initialization & Loop ---
window.addEventListener("load", () => {
    init();
    
    // Core Game Loop
    const loop = () => {
        if (!gameState.paused) {
            updatePhysics();
            checkWinCondition();
        }
        drawGame();
        requestAnimationFrame(loop);
    };
    loop();

    // Bind events here to ensure buttons exist
    const startBtn = document.getElementById("startBtn");
    if(startBtn) startBtn.addEventListener("click", handleStart);
    
    const pauseBtn = document.getElementById("pauseBtn");
    if(pauseBtn) pauseBtn.addEventListener("click", handlePause);

    const resumeBtn = document.getElementById("resumeBtn");
    if(resumeBtn) resumeBtn.addEventListener("click", handlePause);

    const resetBtn = document.getElementById("resetBtn");
    if(resetBtn) resetBtn.addEventListener("click", () => location.reload());
    
    const exitBtn = document.getElementById("exitBtn");
    if(exitBtn) exitBtn.addEventListener("click", () => location.reload());
});

// --- Mouse/Touch Events ---
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
    if (!gameState.isDragging || gameState.paused) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const speed = mx - gameState.lastMouseX;
    gameState.ropeVelocity += speed * 0.15;
    if (Math.abs(speed) > 10) gameState.bottleWobble = Math.abs(speed) * 0.4;

    const dx = mx - gameState.bottleBaseX;
    const dy = my - gameState.bottleBaseY;
    gameState.bottleAngle = Math.max(-Math.PI / 2, Math.min(Math.atan2(dy, dx), 0));

    // Tension Slip Logic
    if (Math.abs(mx - gameState.ringX) > 40) {
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
