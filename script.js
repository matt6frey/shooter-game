window.addEventListener('load', () => {
    const canvas = document.querySelector('#game')
    const ctx = canvas.getContext('2d')

    canvas.height = 500
    canvas.width = 800

    const nightcall = document.querySelector('#nightcall')
    const kill1 = document.querySelector('#enemy-kill-1')
    const kill2 = document.querySelector('#enemy-kill-2')
    const whalekill = document.querySelector('#whale-kill-2')
    const shoot = document.querySelector('#pew')
    const boom = document.querySelector('#boom')
    const powerup = document.querySelector('#powerup')
    const gameOverTrack = document.querySelector('#gameOverTrack')
    const win = document.querySelector('#win')

    nightcall.volume = 0.35
    boom.volume = 0.25

    const stopTrack = (track, delay) => {
        setTimeout(() => {
            track.pause()
        }, delay)
    }

    class InputHandler {
        constructor(game) {
            this.game = game
            window.addEventListener('keydown', e => {
                if (
                    (e.key === 'ArrowUp' ||
                    e.key === 'ArrowDown') && 
                    this.game.keys.indexOf(e.key) === -1
                ) {
                    this.game.keys.push(e.key)
                } else if (e.key === ' ') {
                    this.game.player.shootTop()
                }
                if (e.key === 'd') {
                    this.game.debug = !this.game.debug
                }
                if (e.key === 'Escape' || e.key === 'p') {
                    this.game.paused = !this.game.paused
                    console.log(`The game is ${this.game.paused ? "paused" : "running"}`)
                }
                if (e.key === 'r') {
                    game = new Game(this.game.width, this.game.height)
                }
            })
            window.addEventListener('keyup', e => {
                const index = this.game.keys.indexOf(e.key)
                if (index > -1) {
                    this.game.keys.splice(index, 1)
                }
            })
        }
    }

    class Player {
        constructor(game) {
            this.game = game
            this.width = 120
            this.height = 190
            this.x = 20
            this.y = 100
            this.speedY = 0
            this.maxSpeed = 2
            this.speed = 1
            this.projectiles = []
            this.markedForDeletion = false

            // image details
            this.image = document.querySelector('#player')
            this.frameX = 0
            this.frameY = 0
            this.maxFrame = 37

            // power up
            this.powerUp = false
            this.powerUpTimer = 0
            this.powerUpLimit = 10000
        }

        update(deltaTime) {
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed
            else this.speedY = 0
            this.y += this.speedY

            // frame loop }
            if (this.frameX < this.maxFrame) {
                this.frameX++
            } else {
                this.frameX = 0
            }

            // projectiles
            this.projectiles.forEach(projectile => {
                projectile.update()
            })

            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)

            // power up
            if (this.powerUp) {
                if (this.powerUpTimer > this.powerUpLimit) {
                    this.powerUpTimer = 0
                    this.powerUp = false
                    this.frameY = 0
                } else {
                    this.powerUpTimer += deltaTime
                    this.frameY = 1
                    this.game.ammo += 0.1
                }
            }
        }

        draw(context) {
            if (this.game.debug) {
                context.strokeRect(
                    this.x, 
                    this.y, 
                    this.width, 
                    this.height
                )
            }
            this.projectiles.forEach(projectile => {
                projectile.draw(context)
            })
            context.drawImage(
                this.image, 
                // source dimensions
                this.frameX * this.width,
                this.frameY * this.height,
                this.width, 
                this.height,
                // regular dimensions
                this.x, 
                this.y, 
                this.width, 
                this.height
            )
        }

        shoot(xOffset, yOffset) {
            if (this.game.ammo > 0 && 
                !this.game.paused && 
                !this.game.gameOver) {
                shoot.currentTime = 0
                shoot.play()
                this.projectiles.push(
                    new Projectile(
                        this.game, 
                        this.x + xOffset, 
                        this.y + yOffset
                    )
                )
                this.game.ammo--
            }
        }

        shootTop() {
            this.shoot(80, 40)
            if (this.powerUp) this.shootBottom()
        }

        shootBottom() {
            this.shoot(80, 175)
        }

        enterPowerUp() {
            this.powerUp = true
            this.powerUpTimer = 0
            if (this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo
        }
    }

    class Explosion {
        constructor(game, x, y) {
            this.game = game 
            this.x = x
            this.y = y
            this.spriteHeight = 200
            this.fps = 15
            this.timer = 0
            this.interval = 1000/this.fps
            this.markedForDeletion = false

            this.frameX = 0
            this.maxFrame = 8
        }

        update(deltaTime) {
            this.x -= this.game.speed
            if (this.timer > this.interval) {
                this.frameX++
                this.timer = 0
            } else {
                this.timer += deltaTime
            }
            if (this.frameX < this.maxFrame) {
                this.markedForDeletion = true
            }
        }

        draw(context) {
            context.drawImage(
                this.image,
                this.frameX * this.spriteWidth,
                0,
                this.spriteWidth, 
                this.spriteHeight,
                this.x, 
                this.y,
                this.width,
                this.height
            )
        }
    }


    class SmokeExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y)
            this.image = document.querySelector('#smokeExplosion')
            this.spriteWidth = 200
            this.width = this.spriteWidth
            this.height = this.spriteHeight
            this.x = x - this.width * 0.5
            this.y = y - this.height * 0.5
        }
    }
    
    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y)
            this.image = document.querySelector('#fireExplosion')
            this.spriteWidth = 64
            this.width = this.spriteWidth
            this.height = this.spriteHeight
            this.x = x - this.width * 0.5
            this.y = y - this.height * 0.5
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game
            this.x = this.game.width
            this.speedX = Math.random() * -1.5 - 0.5
            this.lives = 5
            this.score = 5
            this.markedForDeletion = false
            this.lucky = false
            // Default frames
            this.frameX = 0
            this.frameY = 0
            this.maxFrame = 37
            this.deathTrack = kill1
            this.deathTrackSeconds = 1200

            this.generateId()

        }

        generateId() {
            const alpha = 'abcefghijk0123456789'
            let id = ''

            for (let i = 0; i < 10; i++) {
                const char = Math.floor(Math.random() * alpha.length)
                id += alpha[char]
            }
            this.id = id
        }

        update() {
            this.x += this.speedX - this.game.speed
            if (this.x + this.width < 0) this.markedForDeletion = true

            if (this.frameX < this.maxFrame) {
                this.frameX++
            } else {
                this.frameX = 0
            }
        }

        draw(context) {
            if (this.game.debug) {
                context.strokeStyle = 'red'
                context.strokeRect(
                    this.x,
                    this.y, 
                    this.width, 
                    this.height
                )
                context.font = '25px "Science Gothic", sans-serif'
                context.fillText(`${this.constructor.name.toString()}:${this.id}:${this.lives}`, this.x, this.y)
            }
            context.drawImage(
                this.image, 
                // source dimensions
                this.frameX * this.width,
                this.frameY * this.height,
                this.width, 
                this.height,
                // regular dimensions
                this.x, 
                this.y, 
                this.width, 
                this.height
            )
        }

        setImage(id) {
            this.image = document.querySelector(id)
        }

        yell() {
            this.deathTrack.play()
            stopTrack(this.deathTrack, this.deathTrackSeconds)
        }
    }
    
    class Angler1 extends Enemy {
        constructor(game) {
            super(game)
            this.width = 228
            this.height = 169
            this.y = Math.random() * (this.game.height * 0.95 - this.height)

            this.lives = 3
            this.score = 5

            this.frameX = 0
            this.frameY = Math.floor(Math.random() * 3) 

            this.setImage('#angler1')

        }
    }

    class Angler2 extends Enemy {
        constructor(game) {
            super(game)
            this.width = 213
            this.height = 165
            this.y = Math.random() * (this.game.height * 0.95 - this.height)

            this.lives = 4
            this.score = 7

            this.frameX = 0
            this.frameY = Math.floor(Math.random() * 2)
            
            this.deathTrack = kill2
            this.deathTrackSeconds = 2000

            this.setImage('#angler2')
        }
    }

    class LuckyFish extends Enemy {
        constructor(game) {
            super(game)
            this.width = 99
            this.height = 95
            this.y = Math.random() * (this.game.height * 0.9 - this.height)

            this.lives = 3
            this.score = 15
            this.lucky = true

            this.frameX = 0
            this.frameY = Math.floor(Math.random() * 2) 

            this.setImage('#lucky')

            this.deathTrack = powerup
            this.deathTrackSeconds = 2000
        }
    }

    class HiveWhale extends Enemy {
        constructor(game) {
            super(game)
            this.width = 400
            this.height = 225
            this.y = Math.random() * (this.game.height * 0.9 - this.height)

            this.lives = 5
            this.score = 10
            this.hive = true

            this.frameX = 0
            this.frameY = Math.floor(Math.random() * 2) 

            this.setImage('#hivewhale')

            this.deathTrack = whalekill
            this.deathTrackSeconds = 2000
        }
    }

    class Drone extends Enemy {
        constructor(game, x, y) {
            super(game)
            this.width = 115
            this.height = 95
            this.x = x
            this.y = y

            this.lives = 2
            this.score = 4

            this.frameX = 0
            this.frameY = Math.floor(Math.random() * 2) 

            this.setImage('#drone')

            this.speedX = Math.random() * -4.2 - 0.5

        }
    }
    
    class Game {
        constructor(width, height) {
            this.width = width
            this.height = height
            this.background = new Background(this)
            this.player = new Player(this)
            this.input = new InputHandler(this)
            this.ui = new UI(this)
            this.ammo = 20
            this.maxAmmo = 50
            this.ammoTimer = 0
            this.ammoInterval = 500
            this.enemyTimer = 0
            this.enemyInterval = 1000
            this.keys = []
            this.enemies = []
            this.particles = []
            this.explosions = []
            this.score = 0
            this.time = 0
            this.winningScore = 500
            this.gameOver = false
            this.paused  = false
            this.speed = 0.5

            this.debug = false
        }

        update(deltaTime) {
            if (!this.gameOver && !this.paused) {
                nightcall.play()
                this.background.update()
                this.background.layer4.update() // delay update
                this.player.update(deltaTime)
                if (this.ammoTimer > this.ammoInterval) {
                    if (this.ammo < this.maxAmmo) {
                        this.ammo++
                    }
                    this.ammoTimer = 0
                } else {
                    this.ammoTimer += deltaTime
                }
                this.particles.forEach(part => part.update())
                this.particles.filter(part => !part.markedForDeletion)
                
                this.explosions.forEach(explosion => explosion.update(deltaTime))
                this.explosions.filter(explosion => !explosion.markedForDeletion)
                
                this.enemies.forEach(enemy => {
                    enemy.update()
                    if (this.checkCollision(this.player, enemy)) {
                        enemy.markedForDeletion = true
                        this.player.markedForDeletion = true
                        this.addExplosion(enemy)
                    }
                    this.player.projectiles.forEach(projectile => {
                        if (this.checkCollision(projectile, enemy)) {
                            enemy.lives--
                            projectile.markedForDeletion = true
                            this.addExplosion(enemy)
                            if (enemy.lucky) this.player.enterPowerUp()
                            else this.score-- 
                            
                            this.addParticle(enemy)

                            if (enemy.lives <= 0) {
                                this.killEnemy(enemy)
                            }
                        }
                    })
                })
                this.enemies = this.enemies.filter(
                    enemy => !enemy.markedForDeletion
                )
                if (this.enemyTimer > this.enemyInterval && 
                    !this.gameOver) {
                    this.addEnemy()
                    this.enemyTimer = 0
                } else {
                    this.enemyTimer += deltaTime
                }
                if (this.score > this.winningScore ||
                    this.player.markedForDeletion) {
                    nightcall.pause()
                    if (this.player.markedForDeletion && !this.gameOver) {
                        gameOverTrack.play()
                        stopTrack(gameOverTrack, 11 * 1000)
                    } else if (this.score > this.winningScore && !this.gameOver) {
                        win.play()
                        stopTrack(win, 5 * 1000)
                    }
                    this.gameOver = true
                }
                
                this.time += deltaTime
            } else {
                nightcall.pause()
            }
        }

        draw(context) {
            this.background.draw(context)
            this.player.draw(context)
            this.ui.draw(context)
            this.enemies.forEach(enemy => {
                enemy.draw(context)
            })
            this.particles.forEach(part => part.draw(context))
            this.explosions.forEach(explosion => explosion.draw(context))
            this.background.layer4.draw(context)
        }

        addEnemy() {
            const randomizer = Math.random() * 10
            let enemy = new Angler1(this)
            if (randomizer < 8.0) enemy = new HiveWhale(this) 
            if (randomizer < 6.0) enemy = new Angler2(this) 
            if (randomizer < 1.5) enemy = new LuckyFish(this)
            if (!this.gameOver) this.enemies.push(enemy)
        }
        
        addExplosion(enemy) {
            const randomizer = Math.random()
            const x = enemy.x + enemy.width * 0.5
            const y = enemy.y + enemy.height * 0.5
            let explosion = new FireExplosion(this, x, y)
            if (randomizer < 0.6) explosion = new SmokeExplosion(this, x, y) 
            if (!this.gameOver) this.explosions.push(explosion)
        }

        checkCollision(rect1, rect2) {
            return (
                rect1.x < rect2.x + rect1.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y
            )
        }

        addParticle(enemy) {
            this.particles.push(
                new Particle(
                    this, 
                    enemy.x + enemy.width * 0.5, 
                    enemy.y + enemy.height * 0.5
                )
            )
        }

        particleExplosion(enemy) {
            for(let i = 0; i < 10; i++) {
                this.addParticle(enemy)
            }
            boom.currentTime = 0
            boom.play()
            stopTrack(boom, 600)
        }

        killEnemy(enemy) {
            if (enemy.hive) {
                for(let i = 0; i < 5; i++) {
                    this.enemies.push(new Drone(
                        this, 
                        enemy.x + Math.random() * enemy.width, 
                        enemy.y + Math.random() * enemy.height
                    ))
                }
            }
            this.particleExplosion(enemy)

            enemy.markedForDeletion = true
            if (!this.gameOver) {
                this.score += enemy.score
            }
            enemy.yell()
        }
    }

    class Projectile {
        constructor(game, x, y) {
            this.game = game
            this.x = x 
            this.y = y 
            this.width = 10
            this.height = 3
            this.speed = 3
            this.markedForDeletion = false

            this.image = document.querySelector('#projectile')
        }

        update() {
            this.x += this.speed
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true
        }

        draw(context) {
            if (this.game.debug) {
                context.fillStyle = 'yellow'
                context.strokeRect (
                    this.x, 
                    this.y,
                    this.width,
                    this.height
                )
            }
            context.drawImage(this.image, this.x, this.y)
        }
    }
    class Particle {
        constructor(game, x, y) {
            this.game = game
            this.x = x
            this.y = y 

            this.image = document.querySelector('#gears')
            this.frameX = Math.floor(Math.random() * 3)
            this.frameY = Math.floor(Math.random() * 3)

            this.spriteSize = 50
            this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1)
            this.size = this.spriteSize * this.sizeModifier
            this.speedX = Math.random() * 6 - 3
            this.speedY = Math.random() * -15
            this.gravity = 0.5
            this.markedForDeletion = false
            this.angle = 0
            // velocity angle
            this.va = Math.random() * 0.2 + 0.1

            this.bounced = false
            this.bottomBounceBoundary = 100
        }

        update() {
            this.angle += this.va
            this.speedY += this.gravity
            this.x -= this.speedX + this.game.speed
            this.y += this.speedY
            if (
                this.y > this.game.height + this.size ||
                this.x < 0 - this.size
            ) this.markedForDeletion = true

            if (
                this.y > this.game.height - this.bottomBounceBoundary && 
                !this.bounced
            ) {
                this.bounced = true
                this.speedY *= -0.5
            }
        }

        draw(context) {
            context.save()
            context.translate(this.x, this.y)
            context.rotate(this.angle)
            context.drawImage(
                this.image, 
                this.frameX * this.spriteSize, 
                this.frameY * this.spriteSize, 
                this.spriteSize,
                this.spriteSize,
                this.size * -0.5, 
                this.size * -0.5, 
                this.size, 
                this.size
            )
            context.restore()
        }
    }
    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game
            this.image = image
            this.speedModifier = speedModifier
            this.width = 1768
            this.height = 500
            this.x = 0
            this.y = 0
        }

        update() {
            if (this.x <= (-this.width)) this.x = 0 
            this.x = this.x - (this.game.speed * this.speedModifier)
        }

        draw(context) {
            context.drawImage(this.image, this.x, this.y)
            context.drawImage(this.image, this.x + this.width, this.y)
        }
    }
    class Background {
        constructor(game) {
            this.game = game
            this.layers = []
            const bgLayers = [
                {id: 1, addLayer: true, speedMod: 0.2 },
                {id: 2, addLayer: true, speedMod: 0.4 },
                {id: 3, addLayer: true, speedMod: 1 },
                {id: 4, addLayer: false, speedMod: 1.3 }
            ]
            for(const layer of bgLayers) {
                this.addLayer(layer.id, layer.addLayer, layer.speedMod)
            }
        }

        addLayer(id, addLayer, speedMod) {
            const imageProperty = `image${id}`
            this[imageProperty] = document.querySelector(`#layer${id}`)
            const layerProperty = `layer${id}`
            this[layerProperty] = new Layer(this.game, this[imageProperty], speedMod)
            if (addLayer) this.layers.push(this[layerProperty])
        }

        update() {
            this.layers.forEach(layer => layer.update())
        }

        draw(context) {
            this.layers.forEach(layer => layer.draw(context))
        }
    }
    class UI {
        constructor(game) {
            this.game = game
            this.fontSize = 25
            this.fontFamily = '"Science Gothic", sans-serif'
            this.color = 'yellow'
        }

        draw(context) {
            // Ammo
            context.fillStyle = this.color
            if (this.game.player.powerUp) context.fillStyle = 'green'
            for(let i = 0; i < this.game.ammo; i++) {
              context.fillRect(20 + 5 * i, 50, 3, 20)  
            }
            context.fillStyle = this.color
            // Score
            context.font = `${this.fontSize}px ${this.fontFamily}`
            context.fillText(`Score: ${this.game.score}`, 20, 40)
            // Timer
            const formattedTime = (this.game.time * 0.001).toFixed(1)
            context.fillText(`Timer: ${formattedTime}`, 20, 100)
            // Game Over Messages
            if (this.game.gameOver) {
                context.fillStyle = this.color
                context.textAlign= 'center'
                let message1, message2
                if (this.game.score > this.game.winningScore) {
                    message1 = 'You Win!'
                    message2 = 'Well done!'
                } else {
                    message1 = 'You Lose!'
                    message2 = 'Better luck next time!'
                }
                context.font = `${50}px ${this.fontFamily}`
                context.fillText(
                    message1, 
                    this.game.width * 0.5, 
                    this.game.height * 0.5 - 40
                )
                context.font = `${25}px ${this.fontFamily}`
                context.fillText(
                    message2, 
                    this.game.width * 0.5, 
                    this.game.height * 0.5 + 40
                )
            }

            if (this.game.player.powerUp) this.color = 'green'

            context.restore()
        }
    }   
    
    const game = new Game(canvas.width, canvas.height)
    let lastTime = 0
    
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime
        lastTime = timeStamp
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        game.draw(ctx)
        game.update(deltaTime)
        requestAnimationFrame(animate)
    }

    animate(0)
})