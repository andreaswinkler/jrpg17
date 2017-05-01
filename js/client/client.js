window.$G = {

    version: '0.0.1',

    difficulty: 0, 

    scale: 1, 

    allowResize: false, 

    debugMode: false,

    stats: null,  

    player: null, 
    hero: null, 
    game: null, 

    init: function(container, options) {

        console.log('G.init v' + this.version);

        window.addEventListener('resize', $G.resize);

        this.options = $.extend({}, options);

        // stats window
        $G.stats = new Stats();
        $G.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        $('.debug-perf').append($G.stats.dom);
        // end stats window

        Events.on('net.connected', function(data) {

            $G.settings = data.settings;

            $G.player = data.player;
            $G.hero = $G.player.hero;

            $G.expandInventories($G.hero.inventories);

            Events.on('user.loaded', $G.startScreen);

            Net.on('gameCreated', function(data) {

                Events.emit('game.start');

                $G.gameScreen(data.game, data.map);

            });

            Inputs.init();

            UI.init(container);

            $G.resize();

            Auth.init();

        });

        Net.init();

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

    onMapChanged: function(map) {

        // update hero reference
        this.hero = map.creatures.find(function(i) { return i.id == this.hero.id; }, this);
        this.hero.map = map;

        this.map = map;

        this.expandInventories(this.hero.inventories);

        map.npcs.forEach(function(npc) {

            this.expandInventories(npc.inventories);

        }, this);

    }, 

    expandInventories: function(inventories) {

        inventories.forEach(function(inventory) {

            if (inventory.items) {

                inventory.grid = Utils.expandGrid(inventory.items, 'item', inventory.rows, inventory.cols);
            
            } else {

                inventory.grid = Utils.grid(inventory.rows, inventory.cols);

            }

        });

    }, 

    gameScreen: function(game, map) {

        this.game = game;

        this.onMapChanged(map);

        UI.renderer.updateMap(this.hero.map);

        Events.emit('map.loaded', this.map);

        // we send all client inputs to the server
        Events.on('input', Net.input, Net);
        Events.on('input', this.input, this);

        Net.on('update', function(data) {

            var heroUpdated = false, 
                i, j;

            for (i = 0; i < data.length; i++) {

                if (data[i].type == 'map') {

                    if (data[i].map.key == $G.hero.map.key) {

                        $.extend($G.hero.map, data[i].map);

                    }

                } else {

                    for (j = 0; j < $G.map.creatures.length; j++) {

                        creature = $G.map.creatures[j];

                        if (creature.id == data[i].id) {
                            
                            $.extend(creature, data[i]);

                            if (data[i].inventories) {

                                $G.expandInventories(creature.inventories);

                            }

                            if (creature === $G.hero) {

                                heroUpdated = true;

                            }

                        }

                    }
                
                }

            }

            if (heroUpdated) {

                UI.statsBar.update($G.hero);
                UI.inventoryScreen.update($G.hero.inventories[0]);
                UI.equipmentScreen.update($G.hero.equipment);
                UI.handUpdate($G.hero.hand);

            }

        });

        $G.GameLoop.loop();

    }, 

    input: function(data) {
        
        switch (data.key) {

            case 'mouseLeft':

                var npc = Utils.findByHitTest(this.map.npcs, data.x, data.y);

                if (npc) {

                    UI.showVendorWindow(npc);

                }

                break;
            
            case 'I':

                UI.toggleCharacterWindow();

                break;
            
            case 'D':

                $G.toggleDebug();

                break;

        }

    }, 

    update: function(ticks) {

        var i = 0; 
        
        for (i = 0; i < this.map.creatures.length; i++) {
                        
            creature = this.map.creatures[i];

            if (creature.movementTarget) {
                            
                creature.movementTarget.update(ticks, this.map);

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

                    UI.renderer.update($G.map, $G.hero);
                    UI.minimap.update();

                    $G.GameLoop.lastTime = $G.GameLoop.currentTime - ($G.GameLoop.delta % $G.GameLoop.interval);
                
                } 

                $G.stats.end();

            }

            window.requestAnimationFrame($G.GameLoop.loop);

        }

    }

}