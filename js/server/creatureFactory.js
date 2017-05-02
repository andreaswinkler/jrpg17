"use strict";

module.exports = function(utils, settings, blueprints, components, Inventory, itemFactory) {

    return {
    
        blueprints: blueprints,
        counter: 0,  

        create: function(key, data, game) {
            
            var creature = utils.assign({}, this.blueprints[key], data), 
                i, j, inventories, inventory;
            
            creature.id = ++this.counter;
            creature.game = game;
            creature.droppedItems = [];
            creature.inputs = [];

            if (creature.balance == null) {
                creature.balance = 0;
            }

            creature.balance = 1000;

            creature.excludeFields = ['map', 'game', 'inputs', 'movementTarget', 'updates'];
            
            creature.pack = function() {

                return utils.pack(this);

            };

            creature.update = function(ticks) {

                // handle channeling
                if (this.channeling) {

                    this.channeling.duration -= ticks;

                    if (this.channeling.duration <= 0) {

                        this.channelling.action(this);

                        this.channeling = null;

                    }

                }

                // handle movement
                if (this.movementTarget) {
                                
                    this.movementTarget.update(ticks);

                }

                // life per second
                if (this.life < this.maxLife_current) {

                    this.heal(this.lifePerSecond_current / 1000 * ticks);
                            
                }

                // mana per second
                if (this.mana < this.maxMana_current) {

                    this.restoreMana(this.manaPerSecond_current / 1000 * ticks);
                            
                }

                // healthpotion cooldown
                if (this.healthpotion) {

                    utils.cooldown(this.healthpotion, ticks);

                }

            };

            creature.enemy = function(x, y) {

                return this.map.creatures.find(function(creature) { 
                    
                    return creature.faction != this.faction && 
                           utils.hitTest(creature.x, creature.y, creature.width, creature.height, x, y, x + 1, y + 1) 
                
                }, this);

            };

            creature.pay = function(amount) {

                if (amount <= this.balance) {

                    this.balance -= amount;

                    this.updates.balance = this.balance;

                    return true;

                }

                return false;

            };

            creature.earn = function(amount) {

                this.balance += amount;

                this.updates.balance = this.balance;

            };

            creature.healPercent = function(value) {

                this.heal(this.maxLife_current * value);

            };

            creature.hurt = function(value) {

                this.life = Math.max(0, this.life - value);

                if (this.life == 0) {

                    this.isDead = true;

                }

                this.updates.life = this.life;
                this.updates.isDead = this.isDead;

            };

            creature.heal = function(value) {

                this.life = Math.min(this.maxLife_current, this.life + value);

                this.updates.life = this.life;

            };

            creature.restoreMana = function(value) {

                this.mana = Math.min(this.maxMana_current, this.mana + value);

                this.updates.mana = this.mana;

            };

            creature.changeMap = function(mapKey) {

                var oldMapKey, pos;

                // remove ourselves from the current map if necessary
                if (this.map) {

                    oldMapKey = this.map.key;

                    this.map.removeCreature(this);

                }

                // load the new map
                this.map = this.game.map(mapKey);

                // add ourselves to the new map
                this.map.addCreature(this);
                
                // update our position accordingly
                pos = this.map.entrance(oldMapKey);

                this.x = pos.x;
                this.y = pos.y;

            };

            if (creature.speed) {

                creature.moveTo = function(x, y) {

                    components.Movement.moveTo(this, x, y);

                };

            }

            if (creature.inventories) {
            
                inventories = creature.inventories;

                creature.inventories = [];

                for (i = 0; i < inventories.length; i++) {

                    if (inventories[i].items) {

                        // prepare items
                        inventories[i].items.forEach(function(inventoryItem) {

                            itemFactory.update(inventoryItem.item, true);

                        });
                    
                    }

                    if (!inventories[i].rows) {

                        inventories[i].rows = this.blueprints[key].inventories[i].rows;

                    }

                    if (!inventories[i].cols) {

                        inventories[i].cols = this.blueprints[key].inventories[i].cols;

                    }

                    inventory = Inventory.create(inventories[i].id, inventories[i].name, inventories[i].rows, inventories[i].cols, inventories[i].items);
                    
                    if (inventories[i].autoFill) {

                        inventory.add(itemFactory.createVendorStock(creature, inventories[i].autoFill));

                    }

                    creature.inventories.push(inventory);

                };

                creature.inventory = function(inventoryId) {

                    return this.inventories.find(function(i) { return i.id == inventoryId; });

                };

            }

            if (creature.equipment) {

                for (key in creature.equipment) {

                    if (creature.equipment[key] != null) {

                        itemFactory.update(creature.equipment[key], true);

                    }

                }

                creature.equip = function(item, slot) {

                    if (utils.canEquip(this, item, slot)) {
  
                        this.hand = this.equipment[slot] || null;
                        
                        this.equipment[slot] = item;

                        this.updateStats();

                        return true;

                    } else {

                        return false;

                    }

                };

                creature.unequip = function(itemId) {

                    var item, key;

                    for (key in this.equipment) {
                        
                        if (this.equipment.hasOwnProperty(key) && this.equipment[key] && this.equipment[key].id == itemId) {

                            item = this.equipment[key];

                            this.equipment[key] = null;

                            this.updateStats();

                            return item;

                        }

                    }

                    return null;

                };

                // update stats based on equipment
                creature.updateStats = function() {

                    var item, i;

                    for (i = 0; i < settings.attributes.length; i++) {

                        this[settings.attributes[i] + '_current'] = this[settings.attributes[i]] || 0;

                    }

                    for (key in this.equipment) {

                        if (this.equipment.hasOwnProperty(key) && this.equipment[key]) {

                            item = this.equipment[key];

                            if (item.durability > 0) {

                                for (i = 0; i < settings.attributes.length; i++) {

                                    this[settings.attributes[i] + '_current'] += item[settings.attributes[i]] || 0;

                                }       

                            }      

                        }

                    }

                    this.maxLife_current += this.vitality_current * 10;
                    this.lifePerSecond_current += this.vitality_current / 10;
                    this.manaPerSecond_current += this.intelligence_current / 10;

                }, 

                creature.weapon = function() {

                    return this.equipment.mainHand;

                }

                creature.dropItem = function(x, y) {

                    // move an item from the creatures hand to the dropped items list
                    this.droppedItems.push({ item: this.hand, x: x, y: y, width: 20, height: 20 });

                    // empty the creatures hand
                    this.hand = null;

                    this.updates.droppedItems = this.droppedItems;
                    this.updates.hand = this.hand;

                }

            }

            return creature;

        }

    }

};