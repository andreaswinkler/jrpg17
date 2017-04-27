"use strict";

module.exports = function(utils, settings, skills, mapFactory, itemFactory) {

    return {
    
        // games counter, used to determine the game id
        counter: 0, 

        // create a game
        create: function() {

            return {
                
                // calculate the id by increasing the games counter
                id: ++this.counter, 
                
                // map store, all entered maps are added here 
                maps: {}, 

                // maintain the last time someone accessed this game 
                // from the client. at some point the game is destroyed 
                // due to inactivity
                lastActivityTimestamp: +new Date(), 

                // only these properties of the game object are 
                // sent to the client
                packFields: ['id'], 

                // provide a function which converts the game 
                // object when sent to the client
                pack: function() {

                    return utils.pack(this);

                }, 

                // this method is called every frame and recalculates 
                // the game state
                update: function(ticks) {
                  
                    // maintain a list of updates per map
                    var updatesList = {}, 
                        mapKey, map, i, j, creature, input, updates, inputs;

                    // go through all maps and recalculate everything
                    for (mapKey in this.maps) {

                        map = this.maps[mapKey];
                        updatesList[mapKey] = [];

                        for (i = 0; i < map.creatures.length; i++) {
                        
                            creature = map.creatures[i];
                            updates = {};

                            // process all inputs we got since the last loop
                            for (j = creature.inputs.length; j--;) {

                                input = creature.inputs[j];

                                this.processInput(input.key, input.x, input.y, input.shift, input.ctrl, creature, updates);

                                creature.inputs.splice(j, 1);

                            }
                            
                            // handle movement
                            if (creature.movementTarget) {
                                
                                creature.movementTarget.update(ticks);

                                if (creature.moved) {

                                    updates.x = creature.x;
                                    updates.y = creature.y;

                                }

                            }

                            // life per second
                            if (creature.life < creature.maxLife_current) {

                                creature.heal(creature.lifePerSecond_current / 1000 * ticks);

                                updates.life = creature.life;
                            
                            }
                        
                            // mana per second
                            if (creature.mana < creature.maxMana_current) {

                                creature.restoreMana(creature.manaPerSecond_current / 1000 * ticks);

                                updates.mana = updates.mana;
                            
                            }

                            // healthpotion cooldown
                            if (creature.healthpotion) {

                                utils.cooldown(creature.healthpotion, ticks);

                            }
                        
                            // if we have any changes we add this creature to the updates list
                            if (Object.getOwnPropertyNames(updates).length > 0) {

                                updates.id = creature.id;
                                
                                updatesList[mapKey].push(updates);

                            }
                
                        }
                    
                    }

                    return updatesList;

                }, 

                // let a creature change to a different map
                map: function(key) {

                    if (!this.maps[key]) {

                        this.maps[key] = mapFactory.create(key, this);

                    }

                    return this.maps[key];

                }, 

                createDrop: function(source, target) {

                    var drop = itemFactory.createDrop(source), 
                        droppedItems = [],
                        positions, i, key;
                    
                    drop.items.forEach(function(i) {

                        droppedItems.push(i);

                    });

                    if (drop.gold > 0) {

                        droppedItems.push({ isGold: true, amount: drop.gold });

                    }

                    for (i = 0; i < drop.healthGlobes.length; i++) {

                        droppedItems.push({ isHealthGlobe: true });

                    }

                    for (key in drop.essences) {

                        if (drop.essences[key] > 0) {

                            droppedItems.push({ isEssence: true, type: key, amount: drop.essences[key] });

                        }

                    }

                    for (key in drop.mats) {

                        if (drop.mats[key] > 0) {

                            droppedItems.push({ isMat: true, type: key, amount: drop.essences[key] });

                        }

                    }

                    positions = utils.equidistantPositionsOnArchimedeanSpiral(droppedItems.length, 30, source.x, source.y);

                    for (i = 0; i < droppedItems.length; i++) {

                        target.hand = droppedItems[i];
                        target.dropItem(positions[i].x, positions[i].y);

                    }

                }, 

                processInput: function(key, x, y, shift, ctrl, hero, updates) {

                    console.log('input', key, x, y, shift, ctrl);

                    this.lastActivityTimestamp = +new Date();

                    switch (key) {

                        case 'mouseLeft':

                            if (hero.hand != null && utils.tileIsWalkable(hero.map, x, y)) {

                                hero.dropItem(x, y);

                                updates.hand = hero.hand;

                            } else if (shift) {

                                this.useSkill(hero, 'skill0', x, y);

                            } else {

                                if (!this.pickUp(hero, x, y, updates)) {

                                    if (!this.interact(hero, x, y)) {

                                        if (!this.useSkill(hero, 'skill0', x, y)) {

                                            hero.moveTo(x, y);

                                        }

                                    }
                                
                                }

                            }

                            break;
                        
                        case 'mouseRight':

                            this.useSkill(hero, 'skill1', x, y);

                            break;
                        
                        case 'Q':

                            this.useHealthPotion(hero);

                            break;

                    }

                }, 

                interact: function(creature, x, y) {
                    
                    var tile = utils.tile(creature.map, x, y), 
                        interactable = tile.interactables.find(function(interactable) {

                            return interactable.active && utils.hitTest(interactable, x, y);

                        });
                    
                    if (interactable) {

                        interactable.interact(creature);

                        return true;

                    }

                    return false;

                }, 

                // check if we can pick up something from the given position
                pickUp: function(creature, x, y, updates) {

                    // try to find a dropped item on the click position
                    var droppedItem = utils.findByHitTest(creature.droppedItems, x, y), 
                        result;

                    if (droppedItem) {

                        if (droppedItem.item.isGold) {

                            creature.balance += droppedItem.item.amount;

                            updates.balance = creature.balance;

                        } else if (droppedItem.item.isHealthGlobe) {

                            creature.healPercent(20);

                            updates.life = creature.life;

                        } else {

                            creature.hand = droppedItem.item;
                            this.addItemToInventory(creature, creature.inventories[0].id);

                            updates.hand = creature.hand;
                        
                        }

                        // remove the dropped item from the list
                        utils.arrayRemove(creature.droppedItems, droppedItem);

                        updates.inventories = creature.inventories;
                        updates.droppedItems = creature.droppedItems;

                    } 

                    return false;

                }, 

                useSkill: function(creature, slot, x, y) {

                    var skill = creature[slot];

                    if (!creature.scheduledSkill && utils.skillReady(skill)) {

                        return skills.invoke(creature, skill, x, y);

                    }

                    return false;

                }, 

                useHealthPotion: function(creature) {

                    if (creature.healthPotion && !creature.healthPotion.cooldown_current) {

                        creature.healPercent(creature.healthPotion.healPercent);

                        creature.healthPotion.cooldown_current = creature.healthPotion.cooldown * 1000;

                    }

                }, 

                grabItemFromInventory: function(creature, inventoryId, itemId) {

                    var inventory = creature.inventory(inventoryId), 
                        result = {
                            inventory: inventory, 
                            item: null, 
                            success: false, 
                            row: 0, 
                            col: 0
                        }, 
                        grabItemResult;
                    
                    if (inventory) {

                        grabItemResult = inventory.grabItem(itemId, creature.hand);

                        if (grabItemResult.item) {

                            creature.hand = grabItemResult.item;

                            result.success = true;
                            result.item = grabItemResult.item;
                            result.row = grabItemResult.row;
                            result.col = grabItemResult.col;

                        }

                    }

                    return result;

                }, 

                addItemToInventory: function(creature, inventoryId, row, col) {
                
                    var item = creature.hand, 
                        inventory = creature.inventory(inventoryId), 
                        result = {
                            inventory: inventory, 
                            success: false
                        }, 
                        placeResult;
                    
                    if (item && inventory) {
                        
                        if (typeof row != 'undefined') {
                            
                            placeResult = inventory.place(item, row, col);

                            if (placeResult !== false) {

                                result.success = true;

                                if (placeResult !== true) {

                                    creature.hand = placeResult;

                                } else {

                                    creature.hand = null;

                                }

                            }

                        } else {
                            
                            result.success = inventory.add(item);

                            if (result.success) {

                                creature.hand = null;

                            }

                        }

                    }

                    return result;

                }, 

                equipItem: function(creature, item, slot, moveToInventory, row, col) {

                    var result = {
                            success: false, 
                            moveToInventorySuccess: false, 
                            inventory: creature.inventories[0]
                        };
                    
                    if (creature.equip(item, slot)) {

                        result.success = true;
                      
                        if (creature.hand != null && moveToInventory) {
                           
                            this.addItemToInventory(creature, creature.inventories[0].id, row, col);

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

                            addToInventoryResult = this.addItemToInventory(creature, creature.inventories[0].id);

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