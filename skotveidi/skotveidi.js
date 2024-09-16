var canvas;
var gl;
var renderId;

var mouseX;               // Old value of x-coordinate  
var movement = false;     // Do we move the paddle?
var mouseBuffer;
var birdBuffer;
var shotBuffer;
var vPosition;
var birdSpeed = Math.random()-1;

let birdStig = "";
let birdCounter = 0;
var shot = [];
var birds = [];
var birdNum = 5;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var mouseVertices = [
        vec2(-0.1, -0.95),  // Bottom left
        vec2(0.0, -0.8),   // Top center
        vec2(0.1, -0.95)    // Bottom right 
    ];
    
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    var emptyBirdVertices = new Float32Array(birdNum * 10);

    mouseBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mouseVertices), gl.DYNAMIC_DRAW);

    birdBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, birdBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, emptyBirdVertices, gl.DYNAMIC_DRAW); // Tómur buffer fyrir fuglana

    shotBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, shotBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW); // Tómur buffer fyrir shot


    // Event listeners fyrir mús
    canvas.addEventListener("mousedown", function (e) {
        if (e.button === 0) { 
            movement = true;
            mouseX = e.offsetX;
        }
    });

    canvas.addEventListener("mouseup", function (e) {
        if (e.button === 0) { 
            movement = false;
        }
    });

    canvas.addEventListener("mousemove", function (e) {
        if (movement) {
            var xmove = 2 * (e.offsetX - mouseX) / canvas.width;
            mouseX = e.offsetX;
    
            var newLeft = mouseVertices[0][0] + xmove;
            var newRight = mouseVertices[2][0] + xmove;
    
            if (newLeft >= -1 && newRight <= 1) { 
                for (let i = 0; i < 3; i++) {
                    mouseVertices[i][0] += xmove;
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, mouseBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(mouseVertices));
            }
        }
    });
    
    // Event listener fyrir hægri klikk
    canvas.addEventListener("contextmenu", function (e) {
        e.preventDefault(); 
        shoot();
    });

    // Event listener fyrir bil
    window.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
            shoot();
        }
    });

    birds = generateBirds(birdNum);
    render();

    // Skjóta
    function shoot() {
    if (shot.length < 3) {
        shot.push({
            x: mouseVertices[1][0],
            y: -1,
            birdSpeed: 0.05
        });
        }
    };
}

// Býr til fugla og stillir hraða og staðsetningu
function generateBirds(count) {
    let newBirds = [];
    for (let i = 0; i < count; i++) {
        newBirds.push({
            x: Math.random() * 2 - 1,  
            y: Math.random() * 0.8 + 0.1, 
            birdSpeed: (Math.random() * 0.01 + 0.01) * (Math.random() > 0.3 ? 1 : -1) 
        });
    }
    return newBirds;
}

// Setur inn collision fyrir shot og fuglana
function checkForCollisions() {
    for (let i = 0; i < shot.length; i++) {
        let bullet = shot[i];
        for (let j = 0; j < birds.length; j++) {
            let bird = birds[j];

            let bulletLeft = bullet.x - 0.01;
            let bulletRight = bullet.x + 0.01;
            let bulletBottom = bullet.y;
            let bulletTop = bullet.y + 0.1;

            let birdLeft = bird.x - 0.03;
            let birdRight = bird.x + 0.03;
            let birdBottom = bird.y - 0.01;
            let birdTop = bird.y + 0.05;

            if (
                bulletRight > birdLeft &&
                bulletLeft < birdRight &&
                bulletTop > birdBottom &&
                bulletBottom < birdTop
            ) {
                shot.splice(i, 1);
                birds.splice(j, 1);
                console.log("bird hit")

                birdStig+= " 🐦 ";
                birdCounter++;
                document.getElementById("birdStig").innerText = `bird: ${birdStig}`;

                if (birdCounter >= birdNum) {
                    endGame();
                    return;
                }
                i--; 
                break; 
            }
        }
    }
}

// Sýnir "Game over!" skilaboðið
function endGame() {
    cancelAnimationFrame(renderId);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const message = `Game over! \n \n You shot ${birdNum} birds`;
    console.log(message);

    const gameOver = document.createElement('div');
    gameOver.className = 'gameOver';
    gameOver.innerText = message;
    document.body.appendChild(gameOver);

    const newGame = "New game";
    const button = document.createElement('button');
    button.className = 'newGame';
    button.innerText = newGame;
    document.body.appendChild(button);

    button.addEventListener('click', function() {
        startGame()
    })
}

// Endurhlaðar gluggan
function startGame() {
    location.reload();
}

// Teiknar skotin
function drawBullets() {
    for (let i = 0; i < shot.length; i++) {
        let bullet = shot[i];
        bullet.y += bullet.birdSpeed;
        if (bullet.y > 1.0) {
            shot.splice(i, 1);
            i--;
            continue;
        }
        
        var shotVertices = [
            vec2(bullet.x - 0.005, bullet.y ),
            vec2(bullet.x - 0.005, bullet.y + 0.05),
            vec2(bullet.x + 0.005, bullet.y + 0.05),
            vec2(bullet.x + 0.005, bullet.y)
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, shotBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(shotVertices));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        console.log("bang")
    };
}

//Teiknar byssuna
function drawGun() {
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBuffer);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Teiknar fuglana
function drawBirds() {
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
        bird.x += bird.birdSpeed;
        
        if (bird.x > 1.1) bird.x = -1.1;
        if (bird.x < -1.1) bird.x = 1.1;

        var birdVertices = [
            vec2(bird.x - 0.05, bird.y - 0.03),   
            vec2(bird.x - 0.05, bird.y + 0.03), 
            vec2(bird.x + 0.05, bird.y + 0.03),  
            vec2(bird.x + 0.05, bird.y - 0.03)    
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, birdBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 8 * Float32Array.BYTES_PER_ELEMENT, flatten(birdVertices));
    };

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < birds.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4); 
    }
}
// Renderar inn allt
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGun();
    drawBirds();
    drawBullets();
    checkForCollisions();
    
    setTimeout(function () {
        renderId = requestAnimationFrame(render);
    }, birdSpeed);
}
