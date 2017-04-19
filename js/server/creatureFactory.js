"use strict";

module.exports = function(utils, blueprints, components, Inventory) {

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
                    inventory.update(inventories[i].items);

                    creature.inventories.push(inventory);

                };

                creature.inventory = function(inventoryId) {

                    return this.inventories.find(function(i) { return i.id == inventoryId; });

                };

            }

            if (creature.equipment) {

                creature.equip = function(item, slot) {

                    if (utils.canEquip(this, item, slot)) {

                        if (this.equipment[slot]) {

                            this.hand = this.equipment[slot];

                        }

                        this.equipment[slot] = item;

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

                            return item;

                        }

                    }

                    return null;

                };

            }

            return creature;

        }

    }

};