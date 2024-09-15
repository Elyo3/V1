var canvas;
var gl;
var renderId;

var mouseX;               // Old value of x-coordinate  
var movement = false;     // Do we move the paddle?
var mouseBufferId;
var birdBufferId;
var skotBufferId;
var vPosition;
var speed = Math.random()-1;

let stig = "";
let birdCounter = 0;
var skot = [];
var birds = [];
var numBirds = 5;


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
    
    var emptyBirdVertices = new Float32Array(numBirds * 10);

    mouseBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(mouseVertices), gl.DYNAMIC_DRAW);

    birdBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, birdBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, emptyBirdVertices, gl.DYNAMIC_DRAW); // Tómur buffer fyrir fuglana

    skotBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skotBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW); // Tómur buffer fyrir skot


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
                gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
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

    birds = generateBirds(numBirds);
    render();

    // Skjóta
    function shoot() {
    if (skot.length < 3) {
        skot.push({
            x: mouseVertices[1][0],
            y: -1,
            speed: 0.05
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
            speed: (Math.random() * 0.01 + 0.01) * (Math.random() > 0.3 ? 1 : -1) 
        });
    }
    return newBirds;
}

// Setur inn collision fyrir skot og fuglana
function checkForCollisions() {
    for (let i = 0; i < skot.length; i++) {
        let shot = skot[i];
        for (let j = 0; j < birds.length; j++) {
            let bird = birds[j];

            let shotLeft = shot.x - 0.01;
            let shotRight = shot.x + 0.01;
            let shotBottom = shot.y;
            let shotTop = shot.y + 0.1;

            let birdLeft = bird.x - 0.03;
            let birdRight = bird.x + 0.03;
            let birdBottom = bird.y - 0.01;
            let birdTop = bird.y + 0.05;

            if (
                shotRight > birdLeft &&
                shotLeft < birdRight &&
                shotTop > birdBottom &&
                shotBottom < birdTop
            ) {
                skot.splice(i, 1);
                birds.splice(j, 1);
                console.log("bird hit")

                stig+= " 🐦 ";
                birdCounter++;
                document.getElementById("stig").innerText = `bird: ${stig}`;

                if (birdCounter >= numBirds) {
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

    const message = `Game over! \n \n You shot ${numBirds} birds`;
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

// Teiknar fuglana
function drawBird() {
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
        bird.x += bird.speed;
        
        if (bird.x > 1.1) bird.x = -1.1;
        if (bird.x < -1.1) bird.x = 1.1;

        var birdVertices = [
            vec2(bird.x - 0.05, bird.y - 0.03),   
            vec2(bird.x - 0.05, bird.y + 0.03), 
            vec2(bird.x + 0.05, bird.y + 0.03),  
            vec2(bird.x + 0.05, bird.y - 0.03)    
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, birdBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, i * 8 * Float32Array.BYTES_PER_ELEMENT, flatten(birdVertices));
    };

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    for (let i = 0; i < birds.length; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i * 4, 4); 
    }
}

//Teiknar byssuna
function drawGun() {
    gl.bindBuffer(gl.ARRAY_BUFFER, mouseBufferId);
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Teiknar skotin
function drawShots() {
    for (let i = 0; i < skot.length; i++) {
        let shot = skot[i];
        shot.y += shot.speed;
        if (shot.y > 1.0) {
            skot.splice(i, 1);
            i--;
            continue;
        }
        
        var skotVertices = [
            vec2(shot.x - 0.005, shot.y ),
            vec2(shot.x - 0.005, shot.y + 0.05),
            vec2(shot.x + 0.005, shot.y + 0.05),
            vec2(shot.x + 0.005, shot.y)
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, skotBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(skotVertices));
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        console.log("bang")
    };
}

// Renderar inn allt
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawGun();
    drawBird();
    drawShots();
    checkForCollisions();
    
    setTimeout(function () {
        renderId = requestAnimationFrame(render);
    }, speed);
}
