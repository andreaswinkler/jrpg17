"use strict";

module.exports = function(utils, settings, skills, mapFactory, itemFactory) {

    return {
    
        counter: 0, 

        create: function(map) {

            return {
                id: ++this.counter, 
                maps: {}, 
                map: null, 
                clients: [], 
                lastActivityTimestamp: +new Date(), 
                packFields: ['id', 'map'], 

                pack: function() {

                    return utils.pack(this);

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

                        if (creature._itemsDropped) {

                            updates.droppedItems = creature.droppedItems;
                            creature._itemsDropped = false;

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

                        this.maps[key] = mapFactory.create(key);

                    }

                    this.map = this.maps[key];

                }, 

                createDrop: function(source, target) {

                    var drop = itemFactory.createDrop(source), 
                        droppedItems = [],
                        positions, i, key;
                    
                    drop.items.forEach(function(i) {

                        droppedItems.push({ item: i });

                    });

                    if (drop.gold > 0) {

                        droppedItems.push({ item: { isGold: true, amount: drop.gold }});

                    }

                    for (i = 0; i < drop.healthGlobes.length; i++) {

                        droppedItems.push({ item: { isHealthGlobe: true }});

                    }

                    for (key in drop.essences) {

                        if (drop.essences[key] > 0) {

                            droppedItems.push({ item: { isEssence: true, type: key, amount: drop.essences[key] }});

                        }

                    }

                    for (key in drop.mats) {

                        if (drop.mats[key] > 0) {

                            droppedItems.push({ item: { isMat: true, type: key, amount: drop.essences[key] }});

                        }

                    }

                    positions = utils.equidistantPositionsOnArchimedeanSpiral(droppedItems.length, 30, source.x, source.y);

                    for (i = 0; i < droppedItems.length; i++) {

                        target.dropItem(droppedItems[i], positions[i].x, positions[i].y);

                    }

                }, 

                onInput: function(key, x, y, shift, ctrl, hero) {

                    var tile, interactable;

                    this.lastActivityTimestamp = +new Date();

                    switch (key) {

                        case 'mouseLeft':

                            if (hero.hand != null && utils.tileIsWalkable(hero.map, x, y)) {

                                console.log('mouseLeft -> dropItem', hero.hand);

                                hero.dropItem(hero.hand, x, y);

                                hero.hand = null;

                            } else if (shift) {

                                console.log('mouseLeft+shift -> attack', hero.skill0);

                                this.useSkill(hero, 'skill0', x, y);

                            } else {

                                console.log('mouseLeft -> interact');

                                if (!this.interact(hero, x, y)) {

                                    console.log('mouseLeft -> attack', hero.skill0);

                                    if (!this.useSkill(hero, 'skill0', x, y)) {

                                        console.log('mouseLeft -> moveTo', x, y);

                                        hero.moveTo(x, y);

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