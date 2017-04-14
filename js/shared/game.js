(function() {

    var game = {

        paused: true, 

        maps: {},  

        init: function() {

            Events.on('input', Game.onInput);

            Events.emit('game.init');

        }, 

        start: function() {

            Events.emit('game.start');

            Game.loadMap('village');

        },

        update: function(ticks) {

            if (Game.maps.village) {

                Game.maps.village.creatures.forEach(function(creature) {
            
                    if (creature.movementTarget) {

                        creature.movementTarget.loop(ticks);

                    }

                });
            
            }

        }, 

        onInput: function(input) {

            var hero = Game.activeMap.hero;

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
                
                case 'D': 

                    $G.toggleDebug();

                    break;

            }

        }, 

        readMapData: function(input) {

            var inputRows = input.split('\n'), 
                grid = [], i, j, inputCols;

            for (i = 0; i < inputRows.length; i++) {

                inputCols = inputRows[i].split('\t');

                grid.push([]);

                for (j = 0; j < inputCols.length; j++) {

                    grid[i].push({ t: inputCols[j], walkable: inputCols[j] == 'F', x: j * $G.tileSize, y: i * $G.tileSize });

                }

            }

            return grid;

        }, 

        loadMap: function(mapKey) {

            $.get('data/maps/' + mapKey + '.txt', function(data) {

                var grid = Game.readMapData(data), 
                    map = {
                        name: 'The Village', 
                        spawnPoints: [
                            {
                                x: 32, 
                                y: 1152, 
                                spawns: 'betaVendorNpc'
                            },
                            {
                                x: 32, 
                                y: 992, 
                                spawns: 'hero'
                            }
                        ], 
                        creatures: [], 
                        grid: grid, 
                        rows: grid.length, 
                        cols: grid[0].length, 
                        tile: function(x, y) {
                            
                            return (this.grid[Math.floor(x / $G.tileSize)] || [])[Math.floor(y / $G.tileSize)] || { walkable: false };

                        }
                    };

                map.spawnPoints.forEach(function(i) {

                    map.creatures = [].concat(map.creatures, CreatureFactory.create(i));

                });

                map.creatures.forEach(function(creature) { 

                    creature.map = map;

                });

                Game.hero = map.hero = map.creatures.filter(function(i) { return i.name == 'Hero'; }).shift();
                map.hero.moved = true;

                Game.maps[mapKey] = map;
                Game.activeMap = map;

                Game.paused = false;

                UI.renderer.updateMap(map);

                Events.emit('map.loaded', map);

            });

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = game;

    } else {

        window.Game = game;

    }

})();