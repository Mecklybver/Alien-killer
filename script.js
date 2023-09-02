const loadingScreen = document.createElement("div");
loadingScreen.innerText = "Loading...";
loadingScreen.style.position = "fixed";
loadingScreen.style.fontSize = "60px";
document.body.appendChild(loadingScreen);
const button = document.createElement("button");
document.body.appendChild(button);

button.innerText = "Start";
const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

let PixelRatio = window.devicePixelRatio;
canvas.width = innerWidth;
canvas.height = innerHeight;
const ctx = canvas.getContext("2d");

class Laser {
  constructor(game, isBossLaser = false) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.height = this.game.height - 50;
    this.animationTime = 0;
    this.oscillation = 0;
    this.oscillationSpeed = 0.1;
    this.isBossLaser = isBossLaser;
  }

  render(ctx) {
    if (this.isBossLaser) {
      this.x =
        this.game.bossArray[0].x +
        this.game.bossArray[0].width * 0.5 -
        this.width * 0.5;
      this.y = this.game.bossArray[0].y + this.game.bossArray[0].height * 0.6;
    } else {
      this.x =
        this.game.player.x + this.game.player.width * 0.5 - this.width * 0.5;
      this.game.player.energy -= this.damage * 0.5;
      if (!this.game.debug) this.game.player.energy -= 0.1;
    }

    const glowIntensity = Math.sin(this.animationTime) * 5;

    this.oscillation =
      Math.sin(this.animationTime * this.oscillationSpeed) * 10;

    ctx.save();

    ctx.shadowColor = `rgba(255, 223, 0, ${0.5 + glowIntensity})`;
    ctx.shadowBlur = 15;
    const oscillatedY = this.y + this.oscillation;

    ctx.fillStyle = "gold";
    if (this.isBossLaser) ctx.fillStyle = "darkred";
    ctx.fillRect(this.x - 2, oscillatedY, this.width + 4, this.height);

    ctx.shadowColor = `rgba(255, 255, 255, ${0.3 + glowIntensity})`;
    ctx.shadowBlur = 8;

    ctx.fillStyle = "white";
    ctx.fillRect(
      this.x + this.width * 0.3,
      oscillatedY,
      this.width * 0.4,
      this.height
    );

    ctx.restore();

    this.animationTime += 0.1;

    if (this.isBossLaser && this.game.spriteUpdate) {
      if (this.game.checkCollision(this.game.player, this)) {
        this.game.player.lives--;
        if (this.game.player.lives < 1) this.game.gameOver = true;
      }
    } else if (this.game.spriteUpdate) {
      this.game.waves.forEach((wave) => {
        wave.enemies.forEach((enemy) => {
          if (this.game.checkCollision(enemy, this)) {
            enemy.hit(this.damage);
          }
        });
      });
      this.game.bossArray.forEach((boss) => {
        if (this.game.checkCollision(boss, this) && boss.y >= 0) {
          boss.hit(this.damage);
        }
      });
    }
  }
}

class SmallLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 5;
    this.damage = 0.5;
  }
  render(ctx) {
    if (this.game.player.energy > 1 && !this.game.player.coolDown) {
      super.render(ctx);
      this.game.player.frameX = 2;
    }
  }
}

class BigLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 15;
    this.damage = 1.2;
  }
  render(ctx) {
    if (this.game.player.energy > 1 && !this.game.player.coolDown) {
      super.render(ctx);
      this.game.player.frameX = 3;
    }
  }
}

