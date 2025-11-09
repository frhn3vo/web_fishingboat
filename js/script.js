// Draw Canva
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const resetBtn = document.getElementById("resetBtn");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

// Timer
let timeLeft = 60;
let timerInterval;
let gamePaused = false;
let animationFrameId;

// Player (boat)
const boat = {
    x: canvas.width / 2 - 40,
    y: 235,
    width: 80,
    height: 40,
    color: "#ffb300",
    speed: 5
};

// Hook
let hook = null;

// Splash animation data
const splashes = []; // will hold active splash effects

// Score
let score = 0;

// Environment objects
const sun = { x: 100, y: 80, radius: 40 };
const clouds = [
    { x: 200, y: 70, speed: 0.3 },
    { x: 500, y: 100, speed: 0.2 },
    { x: 750, y: 60, speed: 0.4 }
];

// Fish types
const fishTypes = [
    { color: "#4dd0e1", size: 15, points: 1, speed: 1.5 },
    { color: "#81c784", size: 25, points: 2, speed: 1.2 },
    { color: "#ef5350", size: 35, points: 5, speed: 0.8 }
];
const fishArray = [];

// Spawn Fish
function spawnFish() {
    for (let i = 0; i < 10; i++) {
        const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        fishArray.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height - 250) + 300,
            size: type.size,
            color: type.color,
            points: type.points,
            speed: type.speed,
            dir: Math.random() < 0.5 ? 1 : -1, // direction (1 = right, -1 = left)
            offset: Math.random() * 1000 // for bobbing motion
        });
    }
}

// Control
const keys = {};
window.addEventListener("keydown", e => (keys[e.key] = true));
window.addEventListener("keyup", e => (keys[e.key] = false));
resetBtn.addEventListener("click", resetGame);
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (mouseY > 250) {
        //hook = { x: boat.x + boat.width / 2, y: boat.y + boat.height, targetY: mouseY };
        //hook = { x: mouseX, y: mouseY };
        hook = {
            x: boat.x + boat.width / 2,   // fixed horizontal position
            y: boat.y + boat.height,      // starts below the boat
            targetY: mouseY,               // only moves vertically
            retracting: false
        };
        createSplash(mouseX, mouseY); //splash when hook hits water
    }
});

// Collision
function checkCatch(fish, hook) {
    const dx = hook.x - fish.x;
    const dy = hook.y - fish.y;
    return Math.sqrt(dx * dx + dy * dy) < fish.size;
}

//Draw Function
function drawSun() {
    const gradient = ctx.createRadialGradient(sun.x, sun.y, 10, sun.x, sun.y, sun.radius);
    gradient.addColorStop(0, "#fff7a3");
    gradient.addColorStop(1, "#FFD700");

    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.closePath();
}

