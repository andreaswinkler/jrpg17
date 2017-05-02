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
                // the state of one creature
                updateCreature: function(creature, ticks) {

                    var i, input;

                    creature.updates = {};
                    
                    // process all inputs we got since the last loop
                    for (i = creature.inputs.length; i--;) {

                        input = creature.inputs[i];

                        this.processInput(input.key, input.x, input.y, input.shift, input.ctrl, input.data, creature);

                        creature.inputs.splice(i, 1);

                    }
                    
                    creature.update(ticks);

                }, 

                // this method is called every frame and recalculates
                // the game state for one map
                updateMap: function(map, ticks) {

                    var i;

                    // calculate all creatures
                    for (i = 0; i < map.creatures.length; i++) {

                        this.updateCreature(map.creatures[i], ticks);

                    }

                }, 

                // this method is called every frame and recalculates 
                // the game state
                update: function(ticks) {
                  
                    // maintain a list of updates per map
                    var updatesList = {}, 
                        ts = +new Date(), 
                        mapKey, map, i, creature, updates;

                    // go through all maps and recalculate everything
                    for (mapKey in this.maps) {

                        map = this.maps[mapKey];

                        this.updateMap(map, ticks);
                    
                    }

                    // go through all maps and grab the updates
                    // we may even have a new map!
                    for (mapKey in this.maps) {

                        map = this.maps[mapKey];
                        updatesList[mapKey] = [];

                        for (i = 0; i < map.creatures.length; i++) {

                            creature = map.creatures[i];
                            
                            if (Object.getOwnPropertyNames(creature.updates).length > 0) {

                                creature.updates.id = creature.id;

                                updatesList[mapKey].push(utils.pack(creature.updates));

                            }

                        }

                        if (map.changedTS >= ts) {

                            updatesList[mapKey].push({ type: 'map', map: map.pack() });

                        }

                    }
                    
                    return updatesList;

                }, 

                // map singleton
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

                processInput: function(key, x, y, shift, ctrl, data, hero, updates) {

                    console.log('input', key, x, y, shift, ctrl);

                    this.lastActivityTimestamp = +new Date();

                    switch (key) {

                        case 'grabItem':

                            this.grabItemFromInventory(hero, data.inventoryId, data.itemId);

                            break;
                        
                        case 'placeItem':

                            this.addItemToInventory(hero, data.inventoryId, data.row, data.col);

                            break;
                        
                        case 'equipItem':

                            this.equipItem(hero, data.itemId, data.slot);

                            break;
                        
                        case 'unequipItem':

                            this.unequipItem(hero, data.itemId, data.moveToInventory);

                            break;
                        
                        case 'sellItem':

                            this.sellItem(hero, data.itemId);

                            break;
                            
                        case 'buyItem':

                            this.buyItem(hero, data.itemId);

                            break;

                        case 'mouseLeft':

                            if (hero.hand != null && utils.tileIsWalkable(hero.map, x, y)) {
                                
                                hero.dropItem(x, y);

                            } else if (shift) {

                                this.useSkill(hero, 'skill0', x, y);

                            } else {

                                if (!this.pickUp(hero, x, y)) {

                                    if (!this.interact(hero, x, y)) {

                                        if (!this.useSkill(hero, 'skill0', x, y)) {

                                            hero.moveTo(x, y);

                                        }

                                    }
                                
                                }

                            }

                            break;
                        
                        case 'mouseRight':

                            this.useSkill(hero, 'skill1', x, y, updates);

                            break;
                        
                        case 'Q':

                            this.useHealthPotion(hero);

                            break;
                        
                        case 'T':

                            this.townPortal(hero);

                            break;

                    }

                }, 

                townPortal: function(hero) {

                    if (!hero.map.isTown) {

                        hero.channeling = {
                            duration: settings.townPortalChannelDurationMS, 
                            type: 'townPortal', 
                            action: function(hero, updates) {

                                var townMap = game.townMap(), 
                                    originMapKey = hero.map.key;

                                // create portal from origin map to town
                                hero.map.createTownPortal(hero, townMap.key);

                                // change to town map
                                hero.changeMap(townMap.key);

                                // create a portal in town leading to the origin map
                                hero.map.createTownPortal(hero, originMapKey);

                            }
                        };

                        hero.updates.channeling = hero.channeling;

                    }

                }, 

                townMap: function() {

                    for (var key in this.maps) {

                        if (this.maps[key].isTown) {

                            return this.maps[key];

                        }

                    }

                    return null;

                }, 

                interact: function(creature, x, y) {
                    
                    var tile = utils.tile(creature.map, x, y), 
                        interactable = tile.interactables.find(function(interactable) {

                            return interactable.active && utils.hitTest(interactable, x, y);

                        }), npc;
                    
                    if (interactable) {

                        interactable.interact(creature);

                        creature.updates.droppedItems = creature.droppedItems;

                        return true;

                    } else {

                        npc = utils.findByHitTest(creature.map.npcs, x, y);

                        if (npc) {

                            console.log('interact with ' + npc.name);
                            creature.activeNpc = npc;

                            return true;

                        }

                    }

                    return false;

                }, 

                // check if we can pick up something from the given position
                pickUp: function(creature, x, y) {

                    // try to find a dropped item on the click position
                    var droppedItem = utils.findByHitTest(creature.droppedItems, x, y), 
                        result;

                    if (droppedItem) {

                        if (droppedItem.item.isGold) {

                            creature.earn(droppedItem.item.amount);

                        } else if (droppedItem.item.isHealthGlobe) {

                            creature.healPercent(20);

                        } else {

                            creature.hand = droppedItem.item;
                            this.addItemToInventory(creature, creature.inventories[0].id);
                        
                        }

                        // remove the dropped item from the list
                        utils.arrayRemove(creature.droppedItems, droppedItem);

                        creature.updates.droppedItems = creature.droppedItems;

                    } 

                    return false;

                }, 

                useSkill: function(creature, slot, x, y) {

                    var skill = creature[slot];

                    if (!creature.scheduledSkill && utils.skillReady(skill) && skill.manaCost >= creature.mana) {

                        creature.mana -= skill.manaCost;

                        creature.updates.mana = creature.mana;

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

                    if (result.success) {

                        creature.updates.hand = creature.hand;
                        creature.updates.inventories = creature.inventories;

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

                    if (result.success) {

                        creature.updates.hand = creature.hand;
                        creature.updates.inventories = creature.inventories;

                    }

                    return result;

                }, 

                equipItem: function(creature, itemId, slot, moveToInventory, row, col) {

                    var grabItemResult;

                    if (itemId) {

                        grabItemResult = this.grabItemFromInventory(creature, creature.inventories[0].id, itemId);

                        row = grabItemResult.row;
                        col = grabItemResult.col;
            
                        moveToInventory = true;

                    }

                    if (creature.equip(creature.hand, (slot || creature.hand.slots[0]))) {

                        if (creature.hand != null && moveToInventory) {
                           
                            this.addItemToInventory(creature, creature.inventories[0].id, row, col);

                            creature.hand = null;

                            creature.updates.inventories = creature.inventories;

                        }

                        creature.updates.hand = creature.hand;
                        creature.updates.equipment = creature.equipment;

                    }

                }, 

                unequipItem: function(creature, itemId, moveToInventory) {

                    var item = creature.unequip(itemId), 
                        addToInventoryResult;
                    
                    // get the slot we talk about and see if it isn't empty
                    if (item) {

                        creature.hand = item;

                        if (moveToInventory) {

                            addToInventoryResult = this.addItemToInventory(creature, creature.inventories[0].id);

                            if (addToInventoryResult.success) {

                                creature.hand = null;

                                creature.updates.inventories = creature.inventories;

                            } 

                        }

                        creature.updates.hand = creature.hand;
                        creature.updates.equipment = creature.equipment;

                    }

                }, 

                buyItem: function(creature, itemId) {
                    
                    var vendor = creature.activeNpc, 
                        grabItemResult, item, i;

                    for (i = 0; i < vendor.inventories.length; i++) {

                        grabItemResult = this.grabItemFromInventory(vendor, vendor.inventories[i].id, itemId);

                        if (grabItemResult.item) {

                            item = grabItemResult.item;

                        }

                    }

                    if (item && creature.pay(item.buyValue)) {

                        creature.hand = creature.activeNpc.hand;
                        creature.activeNpc.hand = null;

                        this.addItemToInventory(creature, creature.inventories[0].id);

                        creature.updates.inventories = creature.inventories;

                    }

                }, 

                sellItem: function(creature, itemId) {
                    
                    var grabItemResult = this.grabItemFromInventory(creature, creature.inventories[0].id, itemId), 
                        item = grabItemResult.item;
                    
                    if (item) {
                        
                        // place item to npc inventory, handle inventory full stuff etc.
                        creature.hand = null;
                        
                        creature.earn(item.sellValue);

                        creature.updates.inventories = creature.inventories;
                        creature.updates.equipment = creature.equipment;

                    }

                }              

            }

        }

    }

};