class BossLaser extends Laser {
  constructor(game, isBossLaser) {
    super(game, true);
    this.isBossLaser = isBossLaser;
    this.width = 15;
    this.damage = 0.5;
  }
  render(ctx) {
    super.render(ctx);
  }
}

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
    this.width = (65 / PixelRatio) * 1.5;
    this.height = (65 / PixelRatio) * 1.5;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height - this.height * 1.08;
    this.frameX = 0;
    this.maxFrame = 4;
    this.speed = 0;
    this.frameJets = 1;
    this.SpriteJetsWidth = 140;
    this.SpriteJetsHegiht = 130;
    this.touch = 0;
    this.smallLaser = new SmallLaser(this.game);
    this.bigLaser = new BigLaser(this.game);
    this.energy = 10;
    this.maxEnergy = 120;
    this.coolDown = false;
    this.laser = 0;
    this.laserTimer = 0;
    this.activeSmallLaser = 60;
    this.activeBigLaser = 85;
    this.add = false;

    window.addEventListener(
      "touchstart",
      (e) => {
        document.documentElement.requestFullscreen();
        e.preventDefault();

        let identifier;
        [...e.changedTouches].forEach((touch) => {
          identifier = touch.identifier;
        });
        if (identifier == 2) {
          document.exitFullscreen();
        }
        if (identifier == 3) {
          this.game.restart();
        }
        if (identifier == 1 && !this.coolDown) {
          this.shoot();
          if (this.energy > this.activeSmallLaser && !this.game.fired) {
            this.add = true;
            this.laser = 1;
          }
          if (this.energy > this.activeBigLaser && !this.game.fired) {
            this.add = true;
            this.laser = 2;
          }
        }
        if (identifier == 0) {
          this.touch = e.touches[0].pageX;
        }
      },
      { passive: false }
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault();
        if (this.touch > e.touches[0].pageX) {
          this.speed = -(this.touch - e.touches[0].pageX) / 40;
          this.frameJets = 2;
        } else {
          this.speed = (e.touches[0].pageX - this.touch) / 40;
          this.frameJets = 0;
        }
      },
      { passive: false }
    );
    window.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        this.frameJets = 0;
        this.add = false;
        this.laserTimer = 0;
        this.frameX = 0;
      },
      { passive: false }
    );

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
        case "d":
          this.game.debug = !this.game.debug;

          break;
        case "2":
          if (this.game.debug) this.laser = 1;
          break;
        case "3":
          if (this.game.debug) this.laser = 2;
          break;
        case " ":
          if (
            !this.keys.includes(e.key) &&
            !this.game.fired &&
            this.energy < this.activeSmallLaser &&
            !this.coolDown
          ) {
            this.keys.push(e.key);
            this.game.fired = true;
            this.shoot();
            this.laser = 0;
          }
          if (
            !this.keys.includes(e.key) &&
            !this.game.fired &&
            this.energy >= this.activeSmallLaser &&
            this.energy < this.activeBigLaser
          ) {
            this.keys.push(e.key);
            this.laser = 1;
          }
          if (
            !this.keys.includes(e.key) &&
            !this.game.fired &&
            this.energy >= this.activeBigLaser
          ) {
            this.keys.push(e.key);
            this.laser = 2;
          }
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
        case "2":
          if (this.game.debug) this.laser = 0;
          break;
        case "3":
          if (this.game.debug) this.laser = 0;
          break;
        case " ":
          if (this.keys.includes(e.key)) {
            this.keys.splice(this.keys.indexOf(e.key), 1);
            this.game.fired = false;
            this.laser = 0;
            this.laserTimer = 0;
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
    if (this.laser == 1 && this.laserTimer > 80) this.smallLaser.render(ctx);
    if (this.game.debug && this.laser == 1) this.smallLaser.render(ctx);
    if (this.game.debug && this.laser == 2) this.bigLaser.render(ctx);
    if (this.laser == 2 && this.laserTimer > 80) this.bigLaser.render(ctx);
    if (this.laser == 0) this.frameX = 0;
    ctx.save();

    if (this.energy >= this.activeBigLaser) {
      ctx.shadowBlur = this.energy * 0.3;
      ctx.shadowColor = "white";
    } else if (this.energy >= this.activeSmallLaser) {
      ctx.shadowBlur = this.energy * 0.1;
      ctx.shadowColor = "white";
    } else if (this.energy <= 15 && this.game.timer > 50 && !this.coolDown) {
      ctx.shadowBlur = 50;
      ctx.shadowColor = "red";
    } else {
      if(!this.game.lowPerformance) ctx.shadowBlur = this.energy * 0.1;
      if(!this.game.lowPerformance)ctx.shadowColor = "blue";
    }

    if (this.coolDown) {
      ctx.shadowColor = "red";
      ctx.shadowBlur = 40;
    }

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
    ctx.restore();
  }
  update(deltaTime) {
    if (this.lives <= 0) this.game.gameOver = true;
    if (this.energy < this.maxEnergy) this.energy += 0.025;
    if (this.energy >= this.maxEnergy * 0.4 && this.energy < this.maxEnergy)
      this.energy += 0.01;
    if (this.energy >= this.maxEnergy * 0.8 && this.energy < this.maxEnergy)
      this.energy += 0.005;
    if (this.energy < 1) {
      this.frameX = 0;
      this.coolDown = true;
    } else if (this.energy > this.maxEnergy * 0.2) this.coolDown = false;

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

    if (
      (this.keys.includes(" ") && !this.game.fired) ||
      (this.add && !this.game.fired && !this.coolDown)
    ) {
      this.shoot();
      this.game.fired = true;
      if (this.energy > this.activeSmallLaser) this.laserTimer += deltaTime;
    }

    if (this.x <= -this.width * 0.5) this.x = -this.width * 0.5;
    if (this.x >= this.game.width - this.width * 0.5) {
      this.x = this.game.width - this.width * 0.5;
    }

    if (this.game.spriteUpdate && this.game.fired) {
      if (this.frameX === this.maxFrame - 3) {
        this.frameX = 0;
        this.game.fired = false;
      } else {
        this.frameX++;
      }
    }

    this.x += this.speed;
  }
  shoot() {
    this.frameX = 1;
    const projectile = this.game.getProjectiles();
    if (!this.game.debug) this.energy -= 0.3;
    if (projectile && this.laser == 0)
      projectile.start(this.x + this.width * 0.5, this.y - 20);
    if (projectile && this.laser == 1)
      projectile.start(this.x + this.width * 0.5, this.y);
    if (projectile && this.laser == 2)
      projectile.start(this.x + this.width * 0.5, this.y);
  }
}

