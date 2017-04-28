"use strict";

module.exports = function(fs, utils, settings) {

    return {
    
        create: function(key, game) {

            var blueprint = require('./../../data/maps/' + key + '.json'), 
                input = fs.readFileSync('./../data/maps/' + key + '.txt', { encoding: 'utf-8' }), 
                grid = this.readMapData(input), 
                interactables = [], 
                creatures = [];
            
            blueprint.spawnPoints.forEach(function(spawnPoint) {

                var interactable;

                if (spawnPoint.interactable) {

                    interactable = utils.assign({}, settings.interactables[spawnPoint.interactable]);

                    interactable.x = spawnPoint.x;
                    interactable.y = spawnPoint.y;
                    interactable.level = 1;
                    interactable.active = true;

                    interactable.interact = function(creature) {

                        creature.game.createDrop(this, creature);

                        this.active = false;

                    }

                    interactables.push(interactable);

                }      

            });
               
            interactables.forEach(function(interactable) {

                var tile = utils.gridElement(grid, interactable.x, interactable.y, settings.tileSize);

                tile.interactables.push(interactable);

            });

            return {
                name: key, 
                key: key, 
                creatures: creatures, 
                interactables: interactables,
                grid: grid, 
                rows: grid.length, 
                cols: grid[0].length, 
                game: game, 
                changedTS: 0, 
                entrances: {
                    default: {
                        x: 1600, 
                        y: 1600
                    }    
                }, 
                excludeFields: ['game'], 
                pack: function() {

                    return utils.pack(this);

                }, 
                addCreature: function(creature) {

                    this.creatures.push(creature);
                    creature.map = this;
                    creature.game = this.game;

                }, 
                removeCreature: function(creature) {

                    utils.arrayRemove(this.creatures, creature);
                    creature.map = null;

                },
                entrance: function(sourceMap) {
                    
                    return this.entrances[sourceMap] || this.entrances.default;

                },
                createTownPortal: function(hero, destinationMapKey) {

                    this.createPortal({
                        type: 'town', 
                        owner: hero, 
                        x: hero.x, 
                        y: hero.y, 
                        destinationMapKey: destinationMapKey, 
                        destroyAfterUse: true
                    });

                },
                createPortal: function(options) {

                    var portal = options;

                    portal.origin = this;
                    portal.interact = function(creature) {

                        creature.changeMap(this.destinationMapKey);

                        if (this.destoryAfterUse && creature === this.owner) {

                            this.origin.removeInteractable(this);

                        }

                    };
                    
                    this.interactables.push(portal);

                    this.changedTS = +new Date();

                },
                removeInteractable: function(interactable) {

                    utils.arrayRemove(this.interactables, interactable);

                    this.changedTS = +new Date();

                }

            }

        }, 

        readMapData: function(input) {

            var inputRows = input.split('\n'), 
                grid = [], i, j, ir, jr, inputCols;

            // we expand the input data by 2 in both dimensions
            for (i = 0, ir = 0; i < inputRows.length; i++, ir += 2) {

                inputCols = inputRows[i].split('\t');

                grid.push([]);
                grid.push([]);

                for (j = 0, jr = 0; j < inputCols.length; j++, jr += 2) {

                    grid[ir].push({ 
                        t: inputCols[j], 
                        walkable: inputCols[j] != '', 
                        x: jr * settings.tileSize, 
                        y: ir * settings.tileSize,
                        interactables: [] 
                    });
                    grid[ir + 1].push({ 
                        t: inputCols[j], 
                        walkable: inputCols[j] != '', 
                        x: jr * settings.tileSize, 
                        y: (ir + 1) * settings.tileSize,
                        interactables: [] 
                    });
                    grid[ir].push({ 
                        t: inputCols[j], 
                        walkable: inputCols[j] != '', 
                        x: (jr + 1) * settings.tileSize, 
                        y: ir * settings.tileSize,
                        interactables: [] 
                    });
                    grid[ir + 1].push({ 
                        t: inputCols[j], 
                        walkable: inputCols[j] != '', 
                        x: (jr + 1) * settings.tileSize, 
                        y: (ir + 1) * settings.tileSize,
                        interactables: [] 
                    });

                }

            }

            return grid;

        }
    
    }

};