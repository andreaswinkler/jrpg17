"use strict";

module.exports = function(fs, settings) {

    return {
    
        create: function(map) {

            return {
                maps: {}, 
                map: null, 
                clients: [], 

                pack: function() {

                    return {
                        map: this.map
                    };

                }, 

                update: function(ticks) {
                  
                    var updatesList = [], 
                        i, creature, updates;

                    for (i = 0; i < this.map.creatures.length; i++) {
                        
                        creature = this.map.creatures[i];
                        updates = {};

                        if (creature.movementTarget) {
                            
                            creature.movementTarget.update(ticks, this.map);

                            if (creature.moved) {

                                updates.x = creature.x;
                                updates.y = creature.y;

                            }

                        }
                        
                        if (Object.getOwnPropertyNames(updates).length > 0) {

                            updates.id = creature.id;
                            
                            updatesList.push(updates);

                        }
                
                    }

                    if (updatesList.length > 0) {

                        for (i = 0; i < this.clients.length; i++) {

                            this.clients[i].emit('update', updatesList);

                        }

                    }

                }, 

                changeMap: function(key) {

                    if (!this.maps[key]) {

                        this.maps[key] = this.loadMap(key);

                    }

                    this.map = this.maps[key];

                }, 

                loadMap: function(key) {

                    var input = fs.readFileSync('./../data/maps/' + key + '.txt', { encoding: 'utf-8' }),
                        grid = this.readMapData(input);
               
                    return {
                        name: input.name, 
                        creatures: [], 
                        grid: grid, 
                        rows: grid.length, 
                        cols: grid[0].length
                    }

                }, 

                readMapData: function(input) {

                    var inputRows = input.split('\n'), 
                        grid = [], i, j, inputCols;

                    for (i = 0; i < inputRows.length; i++) {

                        inputCols = inputRows[i].split('\t');

                        grid.push([]);

                        for (j = 0; j < inputCols.length; j++) {

                            grid[i].push({ 
                                t: inputCols[j], 
                                walkable: inputCols[j] != '', 
                                x: j * settings.tileSize, 
                                y: i * settings.tileSize 
                            });

                        }

                    }

                    return grid;

                }, 

                onInput: function(data, hero) {

                    switch (data.key) {

                        case 'mouseLeft':

                            hero.moveTo(data.x, data.y);

                            break;

                    }

                }

            }

        }

    }

};