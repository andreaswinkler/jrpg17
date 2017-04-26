"use strict";

module.exports = function(fs, utils, settings) {

    return {
    
        create: function(key) {

            var input = fs.readFileSync('./../data/maps/' + key + '.txt', { encoding: 'utf-8' }),
                grid = this.readMapData(input), 
                interactables = [{
                    x: 650, 
                    y: 650, 
                    asset: 'chest', 
                    width: 50, 
                    height: 50, 
                    level: 1, 
                    treasureClass: 1, 
                    active: true, 
                    interact: function(creature) {

                        creature.game.createDrop(this, creature);

                        this.active = false;

                    }
                }];
               
            interactables.forEach(function(interactable) {

                var tile = utils.gridElement(grid, interactable.x, interactable.y, settings.tileSize);

                tile.interactables.push(interactable);

            });

            return {
                name: input.name, 
                creatures: [], 
                interactables: interactables,
                grid: grid, 
                rows: grid.length, 
                cols: grid[0].length, 
                pack: function() {

                    return utils.pack(this);

                }
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
                        y: i * settings.tileSize,
                        interactables: [] 
                    });

                }

            }

            return grid;

        }
    
    }

};