class Projectile {
  constructor(game, enemy = false, enemyHeight = 0) {
    this.game = game;
    this.width = 4;
    this.height = 20;
    this.x = 0;
    this.y = 0;
    this.speed = 20;
    this.free = true;
    this.enemy = enemy;
    this.enemyHeight = enemyHeight;
  }

  draw(ctx) {
    if (!this.free) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      if (!this.enemy) ctx.fillStyle = "darkorange";
      if (this.enemy) ctx.fillStyle = "red";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.restore();
    }
  }

  update() {
    if (!this.free) {
      if (!this.enemy) this.y -= this.speed;
      if (this.enemy) this.y += this.speed - 8;
      if (this.y < -this.height) this.reset();
    }
  }

  start(x, y) {
    this.x = x - this.width * 0.5;
    this.y = y + this.enemyHeight;
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
    this.spriteSize = 80;
    this.projectiles = [];
    this.numberOfProjectiles = 5;
    this.createProjectiles();
    this.ableToShoot = Math.random() < 0.5 ? true : false;
  }
  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = "red";
    if (this.game.debug)
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.save();

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
    ctx.restore();
  }
  update(x, y) {
    this.x = x + this.positionX;
    this.y = y + this.positionY;

    if (
      this.frameX === 0 &&
      this.ableToShoot &&
      Math.random() > 0.99 &&
      this.game.spriteUpdate
    ) {
      this.shoot();
      console.log("shooting");
    }

    //check collision with projectiles from player
    this.game.projectiles.forEach((projectile) => {
      if (
        !projectile.free &&
        this.game.checkCollision(projectile, this) &&
        this.lives > 0
      ) {
        this.hit(1);
        projectile.reset();
      }
    });
    if (this.lives < 1) {
      if (this.game.spriteUpdate) this.frameX++;
      if (this.frameX > this.maxFrame) {
        this.markedForDeletion = true;
        if (!this.game.gameOver) this.game.score += this.maxLives;
      }
    }
    // check  collision with player
    if (this.game.checkCollision(this, this.game.player) && this.lives > 0) {
      this.lives = 0;
      if (!this.game.gameOver) {
        if (this.game.score > 0) this.game.score--;
        this.game.player.lives--;
        if (this.game.player.lives < 1) this.game.gameOver = true;
      }
    }
    //check collision from enemies' projectile

    this.projectiles.forEach((projectile) => {
      if (
        !projectile.free &&
        this.game.checkCollision(projectile, this.game.player)
      ) {
        this.game.player.lives--;
        projectile.reset();
      }
    });

    //lose condition
    if (this.y + this.height > this.game.height) {
      // this.game.gameOver = true;
      this.game.player.lives--;
      this.markedForDeletion = true;
    }
  }
  hit(damage) {
    this.lives -= damage;
  }

  createProjectiles() {
    for (let i = 0; i < this.numberOfProjectiles; i++) {
      this.projectiles.push(new Projectile(this.game, true, this.height));
    }
  }
  getProjectiles() {
    for (let i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].free) {
        return this.projectiles[i];
      }
    }
    return null;
  }

  shoot() {
    const projectile = this.getProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width * 0.5, this.y - 20);
    }
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
  }
}