function drawCloud(x, y) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y + 5, 25, 0, Math.PI * 2);
    ctx.arc(x + 55, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

let boatFloatTime = 0;
const boatFloatAmplitude = 3; // how high the boat moves (3px up/down)
const boatFloatSpeed = 0.05;  // how fast it moves

function drawBoat() {
    // Make the boat move up and down smoothly
    boatFloatTime += boatFloatSpeed;
    const floatOffset = Math.sin(boatFloatTime) * boatFloatAmplitude;

    const boatY = boat.y + floatOffset;

    ctx.fillStyle = boat.color;
    ctx.beginPath();
    ctx.moveTo(boat.x, boatY);
    ctx.lineTo(boat.x + boat.width, boatY);
    ctx.lineTo(boat.x + boat.width - 10, boatY + 20);
    ctx.lineTo(boat.x + 10, boatY + 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffcc80";
    ctx.fillRect(boat.x + 20, boatY - 10, 40, 10);
}

let fishWiggleAngle = 0;

function drawFish(fish) {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.scale(fish.dir, 1); // flip horizontally if swimming left

    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size, fish.size / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = fish.color;
    ctx.fill();
    ctx.strokeStyle = "#B22222";
    ctx.stroke();
    ctx.closePath();

    // Tail (triangle)
    ctx.beginPath();
    ctx.moveTo(-fish.size, 0);
    ctx.lineTo(-fish.size - 10, -fish.size / 2);
    ctx.lineTo(-fish.size - 10, fish.size / 2);
    ctx.closePath();
    ctx.fillStyle = "#ffb547ff";
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function drawHook() {
    if (!hook) return;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boat.x + boat.width / 2, boat.y + 20);
    ctx.lineTo(hook.x, hook.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hook.x, hook.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ccc";
    ctx.fill();
}

function createSplash(x, y) {
    splashes.push({
        x,
        y,
        radius: 0,
        alpha: 1
    });
}

function drawSplashes() {
    splashes.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

//Update Logic
function updateClouds() {
    for (let c of clouds) {
        c.x += c.speed;
        if (c.x > canvas.width + 60) c.x = -60; // wrap around
    }
}

function updateBoat() {
    if (keys["ArrowLeft"] && boat.x > 0) boat.x -= boat.speed;
    if (keys["ArrowRight"] && boat.x + boat.width < canvas.width)
        boat.x += boat.speed;
}

function updateHook() {
    if (!hook) return;

    // If the hook is moving downward
    if (!hook.retracting && hook.y < hook.targetY) {
        hook.y += 5; // speed of descent

        // Stop at target and start retracting after reaching it
        if (hook.y >= hook.targetY) {
            hook.retracting = true;
        }
    }

    // If the hook is retracting back up
    if (hook.retracting) {
        hook.y -= 5; // speed of retraction

        // When the hook reaches the boat, remove it
        if (hook.y <= boat.y + boat.height) {
            hook = null; // hook disappears (ready for next click)
        }
    }
}

function updateFishing() {
    if (!hook) return;
    fishArray.forEach((fish, i) => {
        if (checkCatch(fish, hook)) {
            score += fish.points;
            scoreDisplay.textContent = score;
            createSplash(fish.x, fish.y);
            fishArray.splice(i, 1);
            const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
            fishArray.push({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height - 250) + 300,
                size: type.size,
                color: type.color,
                points: type.points,
                speed: type.speed,
                dir: Math.random() < 0.5 ? 1 : -1,
                offset: Math.random() * 1000
            });
        }
    });
}

function updateFishMovement(time) {
    fishArray.forEach(fish => {
        // Move fish horizontally
        fish.x += fish.dir * fish.speed;

        // Bobbing motion using sine wave
        fish.y += Math.sin((time + fish.offset) / 200) * 0.5;

        // Randomly change direction
        if (Math.random() < 0.002) fish.dir *= -1;

        // Respawn if off-screen
        if (fish.x < -fish.size || fish.x > canvas.width + fish.size) {
            fish.x = fish.dir === 1 ? -fish.size : canvas.width + fish.size;
            fish.y = Math.random() * (canvas.height - 250) + 300;
        }
    });
}


function updateSplashes() {
    for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.radius += 1.5;   // expand ring
        s.alpha -= 0.03;   // fade out
        if (s.alpha <= 0) splashes.splice(i, 1); // remove finished splash
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;
    timerDisplay.textContent = `Time: ${timeLeft}s`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {

    gamePaused = true; // stop game updates

    // Stop timer
    clearInterval(timerInterval);
    cancelAnimationFrame(animationFrameId);

    // Stop everything visually
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("Time's Up!", canvas.width / 2 - 100, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 20);
}

function resetGame() {
    cancelAnimationFrame(animationFrameId);
    clearInterval(timerInterval);

    gamePaused = false;
    score = 0;
    scoreDisplay.textContent = score;

    fishArray.length = 0;
    spawnFish();

    hook = null;
    boat.x = canvas.width / 2 - boat.width / 2;

    startTimer(); // restart timer
    gameLoop();
}

//Draw Scane
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sky = ctx.createLinearGradient(0, 0, 0, 250);
    sky.addColorStop(0, "#81d4fa");
    sky.addColorStop(1, "#4fc3f7");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, 250);

    const ocean = ctx.createLinearGradient(0, 250, 0, canvas.height);
    ocean.addColorStop(0, "#0288d1");
    ocean.addColorStop(1, "#01579b");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 250, canvas.width, canvas.height - 250);

    drawSun();
    clouds.forEach(c => drawCloud(c.x, c.y));
    drawBoat();
    fishArray.forEach(drawFish);
    drawHook();
    drawSplashes(); // draw on top of water

}

//Main loop
function gameLoop(time = 0) {
    if (gamePaused) return;

    updateClouds();
    updateBoat();
    updateHook();
    updateFishing();
    updateFishMovement(time);
    updateSplashes();
    drawScene();

    animationFrameId = requestAnimationFrame(gameLoop);
}

//Start
spawnFish();
startTimer();
gameLoop();
