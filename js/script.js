// Draw Canva
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const resetBtn = document.getElementById("resetBtn");
const scoreDisplay = document.getElementById("score");

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

//Environment objects
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

canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (mouseY > 250) {
        //hook = { x: boat.x + boat.width / 2, y: boat.y + boat.height, targetY: mouseY };
        hook = { x: mouseX, y: mouseY };
        createSplash(mouseX, mouseY); //splash when hook hits water
    }
});

//Collision
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

//Splash Effect
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
    updateClouds();
    updateBoat();
    updateFishing();
    updateFishMovement(time);
    updateSplashes();
    drawScene();
    requestAnimationFrame(gameLoop);
}

//Start
spawnFish();
gameLoop();
