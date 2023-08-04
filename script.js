const loadingScreen = document.createElement("div");
loadingScreen.innerText = "Loading...";
loadingScreen.style.position = "fixed";
loadingScreen.style.fontSize = "60px";
document.body.appendChild(loadingScreen);

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
canvas.width = innerWidth;
canvas.height = innerHeight;
const ctx = canvas.getContext("2d");



class Player {
  constructor(game) {
    this.game = game;
    this.keys = [];
    this.lives = 8;
    this.maxLive = 8;
    this.img = new Image();
    this.img.src = "./img/player.png";
    this.img2 = new Image();
    this.img2.src = "./img/player_jets.png";
    this.spriteWidth = 140;
    this.spriteHeight = 120;
    this.width = 65;
    this.height = 65;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height - this.height * 1.08;
    this.frameX = 0;
    this.maxFrame = 4;
    this.timer = 0;
    this.interval = 60;
    this.speed = 0;
    this.frameJets = 1
    this.SpriteJetsWidth = 140
    this.SpriteJetsHegiht = 130
    this.touch = 0

   window.addEventListener("touchstart", (e)=>{
    e.preventDefault();
    document.documentElement.requestFullscreen();
    let identifier
    [...e.changedTouches].forEach(touch =>{
      identifier = touch.identifier
    })
    if(identifier == 2){
      document.exitFullscreen();
    }
    if(identifier == 1){
      this.shoot();
    }
    if(identifier == 0){
      this.touch=e.touches[0].pageX
    }

   },{passive:false});
   window.addEventListener("touchmove", (e)=>{
    e.preventDefault();
    if(this.touch > e.touches[0].pageX){
      this.speed = - (this.touch - e.touches[0].pageX) / 20
    } else{
      this.speed =  (e.touches[0].pageX -this.touch ) / 20
    }



   },{passive:false});
   window.addEventListener("touchend", (e)=>{
    e.preventDefault();


   },{passive:false});


    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          if (!this.keys.includes(e.key)) {
            this.keys.push(e.key);
          }
          break;
        case "ArrowRight":
          if (!this.keys.includes(e.key)) {
            this.keys.push(e.key);
          }
          break;
        case "r":
          if (this.game.gameOver) {
            this.game.restart();
          }
          break;
        case " ":
          if (!this.keys.includes(e.key) && !this.game.fired) {
            this.keys.push(e.key);
            this.game.fired = true; // Set the fired flag only once when spacebar is pressed
            this.shoot(); // Call the shoot method to fire a projectile
          }
          break;
        default:
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowLeft":
          if (this.keys.indexOf(e.key) !== -1) {
            this.keys.splice(this.keys.indexOf(e.key), 1);
          }
          break;
        case "ArrowRight":
          if (this.keys.indexOf(e.key) !== -1) {
            this.keys.splice(this.keys.indexOf(e.key), 1);
          }
          break;
        case " ":
          if (this.keys.includes(e.key)) {
            this.keys.splice(this.keys.indexOf(e.key), 1);
            
          }
          break;
        default:
          break;
      }
    });

    
  }
  restart() {
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height - this.height;
    this.lives = this.maxLive;
  }
  draw(ctx) {
    ctx.drawImage(
      this.img,
      this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
    ctx.drawImage(
      this.img2,
      this.frameJets * this.SpriteJetsWidth,
      0,
      this.SpriteJetsWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  update(deltaTime) {
    if (this.keys.includes("ArrowLeft")) {
      this.speed = -4;
      this.frameJets = 0;
    } else if (this.keys.includes("ArrowRight")) {
      this.speed = 4;
      this.frameJets = 2;
    } else {
      this.speed *= 0.98;
      this.frameJets = 1;
    }
    if (this.keys.includes(" ") && !this.game.fired) {
      this.shoot();
      this.game.fired = true;
    }

    

    if (this.x <= -this.width * 0.5) this.x = -this.width * 0.5;
    if (this.x >= this.game.width - this.width * 0.5) {
      this.x = this.game.width - this.width * 0.5;
    }


    if (this.timer >= this.interval && this.game.fired) {
  if (this.frameX === this.maxFrame - 3) {
    this.frameX = 0; 
    this.game.fired = false;
  } else {
    this.frameX++; 
  }
  this.timer = 0;
} else {
  this.timer += deltaTime;
}


    this.x += this.speed;
  }
  shoot() {
    const projectile = this.game.getProjectiles();
    if (projectile) projectile.start(this.x + this.width * 0.5, this.y - 5);
  }
}

class Projectile {
  constructor(game) {
    this.game = game;
    this.width = 4;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.speed = 20;
    this.free = true;
  }

  draw(ctx) {
    if (!this.free) {
      ctx.fillStyle = "darkorange";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  update() {
    if (!this.free) {
      this.y -= this.speed;
      if (this.y < -this.height) this.reset();
    }
  }

  start(x, y) {
    this.x = x - this.width * 0.5;
    this.y = y;
    this.free = false;
  }

  reset() {
    this.free = true;
  }
}

class Enemy {
  constructor(game, positionX, positionY) {
    this.game = game;
    this.width = this.game.enemySize;
    this.height = this.game.enemySize;
    this.x = 0;
    this.y = 0;
    this.positionX = positionX;
    this.positionY = positionY;
    this.markedForDeletion = false;
    this.spriteSize = 80
  }
  draw(ctx) {
    // ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.img,
      this.frameX * this.spriteSize,
      this.frameY * this.spriteSize,
      this.spriteSize,
      this.spriteSize,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  update(x, y, deltaTime) {
    this.x = x + this.positionX;
    this.y = y + this.positionY;

    //check collision with projectiles
    this.game.projectiles.forEach((projectile) => {
      if (!projectile.free && this.game.checkCollision(projectile, this)) {
        this.hit(1);
        projectile.reset();
      }
    });
    if (this.lives < 1) {
      if (this.timer >= this.interval) {
        this.timer = 0;
        this.frameX++;
        if (this.frameX > this.maxFrame) {
          this.markedForDeletion = true;
          if (!this.game.gameOver) this.game.score += this.maxLives;
        }
      } else {
        this.timer += deltaTime;
      }
    }
    // check  collision with player
    if (this.game.checkCollision(this, this.game.player) && this.lives > 0) {
      this.lives = 0
      if (!this.game.gameOver) {
        if (this.game.score > 0) this.game.score--;
        this.game.player.lives--;
        if (this.game.player.lives < 1) this.game.gameOver = true;
      }
    }

    //lose condition
    if (this.y + this.height > this.game.height) {
      this.game.gameOver = true;
      this.markedForDeletion = true;
    }
  }
  hit(damage) {
    this.lives -= damage;
  }
}
class Beetlemorph extends Enemy {
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.img = new Image();
    this.img.src = this.img.src = "./img/beetlemorph.png";
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 5;
    this.lives = 1;
    this.maxLives = this.lives;
    this.timer = 0;
    this.interval = 100;
  }

}

class Rhinomorph extends Enemy {
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.img = new Image();
    this.img.src = this.img.src = "./img/rhinomorph.png";
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 2;
    this.lives = 4;
    this.maxLives = this.lives;
    this.timer = 0;
    this.interval = 100;
  }
    hit(damage) {
    this.lives -= damage;
    this.frameX = this.maxLives - Math.floor(this.lives);
  }
}



class Wave {
  constructor(game) {
    this.game = game;
    this.width = this.game.columns * this.game.enemySize;
    this.height = this.game.rows * this.game.enemySize;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = -this.height + this.game.enemySize;
    this.speedX = Math.random() > 0.5 ? 2 : -2;
    this.speedY = 0;
    this.enemies = [];
    this.nextWaveTrigger = false;
    this.create();
  }
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let enemyX = x * this.game.enemySize;
        let enemyY = y * this.game.enemySize;
        if (Math.random() < 0.2){
        this.enemies.push(new Rhinomorph(this.game, enemyX, enemyY))
      } else {
        this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY))
      }
      
      }
    }
  }
  draw(ctx) {
    ctx.strokeStyle = "red";
    // ctx.strokeRect (this.x, this.y, this.width, this.height);
    this.enemies.forEach((enemy) => enemy.draw(ctx));
  }
  update(deltaTime) {
    if (this.y < 0) this.y += 5;
    this.speedY = 0;
    if (this.x < 0 || this.x > this.game.width - this.width) {
      this.speedX *= -1;
      this.speedY = this.game.enemySize;
    }
    this.x += this.speedX;
    this.y += this.speedY;

    this.enemies.forEach((enemy) => enemy.update(this.x, this.y, deltaTime));
    this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
  }
}

