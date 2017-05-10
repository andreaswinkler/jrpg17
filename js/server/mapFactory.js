"use strict";

module.exports = function(fs, utils, settings, creatureFactory) {

    return {
    
        create: function(key, game) {

            var blueprint = require('./../../data/maps/' + key + '.json'), 
                input = fs.readFileSync('./../data/maps/' + key + '.txt', { encoding: 'utf-8' }), 
                grid = this.readMapData(input), 
                npcs = [], 
                interactables = [], 
                creatures = [], 
                map;
            
            blueprint.spawnPoints.forEach(function(spawnPoint) {

                var interactable, creature, i;

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

                } else if (spawnPoint.creature) {

                    for (i = 0; i < spawnPoint.amount; i++) {

                        creature = creatureFactory.create(spawnPoint.creature, { level: 1 }, game);

                        creature.setPosition(spawnPoint.x + (i * 10), spawnPoint.y + (i * 10));

                        creatures.push(creature);
                    
                        if (creature.type == 'npc') {

                            npcs.push(creature);

                        }

                    }

                } 

            });

            map = {
                name: key, 
                key: key, 
                creatures: [], 
                interactables: [],
                npcs: npcs, 
                grid: grid, 
                rows: grid.length, 
                cols: grid[0].length, 
                game: game, 
                changedTS: 0, 
                entrances: blueprint.entrances, 
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
                        asset: 'townportal', 
                        owner: hero, 
                        x: hero.x, 
                        y: hero.y, 
                        destinationMapKey: destinationMapKey, 
                        destroyAfterUse: true
                    });

                },
                createPortal: function(options) {

                    var portal = options;

                    portal.excludeFields = ['origin'];
                    portal.pack = function() {

                        return utils.pack(this);

                    }

                    portal.origin = this;
                    portal.width = 50;
                    portal.height = 100;
                    portal.originMapKey = this.key;
                    portal.active = true;
                    portal.interact = function(creature) {

                        creature.changeMap(this.destinationMapKey);

                        if (this.destoryAfterUse && creature === this.owner) {

                            this.origin.removeInteractable(this);

                        }

                    };
                    
                    this.addInteractable(portal);

                    this.changedTS = +new Date();

                },
                removeInteractable: function(interactable) {

                    utils.arrayRemove(this.interactables, interactable);

                    this.changedTS = +new Date();

                },
                addInteractable: function(interactable) {

                    var tile = utils.gridElement(this.grid, interactable.x, interactable.y, settings.tileSize);
                    
                    tile.interactables.push(interactable);

                    this.interactables.push(interactable);

                }

            };

            interactables.forEach(function(interactable) {

                map.addInteractable(interactable);

            }, this);

            creatures.forEach(function(creature) {

                map.addCreature(creature);

            }, this);

            blueprint.exits.forEach(function(exit) {

                map.createPortal(exit);

            }, this);

            return map;

        }, 

        createTile: function(type, row, col) {

            return {
                t: type, 
                walkable: type != '', 
                x: col * settings.tileSize, 
                y: row * settings.tileSize, 
                interactables: [], 
                pack: function() {
                    return  utils.pack(this);
                }
            };

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

                    grid[ir].push(this.createTile(inputCols[j], ir, jr));
                    grid[ir + 1].push(this.createTile(inputCols[j], ir + 1, jr));
                    grid[ir].push(this.createTile(inputCols[j], ir, jr + 1));
                    grid[ir + 1].push(this.createTile(inputCols[j], ir + 1, jr + 1));

                }

            }

            return grid;

        }
    
    }

};