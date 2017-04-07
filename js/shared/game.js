(function() {

    var game = {

        paused: true, 

        maps: {},  

        init: function() {

            Events.on('input', Game.onInput);

            Events.emit('game.init');

        }, 

        start: function() {

            Game.paused = false;

            Events.emit('game.start');

            Game.loadMap('village');

        },

        update: function(ticks) {

            Game.maps.village.creatures.forEach(function(creature) {
         
                if (creature.movementTarget) {

                    creature.movementTarget.loop(ticks);

                }

            });

        }, 

        onInput: function(input) {

            var hero = Game.maps.village.creatures[1];

            switch (input.key) {

                case 'mouseLeft':

                    if (input.shift) {

                        // use primary skill

                    } else {

                        var creature = null; //Game.creatureAt(input.x, input.y);

                        if (creature) {

                            // use primary skill

                        } else {

                            hero.moveTo(input.x, input.y);

                        }

                    }

                    break;

            }

        }, 

        loadMap: function(mapKey) {

            var map = {
                name: 'The Village', 
                spawnPoints: [
                    {
                        x: 500, 
                        y: 500, 
                        spawns: 'betaVendorNpc'
                    },
                    {
                        x: 1000, 
                        y: 400, 
                        spawns: 'hero'
                    }
                ], 
                creatures: []
            };

            map.spawnPoints.forEach(function(i) {

                map.creatures = [].concat(map.creatures, CreatureFactory.create(i));

            });

            Game.maps[mapKey] = map;

            Events.emit('map.loaded', map);

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = game;

    } else {

        window.Game = game;

    }

})();