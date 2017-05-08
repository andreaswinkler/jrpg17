"use strict";

module.exports = function(utils, settings, mapFactory, itemFactory) {

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

                            hero.grabItemFromInventory(data.inventoryId, data.itemId);

                            break;
                        
                        case 'placeItem':

                            hero.addItemToInventory(data.inventoryId, data.row, data.col);

                            break;
                        
                        case 'equipItem':

                            hero.equip(data.slot, data.itemId);

                            break;
                        
                        case 'unequipItem':

                            hero.unequip(data.itemId, data.moveToInventory);

                            break;
                        
                        case 'sellItem':

                            hero.sellItem(data.itemId);

                            break;
                            
                        case 'buyItem':

                            hero.buyItem(data.itemId);

                            break;

                        case 'mouseLeft':

                            if (hero.hand != null && utils.tileIsWalkable(hero.map, x, y)) {
                                
                                hero.dropItem(x, y);

                            } else if (shift) {

                                hero.useSkill('skill0', x, y);

                            } else {

                                if (!hero.pickUp(x, y)) {

                                    if (!this.interact(hero, x, y)) {

                                        if (!hero.useSkill('skill0', x, y)) {

                                            hero.moveTo(x, y);

                                        }

                                    }
                                
                                }

                            }

                            break;
                        
                        case 'mouseRight':

                            hero.useSkill('skill1', x, y);

                            break;
                        
                        case 'Q':

                            hero.useHealthPotion();

                            break;
                        
                        case 'T':

                            this.townPortal(hero);

                            break;
                        
                        case '1':

                            hero.useSkill('skill2', x, y);

                            break;
                        
                        case '2':

                            hero.useSkill('skill3', x, y);

                            break;
                        
                        case '3':

                            hero.useSkill('skill4', x, y);

                            break;
                        
                        case '4':

                            hero.useSkill('skill5', x, y);

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

                }

            }

        }

    }

};