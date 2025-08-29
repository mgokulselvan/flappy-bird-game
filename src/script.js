//calculating the height and width which maintain the aspect ratio and fit the browser window
const scale=window.innerHeight/512;
const height=Math.floor(scale*512);
const width=Math.floor(scale*288);
let nexttickReference;
let gameHeight=height-(112*scale);

const segments=14;
const segmentHeight=gameHeight/segments;
let pipeHelper=0;//utility which helps to create pipes periodically
let pipePos=[];
const toppipe=new Image();
toppipe.src="../assets/sprites/top-pipe-green.png";
const botpipe=new Image();
botpipe.src="../assets/sprites/bottom-pipe-green.png";
botpipe.style.transform="rotate(180deg)";
const pipeHeight=320*scale;
const pipeWidth=52*scale;

//Initial game Conditions
let running=false;
let started=false;
let playerOut=false;
let score=0;

//all bird sprites
let unflapBird=new Image();
let midflapBird=new Image();
let downflapBird=new Image();
unflapBird.src="../assets/sprites/yellowbird-upflap.png";
midflapBird.src="../assets/sprites/yellowbird-midflap.png";
downflapBird.src="../assets/sprites/yellowbird-downflap.png";
//bird dimensions scaled to the current window size in proportion
const birdWidth=34*scale;
const birdHeight=24*scale;

//bird X and Y coordinates
let birdX=width/2-birdWidth/2;//Required to check if player scored and to check for collision
let birdY=height/2-birdWidth/2-300;

//initial bird velocity, (velocity is only in y-axis)
let birdVel=0;

//utility which tells what bird sprite to use based on how many frames are over
let birdAnimationCount=0;


//All numbers to print score
const zero=new Image();
zero.src="../assets/sprites/0.png";
const one=new Image();
one.src="../assets/sprites/1.png";
const two=new Image();
two.src="../assets/sprites/2.png";
const three=new Image();
three.src="../assets/sprites/3.png";
const four=new Image();
four.src="../assets/sprites/4.png";
const five=new Image();
five.src="../assets/sprites/5.png";
const six=new Image();
six.src="../assets/sprites/6.png";
const seven=new Image();
seven.src="../assets/sprites/7.png";
const eight=new Image();
eight.src="../assets/sprites/8.png";
const nine=new Image();
nine.src="../assets/sprites/9.png";
const numImg=[zero,one,two,three,four,five,six,seven,eight,nine];

//importing background image
let bg = new Image();
bg.src = "../assets/sprites/background-day.png";

//importing the base image
let base = new Image();
base.src = "../assets/sprites/base.png";

let scoreSound=new Audio();
scoreSound.src="../assets/audio/point.ogg";
// scoreSound.preload="auto";//this hints the browser that it can start loading this as soon as possible, 
scoreSound.load();//this forces the browser to load it

let deathSound=new Audio();
deathSound.src="../assets/audio/die.ogg"
// deathSound.preload="auto";
deathSound.load();

let hitSound=new Audio();
hitSound.src="../assets/audio/hit.ogg"
// hitSound.preload="auto";
hitSound.load();

//accessing the gameBoard canvas
let gameBoard=document.getElementById("gameBoard");
gameBoard.setAttribute('height',height);
gameBoard.setAttribute('width',width);
// gameBoard.style.width=`${width}px`;
// gameBoard.style.height=`${height}px`;

let ctx=gameBoard.getContext("2d");

//List to display previous scores
const scoreBoard=document.querySelector("#scoreList");

let loadedCheck;//Reference for setinterval which checks if all images have loaded


//when player runs the game by clicking
function beginningClick(){

    //removing all pipes and resetting bird coordinates
    pipePos = [];
    birdX = width / 2 - birdWidth / 2;
    birdY = height / 2 - birdWidth / 2-300;

    clearBoard();
    requestAnimationFrame(gameStart);

    //removing eventListener to avoid unintended resets
    window.removeEventListener('click', beginningClick);
}