class Rhinomorph extends Enemy {
  constructor(game, positionX, positionY) {
    super(game, positionX, positionY);
    this.img = new Image();
    this.img.src = this.img.src = "./img/rhinomorph.png";
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 5;
    this.lives = 4;
    this.maxLives = this.lives;
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
    this.speedX =
      Math.random() > 0.5
        ? (this.game.width / this.game.width) * 1.15
        : -((this.game.width / this.game.width) * 1.15);
    this.speedY = 0;
    this.enemies = [];
    this.markedForDeletion = false;
    this.nextWaveTrigger = false;
    this.create();
  }
  create() {
    for (let y = 0; y < this.game.rows; y++) {
      for (let x = 0; x < this.game.columns; x++) {
        let enemyX = x * this.game.enemySize;
        let enemyY = y * this.game.enemySize;
        if (Math.random() < 0.15) {
          this.enemies.push(new Rhinomorph(this.game, enemyX, enemyY));
        } else {
          this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY));
        }
      }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 3;
    if (this.game.debug)
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
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
    if (this.enemies.length <= 0) this.markedForDeletion = true;

    //bounding box

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    this.enemies.forEach((enemy) => {
      if (enemy.x < minX) minX = enemy.x;
      if (enemy.y < minY) minY = enemy.y;
      if (enemy.x + enemy.width > maxX) maxX = enemy.x + enemy.width;
      if (enemy.y + enemy.height > maxY) maxY = enemy.y + enemy.height;
    });

    // this.x = minX;
    // this.y = minY;
    // this.width = maxX - minX;
    // this.height = maxY - minY;
  }
}

class Background {
  constructor(game) {
    this.game = game;
    this.img = new Image();
    this.img.src = "./img/background.png";
    this.x = 0;
    this.y = 0;
    this.width = this.game.width * PixelRatio;
    this.height = this.game.height * 3 * PixelRatio;
    this.startRadius = 1;
    this.numberOfStars = Math.floor(canvas.width * 0.02);
    this.stars = [];
    this.movingAlpha = 0;
    this.createStars();
  }

