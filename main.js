const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const state = {
    active: false,
    angle: 0,
    baseX: 0,
    originalBaseX: 0,
    baseY: 0,
    baseVel: 0,
    ropeSwing: 0,
    ropeVel: 0,
    isDragging: false,
    attempts: 0,
    score: 0,
    friction: 0.85
};

function setup() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    state.originalBaseX = canvas.width / 2 - 80;
    state.baseX = state.originalBaseX;
    state.baseY = canvas.height * 0.85;
}

function update() {
    if (!state.active) return;

    // Rope Physics
    state.ropeVel += (0 - state.ropeSwing) * 0.1;
    state.ropeVel *= 0.92;
    state.ropeSwing += state.ropeVel;

    if (!state.isDragging) {
        // Return bottle to ground if let go
        state.baseVel += (state.originalBaseX - state.baseX) * 0.05;
        state.baseVel *= 0.8;
        state.baseX += state.baseVel;
        if (state.angle < 0) state.angle += 0.05;
        if (state.angle > 0) state.angle = 0;
    } else {
        state.baseX += state.baseVel;
        state.baseVel *= 0.9;
    }

    // Win condition: Perfectly vertical
    if (state.angle <= -Math.PI / 2 * 0.98 && Math.abs(state.baseVel) < 0.2) {
        state.score += 100;
        document.getElementById("score").innerText = state.score;
        document.getElementById("status").innerText = "WIN! 🎉";
        state.isDragging = false;
        state.angle = 0;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, state.baseY + 2);
    ctx.lineTo(canvas.width, state.baseY + 2);
    ctx.stroke();

    // Rope (Quadratic curve for realism)
    const ringX = state.baseX + Math.cos(state.angle) * 170;
    const ringY = state.baseY + Math.sin(state.angle) * 170;
    ctx.strokeStyle = "#ffee00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 40); // Top anchor
    ctx.quadraticCurveTo(
        (canvas.width / 2 + ringX) / 2 + state.ropeSwing,
        (40 + ringY) / 2 + 30,
        ringX, ringY
    );
    ctx.stroke();

    // Bottle
    ctx.save();
    ctx.translate(state.baseX, state.baseY);
    ctx.rotate(state.angle);
    ctx.fillStyle = "#10b981"; // Green bottle
    ctx.fillRect(0, -21, 135, 42); 
    ctx.fillStyle = "#ff0033"; // Red cap
    ctx.fillRect(135, -10, 20, 20); 
    ctx.restore();

    // Ring
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(ringX, ringY, 22, 0, Math.PI * 2);
    ctx.stroke();

    update();
    requestAnimationFrame(draw);
}

// THE BUTTON FIX: Forced listener
const initGame = () => {
    console.log("Game Starting...");
    const overlay = document.getElementById("tutorialOverlay");
    if (overlay) overlay.classList.add("hidden");
    state.active = true;
    setup();
    draw();
};

window.addEventListener("load", () => {
    const btn = document.getElementById("startBtn");
    // We use both click and mousedown to be 100% sure it fires
    btn.addEventListener("click", initGame);
    btn.addEventListener("touchstart", initGame);
});

// Controls
canvas.addEventListener("mousedown", (e) => {
    if (!state.active) return;
    state.isDragging = true;
});

window.addEventListener("mousemove", (e) => {
    if (!state.isDragging || !state.active) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    const dx = mx - state.baseX;
    const dy = my - state.baseY;
    
    // Previous angle to calculate speed
    const oldAngle = state.angle;
    state.angle = Math.max(-Math.PI / 2, Math.min(Math.atan2(dy, dx), 0));
    
    // If you pull too fast, the base slides
    const moveSpeed = state.angle - oldAngle;
    if (Math.abs(moveSpeed) > 0.02) {
        state.baseVel += (mx > state.baseX ? 1 : -1) * 0.5;
    }
});

window.addEventListener("mouseup", () => {
    if (state.isDragging) {
        state.attempts++;
        document.getElementById("attempts").innerText = state.attempts;
    }
    state.isDragging = false;
});
