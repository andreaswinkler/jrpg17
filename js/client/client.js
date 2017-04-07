window.$G = {

    version: '0.0.1',

    difficulty: 0, 

    init: function(container, options) {

        console.log('G.init v' + this.version);

        this.options = $.extend({

            }, options);

        CreatureFactory.init()
            .then(function(t) {

                Events.on('user.loaded', $G.startScreen);        
        
                Net.init();

                Inputs.init();

                UI.init(container);

                Auth.init();

            });

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
        interval: 1000 / 30, 

        loop: function() {

            window.requestAnimationFrame($G.GameLoop.loop);

            $G.GameLoop.currentTime = +new Date();
            $G.GameLoop.delta = ($G.GameLoop.currentTime - $G.GameLoop.lastTime);

            if ($G.GameLoop.delta > $G.GameLoop.interval) {
                
                Game.update();
                UI.Renderer.render(Game.maps.village);

                $G.GameLoop.lastTime = $G.GameLoop.currentTime - ($G.GameLoop.delta % $G.GameLoop.interval);

            }

        }

    }

}