//is run when everything for game is setup
function Startup(){

    clearInterval(loadedCheck);
    if (!started) {
        let startScreen = new Image();
        startScreen.src = "../assets/sprites/startmenu.png";
        let imgWidth = 184 * scale;
        let imgHeight = 267 * scale;
        drawBoard();
        startScreen.onload = () => {
            ctx.drawImage(startScreen, width / 2 - imgWidth / 2, height / 2 - imgHeight / 2, imgWidth, imgHeight);
        }

        //To Start the game when first clicked
        window.addEventListener('click', beginningClick);
    }
}

function drawBoard(){//not used *edit*-used


    ctx.drawImage(bg, 0, 0, width, height);


}

function drawBase(){

    const basewidth = 336 * scale;
    const baseheight = 112 * scale;
    ctx.drawImage(base, 0, height - baseheight, basewidth, baseheight);

}

function clearBoard(){//clear board after each frame to draw all the components again

    ctx.clearRect(0,0,width,height);
}

function changeBird(){//to periodically change what bird sprite is displayed, to animate the bird flying 
    
    birdAnimationCount++;
    if(birdAnimationCount>=60){
        birdAnimationCount=0;
    }
}

function drawBird(){

    switch(Math.floor(birdAnimationCount/20)){
        case 0:
            ctx.drawImage(unflapBird, birdX, birdY, birdWidth*1.2, birdHeight*1.2);
            break;
        case 1:
            ctx.drawImage(midflapBird, birdX, birdY, birdWidth*1.2, birdHeight*1.2);
            break;
        case 2:
            ctx.drawImage(downflapBird, birdX, birdY, birdWidth*1.2, birdHeight*1.2);
            break;
    }
}

function moveBird(){
    birdY+=birdVel;//bird only moves in y-axis
}

function changeVel(source="gametick"){
    if(birdVel>-75 && source==="keydown"){//space key functionality
        //not using same condition to give more velocity for better experience
        //html canvas, the co-ordinates for top-left corner is (0,0) hence positive y is downward and -ve y is upward
        if(birdVel>0){//if bird is moving down give the bird more push upwards 
        birdVel-=(birdVel+10);
        }else{
            birdVel-=10;
        }
    }else if(birdVel<25 && source==="gametick"){//to simulate gravity(when player used space key)
        birdVel+=1;
    }
}

function makePipe(){

    pipeHelper++;
    if(pipeHelper==70){//decides how frequent the pipes are generated
        
        let topPipeSegment=Math.ceil(Math.random()*(segments-5));//gives a random integer from 1-(segments-6) (segments-6)included
        let topPipe=segmentHeight*topPipeSegment-pipeHeight;
        let bottomPipe=segmentHeight*(topPipeSegment+4);//only 5 segment gap between pipes, hence (segments-6) option for topPipeSegment ,to ensure atleast 1 segment in the bottom has a pipe 
        pipePos.push({topY:topPipe,bottomY:bottomPipe,xCoords:width})

        pipeHelper=0;
    }
    
}

function drawPipe(){

    pipePos.forEach((pipe)=>{
            ctx.drawImage(toppipe,pipe.xCoords,pipe.topY,pipeWidth,pipeHeight);
            ctx.drawImage(botpipe,pipe.xCoords,pipe.bottomY,pipeWidth,pipeHeight);
    })
}

function movePipe(){
    
    pipePos.forEach((pipe)=>{//every tick move the pipes closer to the bird
    pipe.xCoords-=7;//changes in this will also affect the change in how to calculate if player has scored
    })
}

function erasePipe(){

    pipePos=pipePos.filter((pipe)=>{
        return pipe.xCoords+pipeWidth>0;//erase pipe if the right corner of the pipe is outside the canvas
    })
}

function checkCollision(){
    pipePos.forEach((pipe)=>{
        
        let topY=pipe.topY;
        let botY=pipe.bottomY;
        let X=pipe.xCoords;
        
        //pipe collision
        if((birdX>X && birdX<(X+pipeWidth))||((birdX+birdWidth)>X && (birdX+birdWidth)<(X+pipeWidth))){//check if bird is within the region of pipe
            
            if(birdY<(topY+pipeHeight)||(birdY+birdHeight)>botY){
                hitSound.play();
                running=false; 
                playerOut=true;
            } 
        }

        //bird goes out of the canvas
        if(birdY<0||(birdY+birdHeight)>gameHeight){
            deathSound.play();
            running=false;
            playerOut=true;
        }
    })
}

