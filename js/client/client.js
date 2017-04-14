window.$G = {

    version: '0.0.1',

    difficulty: 0, 

    tileSize: 64, 

    scale: 1, 

    allowResize: false, 

    debugMode: false,

    stats: null,  

    init: function(container, options) {

        console.log('G.init v' + this.version);

        window.addEventListener('resize', $G.resize);

        this.options = $.extend({

            }, options);

        $G.stats = new Stats();
        $G.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        $('.debug-perf').append($G.stats.dom);

        CreatureFactory.init()
            .then(function(t) {

                Events.on('user.loaded', $G.startScreen);        
        
                Net.init();

                Inputs.init();

                UI.init(container);

                $G.resize();

                Auth.init();

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

        // show start screen with characters, characterCreator, difficulty selector etc.
        Game.init();
        Game.start();

        $G.GameLoop.loop();

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

                if (!Game.paused) {

                    Game.update($G.GameLoop.delta);

                    UI.renderer.update(Game.activeMap);
                    UI.minimap.update();

                    $G.GameLoop.lastTime = $G.GameLoop.currentTime - ($G.GameLoop.delta % $G.GameLoop.interval);
                
                } 

                $G.stats.end();

            }

            window.requestAnimationFrame($G.GameLoop.loop);

        }

    }

}