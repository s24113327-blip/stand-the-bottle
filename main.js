const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const state = {
    active: false,
    angle: 0,
    baseX: 0,
    baseY: 0,
    isDragging: false,
    win: false,
    attempts: 0
};

// Initialize positions
function setup() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    state.baseX = canvas.width / 2 - 60;
    state.baseY = canvas.height * 0.8;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.strokeStyle = "#00f3ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, state.baseY + 2);
    ctx.lineTo(canvas.width, state.baseY + 2);
    ctx.stroke();

    // Bottle
    ctx.save();
    ctx.translate(state.baseX, state.baseY);
    ctx.rotate(state.angle);
    ctx.fillStyle = "#10b981";
    ctx.fillRect(0, -15, 120, 30); // Body
    ctx.fillStyle = "#ff0033";
    ctx.fillRect(120, -8, 15, 16); // Neck
    ctx.restore();

    // Ring
    const ringX = state.baseX + Math.cos(state.angle) * 135;
    const ringY = state.baseY + Math.sin(state.angle) * 135;
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(ringX, ringY, 18, 0, Math.PI * 2);
    ctx.stroke();

    if (state.active) requestAnimationFrame(draw);
}

// Logic to start the game
function play() {
    document.getElementById("tutorialOverlay").classList.add("hidden");
    state.active = true;
    setup();
    draw();
}

// Click Listeners (Wait for load)
window.onload = () => {
    document.getElementById("startBtn").onclick = play;
    
    document.getElementById("pauseBtn").onclick = () => {
        state.active = !state.active;
        document.getElementById("pauseOverlay").classList.toggle("hidden");
        if (state.active) draw();
    };

    document.getElementById("resumeBtn").onclick = () => {
        state.active = true;
        document.getElementById("pauseOverlay").classList.add("hidden");
        draw();
    };

    document.getElementById("resetBtn").onclick = () => location.reload();
};

// Controls
canvas.onmousedown = () => state.isDragging = true;
window.onmouseup = () => {
    if (state.isDragging) {
        state.attempts++;
        document.getElementById("attempts").innerText = state.attempts;
    }
    state.isDragging = false;
};

window.onmousemove = (e) => {
    if (!state.isDragging || !state.active) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;

    // Calculate angle from base to mouse
    state.angle = Math.atan2(my - state.baseY, mx - state.baseX);
    
    // Constraints (can't pull through the floor)
    if (state.angle > 0) state.angle = 0;
    if (state.angle < -Math.PI / 2 * 1.1) state.angle = -Math.PI / 2 * 1.1;

    // Check Win
    if (state.angle < -1.5) {
        document.getElementById("status").innerText = "YOU DID IT! 🎉";
    } else {
        document.getElementById("status").innerText = "Lifting...";
    }
};