function updateScore(){
    
    pipePos.forEach((pipe)=>{
        //player score is increased whenever center of bird and the pipes coinside
        let birdCenter= birdX + (birdWidth / 2);
        let pipeCenter=pipe.xCoords+(pipeWidth/2);
        if(Math.abs(pipeCenter-birdCenter)<=3){//the number changes according to how fast the pipes move
            scoreSound.play();
            score++;
        }

    })
}

function drawScore(){

    let scoreCpy=score;
    //to ensure the score is displayed in the middle even if it has multiple digits
    let scoreDigits=Math.floor(Math.log10(score))+1;
    let imgWidth=24*scale;
    let imgHeight=36*scale;
    let gameBoardCenter=gameBoard.width/2;
    let startPoint=gameBoardCenter-(imgWidth*scoreDigits/2);
    for(let i=scoreDigits-1;i>=0;i--){
        try {
            let rem = scoreCpy % 10;
            ctx.drawImage(numImg[rem], startPoint + (i * imgWidth), 100, imgWidth, imgHeight);
            scoreCpy=Math.floor(scoreCpy/10);
            
        } catch (error) {
           console.log(error); 
        }
    }
}

function gameOverHandle(){
    if(playerOut){
        running=false;
        clearInterval(nexttickReference);
        let gameOver=new Image();
        gameOver.src="../assets/sprites/gameover.png";
        let imgWidth=192*scale;
        let imgHeight=42*scale;
        gameOver.onload = () => {
            ctx.drawImage(gameOver, width / 2 - imgWidth / 2, height / 2 - imgHeight / 2, imgWidth, imgHeight);
        }
        window.onkeydown=null;
        
        //update the score list when game ends
        const scoreitem=document.createElement("li");
        scoreitem.innerText=score;
        scoreBoard.appendChild(scoreitem);

        //for restarting the game
        window.addEventListener('click',beginningClick);
    }
}


//repainting the canvas as soon as possible using requestAnimationFrame
function drawloop(){
    if(running){
    clearBoard();
    drawBoard();//Not required as canvas background is set using CSS,*edit* required due to drawing the base
    drawBird();
    drawPipe();
    drawBase();
    drawScore();
    requestAnimationFrame(drawloop);
    }
}

//runs all the logic
function nexttick(){
    if (running) {
        changeVel();
        changeBird();
        moveBird();
        makePipe();
        erasePipe();
        movePipe();
        checkCollision();
        updateScore();
        gameOverHandle();
    }
}

function gameStart(){

    window.onkeydown=(event)=>{
        if(event.code=="Space"){
            changeVel("keydown");
        }
    }
    
    score=0;
    playerOut=false;
    started=true;
    running=true;
    clearBoard();
    nexttickReference=setInterval(nexttick,25);//change of logic every 25ms
    requestAnimationFrame(drawloop);//repainting the canvas in seperate loop(runs at different intervals)
}



let loaded=0;
const imgs=[zero,one,two,three,four,five,six,seven,eight,nine,unflapBird,midflapBird,downflapBird,toppipe,botpipe,bg,base];
const sounds=[hitSound,scoreSound,deathSound];
for(let item of imgs){
    if(item.complete){//if the image has already loaded
        loaded++;
        continue;
    }else{
        item.onload = function () {//if the image is yet to load
            loaded++;
        }

    }
}
for(let item of sounds){
    if(item.readyState>=4){//checks if the state of the sounds are such that they can be played, or else it waits for them to load in the else block
        loaded++;
    }else{
        item.oncanplaythrough=()=>{
            loaded++;
        }
    }
}

//prepare game only after all the images in global scope have loaded
loadedCheck=setInterval(()=>{

    if (loaded == (imgs.length+sounds.length)) {
        Startup();
    }
},100);