class Background {
  constructor(game) {
    this.game = game;
    this.img = new Image();
    this.img.src = "./img/background.png";
    this.x = 0;
    this.y = 0;
    this.width = this.game.width;
    this.height = this.game.height * 3;
    this.startRadius = 1;
    this.numberOfStars = 200;
    this.stars = [];
    this.createStars();
  }

  draw(ctx) {
    this.update();
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    ctx.drawImage(this.img, this.x, this.y - this.height +2, this.width, this.height);

    // Draw the stars
    ctx.fillStyle = "white";
    this.stars.forEach((star) => {
      ctx.save()
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, this.startRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  update() {
    this.y += 0.3;
    if (this.y >= this.height) this.y = 0;
    let movingAlpha = -0.01; 

this.stars.forEach((star) => {
  star.y += 0.3;
  if (star.y > this.game.height) star.y = 0;
  star.alpha += movingAlpha;
  star.alpha = Math.max(0, Math.min(star.alpha, 1));
  if (star.alpha <= 0 || star.alpha >= 1) {
    movingAlpha *= -1;
  }
});







  }
  

  createStars() {
    for (let i = 0; i < this.numberOfStars; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.game.height;
      const alpha = Math.random() 
      this.stars.push({ x, y, alpha });
    }
  }
}



class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.bg = new Background(this);
    this.player = new Player(this);
    this.projectiles = [];
    this.numberOfProjectiles = 10;
    this.createProjectiles();
    this.score = 0;
    this.columns = 2;
    this.rows = 2;
    this.enemySize = 70;
    this.waves = [];
    this.waves.push(new Wave(this));
    this.countWave = 1;
    this.gameOver = false;
    this.fired = false;
  }
  restart() {
    this.player.restart();
    this.projectiles = [];
    this.score = 0;
    this.columns = 2;
    this.rows = 2;
    this.countWave = 1;
    this.waves = [];
    this.waves.push(new Wave(this));
    this.gameOver = false;
    this.createProjectiles();

  }

  draw(ctx) {
    this.bg.draw(ctx);
    this.player.draw(ctx);
    this.projectiles.forEach((projectile) => projectile.draw(ctx));
    this.waves.forEach((wave) => wave.draw(ctx));
    this.drawStatusText(ctx);

  }
  update(deltaTime) {
    this.player.update(deltaTime);
    this.projectiles.forEach((projectile) => projectile.update(deltaTime));
    this.waves.forEach((wave) => {
      wave.update(deltaTime);
      if (wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver) {
        this.newWave();
        this.countWave++;
        wave.nextWaveTrigger = true;
        if (this.player.lives > this.player.maxLive) this.player.lives++;
      }
    });
  }
  createProjectiles() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectiles.push(new Projectile(this));
    }
  }
  getProjectiles() {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].free) return this.projectiles[i];
    }
  }
  checkCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  drawStatusText(ctx) {
    ctx.font = "40px Helvetica";
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${this.score}`, 20, 40);
    ctx.fillText(`Wave: ${this.countWave}`, 20, 80);

    for (let i = 0; i < this.player.lives; i++) {
      ctx.save();
      ctx.fillStyle = "gold";
      ctx.fillRect(20 + 15 * i, 90, 10, 20);
      ctx.restore();
    }
    for (let i = 0; i < this.player.maxLive; i++) {
      ctx.save();
      ctx.strokeStyle = "darkorange";
      ctx.strokeRect(20 + 15 * i, 90, 10, 20);
      ctx.restore();
    }

    if (this.gameOver) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "108px Impact";
      ctx.shadowColor = "black";
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.fillText("GAME OVER", this.width * 0.5, this.height * 0.5);
      ctx.font = "50px Impact";
      ctx.fillText("Press R to restart", this.width * 0.5, this.height * 0.6);
      ctx.restore();
    }
  }
  newWave() {
    if (
      Math.random() < 0.5 &&
      this.columns * this.enemySize < this.width * 0.8
    ) {
      this.columns++;
    } else if (this.rows * this.enemySize < this.height * 0.6) {
      this.rows++;
    }

    this.waves.push(new Wave(this));
  }
}

addEventListener("load", () => {
  document.body.removeChild(loadingScreen);

  const game = new Game(canvas);

  let lastTime = 0;
  function animate(stampTime) {
    const deltaTime = stampTime - lastTime;
    lastTime = stampTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(animate);
    game.draw(ctx);
    game.update(deltaTime);
  }
  animate(0);

  addEventListener("resize", (e) => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    game.bg.width = innerWidth;
    game.bg.height = innerHeight;
    game.player.y = innerHeight - game.player.height;
  });
});
