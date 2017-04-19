window.$G = {

    version: '0.0.1',

    difficulty: 0, 

    tileSize: 0, 

    scale: 1, 

    allowResize: false, 

    debugMode: false,

    stats: null,  

    player: null, 
    hero: null, 
    game: null, 

    init: function(container, options) {

        console.log('G.init v' + this.version);

        $.get('data/settings.json', function(t) {

            window.settings = t;

            window.addEventListener('resize', $G.resize);

            this.options = $.extend({}, options);

            $G.stats = new Stats();
            $G.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
            $('.debug-perf').append($G.stats.dom);

            Events.on('net.connected', function(data) {

                $G.tileSize = data.settings.tileSize;
                $G.player = data.player;
                $G.hero = $G.player.hero;

                $G.hero.moveTo = function(x, y) {

                    Components.Movement.moveTo(this, x, y);

                }

                Events.on('user.loaded', $G.startScreen);

                Net.on('gameCreated', function(data) {

                    Events.emit('game.start');

                    $G.gameScreen(data.game);

                });

                Inputs.init();

                UI.init(container);

                $G.resize();

                Auth.init();

            });

            Net.init();

        });

    }, 

    toggleDebug: function() {

        this.debugMode = !this.debugMode;

        if (this.debugMode) {

            $('.debug').show();

        } else {

            $('.debug').hide();

        }

    }, 

    resize: function() {

        if ($G.allowResize) {

            var width = $(window).width(), 
                height = $(window).height(), 
                ratio = width / height, 
                targetRatio = 16 / 9, 
                w, h, left, top;

            // landscape
            if (ratio > targetRatio) {

                w = width;
                h = width / targetRatio, 
                top = (h - height) / 2 * -1;
                left = 0;

            } 
            // portrait
            else {

                h = height;
                w = height * targetRatio, 
                top = 0;
                left = (w - width) / 2 * -1;

            }

            $G.scale = width / w;

            $('.ui-stage canvas').css('width', w + 'px').css('height', h + 'px').css('top', top + 'px').css('left', left + 'px');
        
        }

    }, 

    startScreen: function() {

        console.log('G.startScreen', Auth.user.name);

        Net.emit('createGame');

    }, 

    gameScreen: function(game) {

        this.game = game;
        this.game.hero = this.player.hero;
        this.game.map.hero = this.player.hero;
        this.game.map.creatures.push(this.player.hero);

        UI.renderer.updateMap(this.game.map);
  
        // we send all client inputs to the server
        Events.on('input', Net.input, Net);
        // and use it ourselves
        Events.on('input', this.input, this);

        Net.on('update', function(data) {

            var i, j;

            for (i = 0; i < data.length; i++) {

                for (j = 0; j < $G.game.map.creatures.length; j++) {

                    if ($G.game.map.creatures[j].id == data[i].id) {

                        $.extend($G.game.map.creatures[j], data[i]);

                    }

                }

            }

        });

        Net.on('handUpdate', function(data) {

            $G.hero.hand = data.item;

            UI.handUpdate($G.hero.hand);

        });

        $G.GameLoop.loop();

    }, 

    input: function(data) {
       
        switch (data.key) {

            case 'mouseLeft':

                $G.hero.moveTo(data.x, data.y);

                break;

        }

    }, 

    update: function(ticks) {

        var i = 0; 
        
        for (i = 0; i < this.game.map.creatures.length; i++) {
                        
            creature = this.game.map.creatures[i];

            if (creature.movementTarget) {
                            
                creature.movementTarget.update(ticks, this.game.map);

            }
        
        }

    }, 

    GameLoop: {

        lastTime: +new Date(), 
        currentTime: 0, 
        delta: 0, 
        interval: 1000 / 60, 

        loop: function() {

            $G.GameLoop.currentTime = +new Date();
            $G.GameLoop.delta = ($G.GameLoop.currentTime - $G.GameLoop.lastTime);

            if ($G.GameLoop.delta > $G.GameLoop.interval) {

                $G.stats.begin();

                if (!$G.game.paused) {

                    $G.update($G.GameLoop.delta);

                    UI.renderer.update($G.game.map);
                    UI.minimap.update();

                    $G.GameLoop.lastTime = $G.GameLoop.currentTime - ($G.GameLoop.delta % $G.GameLoop.interval);
                
                } 

                $G.stats.end();

            }

            window.requestAnimationFrame($G.GameLoop.loop);

        }

    }

}