  draw(ctx) {
    this.update();
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.img,
      this.x,
      this.y - this.height + 2,
      this.width,
      this.height
    );
    // Draw the stars
    ctx.fillStyle = "white";
    this.stars.forEach((star) => {
      ctx.save();
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
      const alpha = Math.random();
      this.stars.push({ x, y, alpha });
    }
  }
}
class Boss {
  constructor(game, bossLives) {
    this.game = game;
    this.width = 200;
    this.height = 200;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = -this.height;
    this.speedX = Math.random() < 0.5 ? -1 : 1;
    this.speedY = 0;
    this.lives = bossLives;
    this.maxLives = this.lives;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = "./img/boss.png";
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.maxFrame = 11;
    this.shoot = false;
    this.laser = new BossLaser(this.game, true);
    this.energy = 0;
    this.maxEnergy = 10 * this.maxLives * 0.8;
    this.flash = false;
    this.alpha = 1;
  }
  draw(ctx) {
    if (this.shoot && this.alpha >= 1) this.laser.render(ctx);
    ctx.save();
    if(!this.game.lowPerformance)ctx.shadowBlur = this.energy;
    if(!this.game.lowPerformance)ctx.shadowColor = "orange";

    if (this.shoot) ctx.shadowColor = "red";
    if (this.flash && this.lives > 1) {
      ctx.globalAlpha = this.alpha;
      this.shoot = false;
    }
    ctx.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    ctx.restore();
    if (this.lives >= 1) {
      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowOffsetX = 16;
      ctx.shadowOffsetY = 16;
      ctx.shadowColor = "red";
      ctx.shadowBlur = 60;
      ctx.font = "30px Impact";
      ctx.fillStyle = "white";
      ctx.fillText(
        Math.floor(this.lives),
        this.x + this.width * 0.5,
        this.y + 50
      );
      ctx.restore();
    }
  }
  update() {
    const randomize = Math.random();
    if (
      randomize > 0.9 &&
      (this.speedX === 1 || this.speedX === -1) &&
      this.x < this.game.width * 0.55 &&
      this.x > this.game.width * 0.45
    ) {
      this.speedX *= Math.floor(
        this.game.width * 0.08 + Math.random() * this.game.width * 0.05
      );
      this.alpha = 0.1;
      this.flash = true;
    } else if (randomize < 0.9 && this.speedX !== 1 && this.speedX !== -1) {
      this.speedX = this.speedX > 0 ? 1 : -1;
    }
    if (this.alpha !== 1) this.alpha += 0.01;

    this.energy += 0.3;
    if (this.energy >= this.maxEnergy * 0.75 && this.lives >= 1)
      this.shoot = true;
    if (this.energy >= this.maxEnergy || this.lives < 1) {
      this.energy = 0;
      this.shoot = false;
    }
    this.speedY = 0;
    if (this.game.spriteUpdate && this.lives >= 1) this.frameX = 0;
    if (this.y < 0) this.y += 10;
    if (
      (this.x < 0 || this.x > this.game.width - this.width) &&
      (this.game.gameOver || this.lives >= 1)
    ) {
      this.speedX *= -1;
      this.speedY = this.height * 0.5;
    }
    this.x += this.speedX;
    this.y += this.speedY;

    this.game.projectiles.forEach((projectile) => {
      if (
        this.game.checkCollision(this, projectile) &&
        !projectile.free &&
        this.lives >= 1
      ) {
        this.hit(1);
        projectile.reset();
      }
    });

    if (this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
      this.game.gameOver = true;
      this.lives = 0;
    }

    if (this.lives < 1 && this.game.spriteUpdate) {
      this.frameX++;
      if (this.frameX > this.maxFrame) {
        this.markedForDeletion = true;
        this.game.score += this.maxLives;

        this.game.bossLives += 5;
        if (!this.game.gameOver) this.game.newWave();
      }
    }

    if (this.y + this.height > this.game.height) this.game.gameOver = true;
  }
  hit(damage) {
    this.lives -= damage;
    if (this.lives >= 1) this.frameX = 1;
  }
}

