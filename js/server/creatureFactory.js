"use strict";

module.exports = function(utils, settings, blueprints, components, Inventory, itemFactory) {

    return {
    
        blueprints: blueprints,
        counter: 0,  

        create: function(key) {

            var creature = Object.assign({}, this.blueprints[key]), 
                i, inventories, inventory;

            creature.id = ++this.counter;

            if (creature.speed) {

                creature.moveTo = function(x, y) {

                    components.Movement.moveTo(this, x, y);

                };

            }

            if (creature.inventories) {
            
                inventories = creature.inventories;

                creature.inventories = [];

                for (i = 0; i < inventories.length; i++) {

                    inventory = Inventory.create(inventories[i].id, inventories[i].name, inventories[i].rows, inventories[i].cols);
                    
                    // prepare items
                    inventories[i].items.forEach(function(inventoryItem) {

                        itemFactory.update(inventoryItem.item, true);

                    });
                    
                    inventory.update(inventories[i].items);

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
  
                        this.hand = this.equipment[slot];
                        
                        this.equipment[slot] = item;

                        this.update();

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

                            this.update();

                            return item;

                        }

                    }

                    return null;

                };

                // update stats based on equipment
                creature.update = function() {

                    var item, i;

                    for (i = 0; i < settings.attributes.length; i++) {

                        this[settings.attributes[i] + '_current'] = this[settings.attributes[i]] || 0;

                    }

                    for (key in this.equipment) {

                        if (this.equipment.hasOwnProperty(key) && this.equipment[key]) {

                            item = this.equipment[key];

                            if (item.minDmg) {

                                item.dps = (item.minDmg + item.maxDmg) / 2 * item.attackSpeed;

                            }

                            if (item.durability > 0) {

                                for (i = 0; i < settings.attributes.length; i++) {

                                    this[settings.attributes[i] + '_current'] += item[settings.attributes[i]] || 0;

                                }       

                            }      

                        }

                    }

                }

            }

            return creature;

        }

    }

};