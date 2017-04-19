"use strict";

module.exports = function(fs, utils, settings) {

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

                tileIsWalkable: function(map, x, y) {

                    var tile = utils.gridElement(map.grid, x, y, settings.tileSize);
                    
                    return tile && tile.walkable;

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

                }, 

                grabItemFromInventory: function(creature, inventoryId, itemId) {

                    var inventory = creature.inventory(inventoryId), 
                        result = {
                            inventory: inventory, 
                            grabbedItem: null, 
                            success: false
                        };
                    
                    if (inventory) {

                        result.grabbedItem = inventory.grabItem(itemId, creature.hand);

                        if (result.grabbedItem) {

                            creature.hand = result.grabbedItem;

                            result.success = true;

                        }

                    }

                    return result;

                }, 

                addItemToInventory: function(creature, inventoryId, item, row, col) {

                    var inventory = creature.inventory(inventoryId), 
                        result = {
                            inventory: inventory, 
                            success: false
                        }, 
                        placeResult;
                    
                    if (inventory) {

                        if (typeof row != 'undefined') {

                            placeResult = inventory.place(item, row, col);

                            if (placeResult !== false) {

                                result.success = true;

                                if (placeResult) {

                                    creature.hand = placeResult;

                                }

                            }

                        } else {

                            result.success = inventory.add(item);

                        }

                    }

                    return result;

                }, 

                equipItem: function(creature, item, slot, moveToInventory, row, col) {

                    var result = {
                            success: false, 
                            moveToInventorySuccess: false
                        };
                    
                    if (creature.equip(item, slot)) {

                        result.success = true;
                      
                        if (creature.hand != null && moveToInventory) {
                           
                            this.addItemToInventory(creature, creature.inventories[0].id, creature.hand, row, col);

                            result.moveToInventorySuccess = true;

                            creature.hand = null;

                        }

                    }

                    return result;

                }, 

                unequipItem: function(creature, itemId, moveToInventory) {

                    var result = {
                            inventory: null, 
                            success: false, 
                            moveToInventorySuccess: false
                        }, 
                        item = creature.unequip(itemId), 
                        addToInventoryResult;
                    
                    // get the slot we talk about and see if it isn't empty
                    if (item) {

                        creature.hand = item;

                        result.success = true;

                        if (moveToInventory) {

                            addToInventoryResult = this.addItemToInventory(creature, creature.inventories[0].id, creature.hand);

                            if (addToInventoryResult.success) {

                                creature.hand = null;

                                result.inventory = addToInventoryResult.inventory;
                                result.moveToInventorySuccess = true;

                            } 

                        }

                    }

                    return result;

                }              

            }

        }

    }

};