class Game {
  constructor(canvas) {
    this.debug = false;
    this.gameStar = false;
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
    this.enemySize = (70 / PixelRatio) * 1.4;
    this.waves = [];
    this.spriteUpdate = false;
    this.spriteTimer = 0;
    this.spriteInterval = 150;
    this.countWave = 1;
    this.gameOver = false;
    this.fired = false;
    this.bossArray = [];
    this.bossLives = 10;
    this.timer = 0;
    this.lowPerformance = false;

  }
  restart() {
    this.player.restart();
    this.projectiles = [];
    this.bossArray = [];
    this.score = 0;
    this.columns = 2;
    this.rows = 2;
    this.countWave = 1;
    this.player.energy = 20;
    this.player.coolDown = false;
    this.waves = [];
    this.bossLives = 10;
    this.waves.push(new Wave(this));
    this.gameOver = false;
    this.createProjectiles();
  }

  draw(ctx) {
    if (this.gameStar) {
      this.player.draw(ctx);
      this.bossArray.forEach((boss) => boss.draw(ctx));
      this.projectiles.forEach((projectile) => projectile.draw(ctx));
      this.waves.forEach((wave) => {
        wave.enemies.forEach((enemy) => {
          enemy.projectiles.forEach((projectile) => projectile.draw(ctx));
          // You can also draw the enemy itself here if needed
          // enemy.draw(ctx);
        });
      });
      // console.log(this.waves[0].enemies[0].projectiles)
      this.waves.forEach((wave) => wave.draw(ctx));
      this.drawStatusText(ctx);
    }
  }
  update(deltaTime) {
    if (this.player.energy < 20) {
      this.timer += 2;
      this.timer %= 100;
    }
    if (this.gameStar) {
      if (this.spriteTimer > this.spriteInterval) {
        this.spriteUpdate = true;
        this.spriteTimer = 0;
      } else {
        this.spriteUpdate = false;
        this.spriteTimer += deltaTime;
      }
      this.bossArray.forEach((boss) => boss.update(deltaTime));
      this.bossArray = this.bossArray.filter((boss) => !boss.markedForDeletion);

      this.player.update(deltaTime);
      this.projectiles.forEach((projectile) => projectile.update(deltaTime));
      this.waves.forEach((wave) => {
        wave.enemies.forEach((enemy) => {
          enemy.projectiles.forEach((projectile) =>
            projectile.update(deltaTime)
          );
          // You can also update the enemy itself here if needed
          // enemy.update();
        });
      });

      this.waves.forEach((wave) => {
        wave.update(deltaTime);
        if (
          wave.enemies.length < 1 &&
          !wave.nextWaveTrigger &&
          !this.gameOver
        ) {
          this.newWave();
          wave.nextWaveTrigger = true;
        }
      });
    }
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
    ctx.save();
    ctx.font = `30px Helvetica`;
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${this.score}`, 20, 40);
    ctx.fillText(`Wave: ${this.countWave}`, 20, 70);

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
    this.player.energy > this.player.activeSmallLaser
      ? (ctx.fillStyle = "orange")
      : (ctx.fillStyle = "gold");
    this.player.energy > this.player.activeBigLaser
      ? (ctx.fillStyle = "purple")
      : null;
    this.player.coolDown ? (ctx.fillStyle = "red") : null;
    if (this.player.energy < 15 && this.timer > 50 && !this.player.coolDown)
      ctx.fillStyle = "red";
    if (this.player.energy < 15 && this.timer <= 50 && !this.player.coolDown)
      ctx.fillStyle = "gold";

    for (let i = 6; i < this.player.energy; i++) {
      ctx.fillRect(10 + 2 * i, 130, 2, 15);
    }
    ctx.restore();

    if (this.gameOver) {
      ctx.save();
      ctx.textAlign = "center";
      let size = (this.width * 0.5) / 8;
      ctx.font = `${38 + size}px Impact`;
      ctx.shadowColor = "black";
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "white";
      ctx.fillText("GAME OVER", this.width * 0.5, this.height * 0.5);

      ctx.font = `${size}px Impact`;
      ctx.fillText("Press R to restart", this.width * 0.5, this.height * 0.6);
      ctx.font = "20px Impact";
      ctx.fillText("or 4-finger-touch", this.width * 0.5, this.height * 0.8);
      ctx.restore();
    }
  }
  newWave() {
    this.countWave++;
    if (this.player.lives < this.player.maxLive) this.player.lives++;
    if (this.countWave % 4 === 0) {
      this.bossArray.push(new Boss(this, this.bossLives));
    } else {
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

    this.waves = this.waves.filter((wave) => !wave.markedForDeletion);
  }
}

addEventListener("load", () => {
  document.body.removeChild(loadingScreen);
  const game = new Game(canvas);
  game.height = window.innerHeight;
  game.width = window.innerWidth;

  let lastTime = 0;
  function animate(stampTime) {
    const deltaTime = stampTime - lastTime;
    lastTime = stampTime;
    if(game.lowPerformance)ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (game.gameStar && !game.lowPerformance) ctx.globalAlpha = 0.2;
    game.bg.draw(ctx);
    ctx.restore();
    requestAnimationFrame(animate);
    game.draw(ctx);
    game.update(deltaTime);
    if (!game.gameStar) {
      ctx.save();

      game.bossArray.forEach((boss) => {
        boss.draw(ctx);
        boss.update(deltaTime);
        boss.y++;
        if (boss.y > canvas.height) {
          boss.y = 0 - boss.height;
          boss.x =
            window.innerWidth * 0.01 + Math.random() * window.innerWidth * 0.99;
          boss.frameY = Math.floor(Math.random() * 4);
        }
      });
      ctx.font = `${canvas.width * 0.06}px Impact`;
      ctx.fillStyle = "red";
      ctx.textAlign = "center";
      ctx.fillText("Alien Killer", canvas.width * 0.5, canvas.height * 0.4);
      ctx.restore;
    }
  }

  for (let i = 0; i < 4; i++) {
    const y = Math.random() * canvas.height - canvas.height * 0.5;
    game.height = innerHeight;
    game.width = innerWidth;
    const x =
      window.innerWidth * 0.01 + Math.random() * window.innerWidth * 0.99;
    game.bossArray.push(new Boss(game));
    game.bossArray[i].x = x;
    game.bossArray[i].y = y;
  }

  animate(0);

  button.addEventListener("click", () => {
    document.body.removeChild(button);
    // document.documentElement.requestFullscreen();
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.gameStar = true;
    game.gameOver = false;
    game.bossArray = [];
    game.restart();
  });
  button.addEventListener("touchstart", () => {
    document.body.removeChild(button);
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.gameStar = true;
    game.gameOver = false;
    game.bossArray = [];
    game.restart();
    game.lowPerformance = true;
  });

  addEventListener("resize", (e) => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    game.width = window.innerWidth;
    game.height = window.innerHeight;
    game.bg.width = window.innerWidth;
    game.bg.height = window.innerHeight;
    game.player.y = window.innerHeight - game.player.height;
    game.player.smallLaser.height = window.innerHeight - game.player.height;
    game.player.bigLaser.height = window.innerHeight - game.player.height;
    game.waves[0].y = 0;

    if (game.bossArray.length > 0) {
      game.bossArray[0].y = 0;
      game.bossArray[0].laser.x =
        game.bossArray[0].x +
        game.bossArray[0].width * 0.5 -
        game.bossArray[0].laser.width * 0.5;
      game.bossArray[0].laser.y =
        game.bossArray[0].y + game.bossArray[0].height;
    }

    game.bg.stars = [];
    game.bg.createStars();
  });
});
