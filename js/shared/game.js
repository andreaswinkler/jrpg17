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

                Game.activeMap.creatures.forEach(function(creature) {
            
                    creature.moved = false;

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
                
                case 'I':

                    UI.toggleCharacterWindow();

                    break;

            }

        }, 

        readMapData: function(input) {

            var inputRows = input.split('\n'), 
                grid = [], i, j, inputCols;

            for (i = 0; i < 20/*inputRows.length*/; i++) {

                inputCols = inputRows[i].split('\t');

                grid.push([]);

                for (j = 0; j < 20/*inputCols.length*/; j++) {

                    grid[i].push({ t: inputCols[j], walkable: inputCols[j] != '', x: j * $G.tileSize, y: i * $G.tileSize });

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
                                x: 1500, 
                                y: 1500, 
                                spawns: 'betaVendorNpc'
                            },
                            {
                                x: 1360, 
                                y: 1360, 
                                spawns: 'hero'
                            }
                        ], 
                        creatures: [], 
                        grid: grid, 
                        rows: grid.length, 
                        cols: grid[0].length, 
                        nullTile: { walkable: false }, 
                        tileIndex: function(x, y) {

                            return Utils.positionToGridIndex(x, y, $G.tileSize);

                        }, 
                        tile: function(x, y) {
                            
                            var tile = Utils.gridElement(this.grid, x, y, $G.tileSize);

                            if (tile == null) {

                                tile = this.nullTile;

                            }

                            return tile;

                        }, 
                        tiles: function(x1, y1, x2, y2) {
                            
                            var startIndex = Utils.positionToGridIndex(x1, y1, $G.tileSize), 
                                endIndex = Utils.positionToGridIndex(x2, y2, $G.tileSize), 
                                startRow = Math.max(0, startIndex.row), 
                                endRow = Math.min(this.grid.length, endIndex.row), 
                                startCol = Math.max(0, startIndex.col), 
                                endCol = Math.min(this.grid[0].length, endIndex.col), 
                                tiles = [], i, j;
                            
                            for (i = startRow; i < endRow; i++) {

                                for (j = startCol; j < endCol; j++) {

                                    tiles.push(this.grid[i][j]);

                                }

                            }

                            return tiles;

                        }
                    };

                map.spawnPoints.forEach(function(i) {

                    map.creatures = [].concat(map.creatures, CreatureFactory.create(i));

                });

                map.creatures.forEach(function(creature) { 

                    creature.map = map;

                });

                Game.hero = map.hero = map.creatures.filter(function(i) { return i.name == 'Hero'; }).shift();

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