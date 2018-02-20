(function ($) {
  // define variables
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var player, score, stop, ticker;
  var ground = [], enemies = [], environment = [];

  // platform variables
  var platformHeight = canvas.height - platformWidth * 4;
  var platformLength, gapLength;
  var platformWidth = 30;
  var platformBase = 550;  // bottom row of the game
  var platformSpacer = 0;

  /** var platformHeight = canvas.height - platformWidth * 4;
   * Get a random number between range
   * @param {integer}
   * @param {integer}
   */
  function rand(low, high) {
    return Math.floor( Math.random() * (high - low + 1) + low );
  }

  /**
   * Bound a number between range
   * @param {integer} num - Number to bound
   * @param {integer}
   * @param {integer}
   */
  function bound(num, low, high) {
    return Math.max( Math.min(num, high), low);
  }

  /**
   * Asset pre-loader object. Loads all images
   */
  var assetLoader = (function() {
    // images dictionary
    this.imgs        = {
      'bg'            : 'imgs/bg.png',
      'sky'           : 'imgs/sky.png',
      'backdrop'      : 'imgs/backdrop.png',
      //'backdrop2'     : 'imgs/backdrop_ground.png',
      'grey'         : 'imgs/grey.png',
      'avatar_normal' : 'imgs/normal_walk_.png',
      //'lava'          : 'imgs/lava.png',
      'grey2'        : 'imgs/grey2.png',
      'grey3'        : 'imgs/grey3.png',
      'bridge'        : 'imgs/bridge.png',
      'cliff'         : 'imgs/greyCliffRight.png',
      'spikes'        : 'imgs/spikes.png',
      'brick'         : 'imgs/brick0.png',
      'baddie'        : 'imgs/baddie.png'
    };

    //sounds
     this.sounds      = {
      'bg'            : 'sounds/bg.mp3'
    };


    var assetsLoaded = 0;                                // how many assets have been loaded
    var numImgs      = Object.keys(this.imgs).length;    // total number of image assets
    var numSounds    = Object.keys(this.sounds).length;  // total number of sounds
    this.totalAssest = numImgs + numSounds;              // total number of assets
    this.checkAudio  = {};                               // setInterval variable for checking audio loading


    /**
     * Ensure all assets are loaded before using them
     * @param {number} dic  - Dictionary name ('imgs', 'sounds', 'fonts')
     * @param {number} name - Asset name in the dictionary
     */
    function assetLoaded(self, dic, name) {
      assetsLoaded++;
      self[dic][name].status = 'loaded';
      assetProgress(assetsLoaded, self.totalAssest);
      if (assetsLoaded === self.totalAssest) {
        clearInterval(self.checkAudio);
        mainMenu();
      }
    }

    function checkAudioStatus() {
      for (var sound in this.sounds) {
        if (this.sounds.hasOwnProperty(sound) && this.sounds[sound].status === 'loading' && this.sounds[sound].readyState === 4) {
          assetLoaded(this, 'sounds', sound);
        }
      }
    }

    // create asset, set callback for asset loading, set asset source
    var self = this;
    var src  = '';
    for (var img in this.imgs) {
      if (this.imgs.hasOwnProperty(img)) {
        src = this.imgs[img];
        this.imgs[img] = new Image();
        this.imgs[img].status = 'loading';
        this.imgs[img].onload = function() { assetLoaded(self, 'imgs', img); };
        this.imgs[img].src = src;
      }
    }
    for (var sound in this.sounds) {
      if (this.sounds.hasOwnProperty(sound)) {
        src = this.sounds[sound];
        this.sounds[sound] = new Audio();
        this.sounds[sound].status = 'loading';
       // this.sounds[sound].volume = volume;
        this.sounds[sound].src = src;
      }
    }

    var that = this;
    if (numSounds > 0) {
      this.checkAudio = setInterval(function() { checkAudioStatus.call(that); },1000);
    }

    return {
      imgs: this.imgs,
      sounds: this.sounds,
      totalAssest: this.totalAssest
    };
  })();


/*    /**
     * Create assets, set callback for asset loading, set asset source
     
    this.downloadAll = function() {
      var _this = this;
      var src;

      // load images
      for (var img in this.imgs) {
        if (this.imgs.hasOwnProperty(img)) {
          src = this.imgs[img];

          // create a closure for event binding
          (function(_this, img) {
            _this.imgs[img] = new Image();
            _this.imgs[img].status = 'loading';
            _this.imgs[img].name = img;
            _this.imgs[img].onload = function() { assetLoaded.call(_this, 'imgs', img) };
            _this.imgs[img].src = src;
          })(_this, img);
        }
      }
    }

    return {
      imgs: this.imgs,
      totalAssest: this.totalAssest,
      downloadAll: this.downloadAll
    };
  })();*/

  assetLoader.finished = function() 
  {

      startGame();
  };
    
   //startGame();

  /**
   * Creates a Spritesheet
   * @param {string} - Path to the image.
   * @param {number} - Width (in px) of each frame.
   * @param {number} - Height (in px) of each frame.
   */
  function SpriteSheet(path, frameWidth, frameHeight) {
    this.image = new Image();
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // calculate the number of frames in a row after the image loads
    var self = this;
    this.image.onload = function() {
      self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
    };

    this.image.src = path;
  }

  /**
   * Creates an animation from a spritesheet.
   * @param {SpriteSheet} - The spritesheet used to create the animation.
   * @param {number}      - Number of frames to wait for before transitioning the animation.
   * @param {array}       - Range or sequence of frame numbers for the animation.
   * @param {boolean}     - Repeat the animation once completed.
   */
  function Animation(spritesheet, frameSpeed, startFrame, endFrame) {

    var animationSequence = [];  // array holding the order of the animation
    var currentFrame = 0;        // the current frame to draw
    var counter = 0;             // keep track of frame rate

    // start and end range for frames
    for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
      animationSequence.push(frameNumber);

    /**
     * Update the animation
     */
    this.update = function() {

      // update to the next frame if it is time
      if (counter == (frameSpeed - 1))
        currentFrame = (currentFrame + 1) % animationSequence.length;

      // update the counter
      counter = (counter + 1) % frameSpeed;
    };

    /**
     * Draw the current frame
     * @param {integer} x - X position to draw
     * @param {integer} y - Y position to draw
     */
    this.draw = function(x, y) {
      // get the row and col of the frame
      var row = Math.floor(animationSequence[currentFrame] / spritesheet.framesPerRow);
      var col = Math.floor(animationSequence[currentFrame] % spritesheet.framesPerRow);

      ctx.drawImage(
        spritesheet.image,
        col * spritesheet.frameWidth, row * spritesheet.frameHeight,
        spritesheet.frameWidth, spritesheet.frameHeight,
        x, y,
        spritesheet.frameWidth, spritesheet.frameHeight);
    };
  }

  /**
   * Create a parallax background
   */
  var background = (function() {
    var sky   = {};
    var backdrop = {};
    //var backdrop2 = {};

    /**
     * Draw the backgrounds to the screen at different speeds
     */
    this.draw = function() {
      ctx.drawImage(assetLoader.imgs.bg, 0, 0);

      // Pan background
      sky.x -= sky.speed;
      backdrop.x -= backdrop.speed;
      //backdrop2.x -= backdrop2.speed;

      // draw images side by side to loop
      ctx.drawImage(assetLoader.imgs.sky, sky.x, sky.y);
      ctx.drawImage(assetLoader.imgs.sky, sky.x + canvas.width, sky.y);

      ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x, backdrop.y);
      ctx.drawImage(assetLoader.imgs.backdrop, backdrop.x + canvas.width, backdrop.y);

     // ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x, backdrop2.y);
     // ctx.drawImage(assetLoader.imgs.backdrop2, backdrop2.x + canvas.width, backdrop2.y);

         // If the image scrolled off the screen, reset
      if (sky.x + assetLoader.imgs.sky.width <= 0)
        sky.x = 0;
      if (backdrop.x + assetLoader.imgs.backdrop.width <= 0)
        backdrop.x = 0;
     // if (backdrop2.x + assetLoader.imgs.backdrop2.width <= 0)
     //   backdrop2.x = 0;
    };

    /**
     * Reset background to zero
     */
    this.reset = function()  {
      sky.x = 0;
      sky.y = 0;
      sky.speed = 0.2;

      backdrop.x = 0;
      backdrop.y = -80;
      backdrop.speed = 0.4;

      //backdrop2.x = 0;
      //backdrop2.y = 0;
      //backdrop2.speed = 0.6;
      player.speed = 8 ;

    }

    return {
      draw: this.draw,
      reset: this.reset
    };
  })();

  /**
   * A vector for 2d space.
   * @param {integer} x - Center x coordinate.
   * @param {integer} y - Center y coordinate.
   * @param {integer} dx - Change in x.
   * @param {integer} dy - Change in y.
   */
  function Vector(x, y, dx, dy) 
  {
    // position
    this.x = x || 0;
    this.y = y || 0;
    // direction
    this.dx = dx || 0;
    this.dy = dy || 0;
  }

  /**
   * Advance the vectors position by dx,dy
   */
  Vector.prototype.advance = function() 
  {
    this.x += this.dx;
    this.y += this.dy;
  };

  /**
   * Get the minimum distance between two vectors
   * @param {Vector}
   * @return minDist
   */
  Vector.prototype.minDist = function(vec) 
  {
    var minDist = Infinity;
    var max     = Math.max( Math.abs(this.dx), Math.abs(this.dy),
                            Math.abs(vec.dx ), Math.abs(vec.dy ) );
    var slice   = 1 / max;

    var x, y, distSquared;

    // get the middle of each vector
    var vec1 = {}, vec2 = {};
    vec1.x = this.x + this.width/2;
    vec1.y = this.y + this.height/2;
    vec2.x = vec.x + vec.width/2;
    vec2.y = vec.y + vec.height/2;
    for (var percent = 0; percent < 1; percent += slice) {
      x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
      y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
      distSquared = x * x + y * y;

      minDist = Math.min(minDist, distSquared);
    }

    return Math.sqrt(minDist);
  };

  /**
   * The player object
   */
  var player = (function(player) 
  {
    // add properties directly to the player imported object
    player.width     = 64;
    player.height    = 56;
    player.speed     = 8;

    // jumping
    player.gravity   = 1;
    player.dy        = 0;
    player.jumpDy    = -10;
    player.isFalling = false;
    player.isJumping = false;

    // spritesheets
    player.sheet     = new SpriteSheet('imgs/normal_walk_.png', player.width, player.height);
    player.walkAnim  = new Animation(player.sheet, 2.5, 1,7);
    player.jumpAnim  = new Animation(player.sheet, 1, 1, 1);
    player.fallAnim  = new Animation(player.sheet, 1, 1, 1);
    player.anim      = player.walkAnim;

    Vector.call(player, 0, 0, 0, player.dy);

    var jumpCounter = 0;  // how long the jump button can be pressed down

    /**
     * Update the player's position and animation
     */
    player.update = function() {  

/*      var canvasTouchHandler = document.getElementById('canvas') ;
      var mDown = false;
      canvasTouchHandler.onmousedown = function() {mDown = true;}  ;*/

      // jump if not currently jumping or falling
      if ((KEY_STATUS.space||KEY_STATUS.leftClick) && player.dy === 0 && !player.isJumping) {
        player.isJumping = true;
        player.dy = player.jumpDy;
        jumpCounter = 25;
      }

      // jump higher if the space bar is continually pressed
      if ((KEY_STATUS.space||KEY_STATUS.leftClick) && jumpCounter) {
        player.dy = player.jumpDy;
      }

      jumpCounter = Math.max(jumpCounter-1, 0);

      this.advance();

      // add gravity
      if (player.isFalling || player.isJumping) {
        player.dy += player.gravity;
      }

      // change animation if falling
      if (player.dy > 0) {
        player.anim = player.fallAnim;
      }
      // change animation is jumping
      else if (player.dy < 0) {
        player.anim = player.jumpAnim;
      }
      else {
        player.anim = player.walkAnim;
      }

      player.anim.update();
    };

    /**
     * Draw the player at it's current position
     */
    player.draw = function() {
      player.anim.draw(player.x, player.y);
    };

    /**
     * Reset the player's position
     */
    player.reset = function() {
      player.x = 64;
      player.y = 250;
    };

    return player;
  })(Object.create(Vector.prototype));

  /**
   * Sprites are anything drawn to the screen (ground, enemies, etc.)
   * @param {integer} x - Starting x position of the player
   * @param {integer} y - Starting y position of the player
   * @param {string} type - Type of sprite
   */
  function Sprite(x, y, type) 
  {
    this.x      = x;
    this.y      = y;
    this.width  = platformWidth;
    this.height = platformWidth;
    this.type   = type;
    Vector.call(this, x, y, 0, 0);

    /**
     * Update the Sprite's position by the player's speed
     */
    this.update = function() {
      this.dx = -player.speed;
      this.advance();
    };

    /**
     * Draw the sprite at it's current position
     */
    this.draw = function() {
      ctx.save();
      ctx.translate(0.5,0.5);
      //console.log(this.type)

      switch(type)
      {

          case 'grey2': ctx.drawImage(assetLoader.imgs.grey2, this.x, this.y);break;
          case 'grey3': ctx.drawImage(assetLoader.imgs.grey3, this.x, this.y);break;
          case 'grey': ctx.drawImage(assetLoader.imgs.grey, this.x, this.y);break;
          case 'bridge': ctx.drawImage(assetLoader.imgs.bridge, this.x, this.y);break;
          case 'cliff': ctx.drawImage(assetLoader.imgs.cliff, this.x, this.y);break;
          case 'grey': ctx.drawImage(assetLoader.imgs.grey, this.x, this.y);break;
          case 'baddie': ctx.drawImage(assetLoader.imgs.baddie, this.x, this.y);break;
          case 'spikes': ctx.drawImage(assetLoader.imgs.spikes, this.x, this.y);break;
          case 'brick': ctx.drawImage(assetLoader.imgs.brick, this.x, this.y);break;
          case 'bush1': ctx.drawImage(assetLoader.imgs.bush1, this.x, this.y);break;
          case 'bush2': ctx.drawImage(assetLoader.imgs.bush2, this.x, this.y);break;
          default:ctx.drawImage(assetLoader.imgs.grey, this.x, this.y);break;
          //case 'lava': ctx.drawImage(assetLoader.imgs.lava, this.x, this.y);break;
      }
      //ctx.drawImage(assetLoader.imgs.[this.type], this.x, this.y);
      ctx.restore();
    };
  }
  Sprite.prototype = Object.create(Vector.prototype);

  /**
   * Get the type of a platform based on platform height
   * @return Type of platform
   */
  function getType() {
    var type;
    switch (platformHeight) {
      case 0:
      case 1:
        type = Math.random() > 0.5 ? 'grey2' : 'grey3';
        break;
      case 2:
        type = 'grey';
        break;
      case 3:
        type = 'bridge';
        break;
      case 4:
        type = 'brick';
        break;
    }
    if (platformLength === 1 && platformHeight < 3 && rand(0, 3) === 0) {
      type = 'cliff';
    }

    return type;
  }

  /**
   * Update all ground position and draw. Also check for collision against the player.
   */
  function updateGround() {
    // animate ground
    player.isFalling = true;
    for (var i = 0; i < ground.length; i++) {
      ground[i].update();
      ground[i].draw();

      // stop the player from falling when landing on a platform
      var angle;
      if (player.minDist(ground[i]) <= player.height/2 + platformWidth/2 &&
          (angle = Math.atan2(player.y - ground[i].y, player.x - ground[i].x) * 180/Math.PI) > -130 &&
          angle < -50) {
        player.isJumping = false;
        player.isFalling = false;
        player.y = ground[i].y - player.height + 5;
        player.dy = 0;
      }
    }

    // remove ground that have gone off screen
    if (ground[0] && ground[0].x < -platformWidth) {
      ground.splice(0, 1);
    }
  }



  /**
   * Update all environment position and draw.
   */
  function updateEnvironment() {
    // animate environment
    for (var i = 0; i < environment.length; i++) {
      environment[i].update();
      environment[i].draw();
    }

    // remove environment that have gone off screen
    if (environment[0] && environment[0].x < -platformWidth) {
      environment.splice(0, 1);
    }
  }

  /**
   * Update all enemies position and draw. Also check for collision against the player.
   */
  function updateEnemies() {
    // animate enemies
    for (var i = 0; i < enemies.length; i++) {
      enemies[i].update();
      enemies[i].draw();

      // player ran into enemy
      if (player.minDist(enemies[i]) <= 8) {
        gameOver();
      }
    }

    // remove enemies that have gone off screen
    if (enemies[0] && enemies[0].x < -platformWidth) {
      enemies.splice(0, 1);
    }
  }

  /**
   * Update the players position and draw
   */
  function updatePlayer() {
    player.update();
    player.draw();

    // game over
    if (player.y + player.height >= canvas.height) {
      gameOver();
    }
  }

  /**
   * Spawn new sprites off screen
   */
  function spawnSprites() {
    // increase score
    score++;

    // first create a gap
    if (gapLength > 0) {
      gapLength--;
    }
    // then create ground
    else if (platformLength > 0) {
      var type = getType();

      ground.push(new Sprite(
        canvas.width + platformWidth % player.speed,
        platformBase - platformHeight * platformSpacer,
        type
      ));
      platformLength--;

      // add random environment sprites
      spawnEnvironmentSprites();

      // add random enemies
      spawnEnemySprites();
    }
    // start over
    else {
      // increase gap length every speed increase of 4
      gapLength = rand(player.speed - 2, player.speed);
      // only allow a ground to increase by 1
      platformHeight = bound(rand(0, platformHeight + rand(0, 2)), 0, 4);
      platformLength = rand(Math.floor(player.speed/2), player.speed * 4);
    }
  }

  /**
   * Spawn new environment sprites off screen
   */
  function spawnEnvironmentSprites() {
    if (score > 40 && rand(0, 20) === 0 && platformHeight < 3) {
      if (Math.random() > 0.5) {
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'plant'
        ));
      }
      else if (platformLength > 2) {
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'bush1'
        ));
        environment.push(new Sprite(
          canvas.width + platformWidth % player.speed + platformWidth,
          platformBase - platformHeight * platformSpacer - platformWidth,
          'bush2'
        ));
      }
    }
  }

  /**
   * Spawn new enemy sprites off screen
   */
  function spawnEnemySprites() 
  {
    if (score > 100 && Math.random() > 0.96 && enemies.length < 3 && platformLength > 5 &&
        (enemies.length ? canvas.width - enemies[enemies.length-1].x >= platformWidth * 3 ||
         canvas.width - enemies[enemies.length-1].x < platformWidth : true)) {
      enemies.push(new Sprite(
        canvas.width + platformWidth % player.speed,
        platformBase - platformHeight * platformSpacer - platformWidth,
        Math.random() > 0.5 ? 'spikes' : 'baddie'
      ));
    }
  }

  /**
   * Game loop
   */
  function animate() {
    if (!stop) {
      requestAnimFrame( animate );
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      background.draw();

      // update entities
      updateGround();
      //updatelava();
      //updateEnvironment();
      updatePlayer();      
      updateEnemies();

      // draw the score
      ctx.fillText('Score: ' + score + 'm', canvas.width - 140, 30);

      // spawn a new Sprite
      if (ticker % Math.floor(platformWidth / player.speed) === 0) {
        spawnSprites();
      }

      // increase player speed only when player is jumping
      if (ticker > (Math.floor(platformWidth / player.speed) * player.speed * 20) && player.dy !== 0) {
        player.speed = bound(++player.speed, 0, 15);
        player.walkAnim.frameSpeed = Math.floor(platformWidth / player.speed) - 1;

        // reset ticker
        ticker = 0;

        // spawn a platform to fill in gap created by increasing player speed
        if (gapLength === 0) {
          var type = getType();
          ground.push(new Sprite(
            canvas.width + platformWidth % player.speed,
            platformBase - platformHeight * platformSpacer,
            type
          ));
          platformLength--;
        }
      }

      ticker++;
    }
  }


  /**
   * Request Animation Polyfill
   */
  var requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback, element){
              window.setTimeout(callback, 1000 / 60);
            };
  })();
    /**
   * Keep track of the spacebar events
   */
  var KEY_CODES = {    
    32: 'space' ,
    1 : 'leftClick'   

  };
  
  var KEY_STATUS = {};
  
  //Check if something is already assigned to that key code
  for (var code in KEY_CODES) {
    if (KEY_CODES.hasOwnProperty(code)) {
       KEY_STATUS[KEY_CODES[code]] = false;
    }
  }

  document.onkeydown = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    console.log(keyCode);
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  };
  document.onkeyup = function(e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  };

  document.ontouchstart= function(e){
    var keyCode = 1;
    if(KEY_CODES[keyCode]){
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
  }
   document.ontouchend = function(e) {
    var keyCode = 1;
    if (KEY_CODES[keyCode]) {
      e.preventDefault();
      KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
  };

    /**
   * Show asset loading progress
   * @param {integer} progress - Number of assets loaded
   * @param {integer} total - Total number of assets
   */
  function assetProgress(progress, total) {
    var pBar = document.getElementById('progress-bar');
    pBar.value = progress / total;
    document.getElementById('p').innerHTML = Math.round(pBar.value * 100) + "%";
  }

  /**
   * Show the main menu after loading all assets
   */
  function mainMenu() {
    assetLoader.sounds.bg.loop = true;
    $('#progress').hide();
    $('#main').show();
    $('#menu').addClass('main');
  }

  /**
   * Start the game - reset all variables and entities, spawn ground and lava.
   */
  function startGame() {
    document.getElementById('game-over').style.display = 'none';
       player.sheet  = new SpriteSheet('imgs/normal_walk_.png', player.width, player.height);
    player.anim   = new Animation(player.sheet, 15, 0, 2.5);
    ground = [];
    //lava = [];
    environment = [];
    enemies = [];
    player.reset();
    ticker = 0;
    stop = false;
    score = 0;
    platformHeight = canvas.height - platformWidth * 4;
    platformLength = 15;
    gapLength = 0;

    ctx.font = '16px arial, sans-serif';
    ctx.fillStyle = "rgba(205, 241, 23, 0.76)";

    for (var i = 0; i < 30; i++) {
      ground.push(new Sprite(i * (platformWidth-3), platformBase - platformHeight * platformSpacer, 'grass'));
    }

   

    background.reset();

    animate();

    assetLoader.sounds.bg.currentTime = 0;
    assetLoader.sounds.bg.play();
  }

   /**
   * End the game and restart
   */
  function gameOver() {
    stop = true;
    $('#score').html(score);
    $('#game-over').show();
    assetLoader.sounds.bg.pause();
  }

  $('.play').on('click touchstart', function() {
    $('#menu').hide();
    startGame();
  });

  $('.restart').on('click touchstart', function() {
    $('#game-over').hide();
    startGame();
  });
}(jQuery));


