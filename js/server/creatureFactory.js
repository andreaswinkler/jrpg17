"use strict";

module.exports = function(utils, settings, blueprints, components, Inventory, itemFactory, skills) {

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
            creature.projectiles = [];
            creature.dots = [];
            creature.life = creature.maxLife_current;
            creature.mana = creature.maxMana_current;
            creature.isDead = false;
            creature.updates = {};
            creature.halfWidth = creature.width;

            if (creature.balance == null) {
                creature.balance = 0;
            }

            creature.balance = 1000;
            
            if (creature.type == 'hero') {
                creature.skill0 = utils.assign(skills.blueprints.normalMeleeAttack);
                creature.skill1 = utils.assign(skills.blueprints.bashAttack);
                creature.skill2 = utils.assign(skills.blueprints.teleport);
            }

            creature.hitBox = {
                x: creature.x - creature.halfWidth, 
                y: creature.y - creature.height, 
                width: creature.width, 
                height: creature.height
            };

            creature.excludeFields = ['map', 'game', 'inputs', 'movementTarget', 'updates', 'scheduledSkill', 'aggroTarget', 'halfWidth', 'hitBox'];
            
            creature.pack = function() {

                return utils.pack(this);

            };

            creature.set = function(key, value) {

                this[key] = value;
                this.updates[key] = this[key];

            };

            creature.setPosition = function(x, y) {

                this.set('x', x);
                this.set('y', y);

                this.hitBox.x = this.x - this.halfWidth;
                this.hitBox.y = this.y - this.height;

                this.updates.hitBox = this.hitBox;

            };

            creature.resurrect = function() {

                if (this.isDead) {

                    this.set('isDead', false);
                    this.healPercent(100);

                }

            };

            creature.applyDot = function(damage, duration, flavor, source) {

                this.dots.push({
                    damage: damage, 
                    damagePerTick: damage / duration, 
                    duration: duration, 
                    flavor: flavor, 
                    source: source
                });

                this.updates.dots = this.dots;

            };

            creature.calculateXp = function() {

                var i;

                for (i = settings.xpPerLevel.length; i--;) {

                    if (this.xp >= settings.xpPerLevel[i]) {

                        this.set('level', i + 1);
                        this.set('xp_current', this.xp - settings.xpPerLevel[i]);

                    }

                }

            };

            creature.gainXp = function(amount) {

                this.set('xp', this.xp + amount);
                this.calculateXp();

            };

            creature.update = function(ticks) {

                var projectile, enemy, dot, damage, i;

                // handle channeling
                if (this.channeling) {

                    this.channeling.duration -= ticks;

                    if (this.channelling.duration <= 0) {

                        this.channelling.action(this);

                        this.channeling = null;

                    }

                }

                if (!this.isDead) {

                    // handle aggro
                    if (!this.aggroTarget && this.aggroBehavior == 'active') {
                        
                        this.aggroTarget = this.nearestEnemy(this.aggroRange);
        
                    }

                    if (this.aggroTarget) {

                        if (this.aggroTarget.isDead || !utils.inRange(this, this.aggroTarget, this.aggroRange)) {
                            
                            this.aggroTarget = null;

                        } else {

                            if (!this.scheduledSkill) {

                                if (utils.inRange(this, this.aggroTarget, this.skill0.range)) {
                                
                                    this.useSkill('skill0', this.aggroTarget.x, this.aggroTarget.y);

                                } else {
                                
                                    this.moveTo(this.aggroTarget.x, this.aggroTarget.y);

                                }
                            
                            }

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
                
                }

                // healthpotion cooldown
                if (this.healthPotion && this.healthPotion.cooldown_current) {

                    utils.cooldown(this.healthpotion, ticks);

                }

                // skills
                if (this.scheduledSkill) {
                    
                    skills.update(this, ticks);
                
                }

                if (this.skill0 && this.skill0.cooldown_current) {

                    utils.cooldown(this.skill0, ticks);

                }

                if (this.skill1 && this.skill1.cooldown_current) {

                    utils.cooldown(this.skill1, ticks);

                }

                if (this.skill2 && this.skill2.cooldown_current) {

                    utils.cooldown(this.skill2, ticks);

                }

                if (this.skill3 && this.skill3.cooldown_current) {

                    utils.cooldown(this.skill3, ticks);

                }

                if (this.skill4 && this.skill4.cooldown_current) {

                    utils.cooldown(this.skill4, ticks);

                }

                if (this.skill5 && this.skill5.cooldown_current) {

                    utils.cooldown(this.skill5, ticks);

                }

                // projectiles
                for (i = this.projectiles.length; i--;) {

                    projectile = this.projectiles[i];
                    projectile.updates = {};

                    if (projectile.movementTarget) {

                        projectile.movementTarget.update(ticks);

                        enemy = this.enemy(projectile.x, projectile.y);

                        if (enemy) {

                            projectile.data.enemy = enemy;
                            
                            skills.apply(projectile.source, projectile.data);

                            projectile.movementTarget = null;

                        }

                        if (!projectile.movementTarget) {

                            this.projectiles.splice(i, 1);

                        }

                        this.updates.projectiles = this.projectiles;

                    }

                }

                // dots
                for (i = this.dots.length; i--;) {

                    dot = this.dots[i];
                    damage = Math.min(dot.damagePerTick * ticks, dot.damage);

                    this.hurt(dot.damagePerTick * ticks);

                    dot.damage -= damage;

                    if (dot.damage <= 0) {

                        this.dots.splice(i, 1);
                        this.updates.dots = this.dots;

                    }

                }

            };

            creature.launchProjectile = function(projectile) {

                this.projectiles.push(projectile);
                this.updates.projectiles = this.projectiles;

            };

            creature.enemies = function() {

                return this.map.creatures.filter(function(creature) {

                    return !creature.isDead && creature.faction != 'neutral' && creature.faction != this.faction;
            
                }, this);

            };

            creature.enemy = function(x, y) {

                return this.enemies().find(function(enemy) {

                    return utils.hitTest(enemy.x, enemy.y, enemy.width, enemy.height, x, y, x + 1, y + 1);

                });

            };

            creature.nearestEnemy = function(range) {

                var enemies = this.enemies(), 
                    nearestEnemy, shortestDistance, distance;

                for (i = 0; i < enemies.length; i++) {

                    distance = utils.distance(this, enemies[i]);

                    if (distance <= range) {

                        if (!nearestEnemy || distance < shortestDistance) {

                            shortestDistance = distance;
                            nearestEnemy = enemies[i];

                        } 
                        
                    }

                }

                return nearestEnemy;

            };

            creature.pay = function(amount) {

                if (amount <= this.balance) {

                    this.set('balance', this.balance - amount);

                    return true;

                }

                return false;

            };

            creature.earn = function(amount) {

                this.set('balance', this.balance + amount);

            };

            creature.healPercent = function(value) {

                this.heal(this.maxLife_current * value);

            };

            creature.hurt = function(value) {

                this.set('life', Math.max(0, this.life - value));

                if (this.life == 0) {
                    
                    this.set('isDead', true);

                }

            };

            creature.heal = function(value) {

                this.set('life', Math.min(this.maxLife_current, this.life + value));

            };

            creature.restoreMana = function(value) {

                this.set('mana', Math.min(this.maxMana_current, this.mana + value));

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

                this.setPosition(pos.x, pos.y);

            };

            if (creature.speed) {

                creature.moveTo = function(x, y) {

                    components.Movement.moveTo(this, x, y);

                };

            }

            if (creature.healthPotion) {

                creature.useHealthPotion = function() {

                    if (this.healthPotion && !this.healthPotion.cooldown_current) {

                        this.healPercent(this.healthPotion.healPercent);
                        this.healthPotion.cooldown_current = this.healthPotion.cooldown;

                    }

                }

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

                creature.addItemToInventory = function(inventoryId, row, col) {

                    var inventory = this.inventory(inventoryId), 
                        placeResult;

                    if (this.hand && inventory) {

                        if (typeof row != 'undefined') {

                            placeResult = inventory.place(this.hand, row, col);

                            if (placeResult !== false) {

                                if (placeResult !== true) {

                                    this.set('hand', placeResult);

                                } else {

                                    this.set('hand', null);


                                }

                            }

                        } else {

                            if (inventory.add(this.hand).success) {

                                this.set('hand', null);

                            }

                        }

                        this.updates.inventories = this.inventories;

                    }

                };

                creature.grabItem = function(itemId) {

                    var i;

                    for (i = 0; i < this.inventories.length; i++) {

                        this.grabItemFromInventory(this.inventories[i].id, itemId);

                        if (this.hand) {

                            return this.hand;

                        }

                    }

                    return null;

                };

                creature.grabItemFromInventory = function(inventoryId, itemId) {

                    var inventory = this.inventory(inventoryId);

                    if (inventory) {

                        grabResult = inventory.grabItem(itemId, this.hand);

                        if (grabResult.item) {

                            this.set('hand', grabResult.item);

                            this.updates.inventories = this.inventories;

                        }

                    }

                };

                creature.buyItem = function(itemId) {

                    var item = creature.activeNpc.grabItem(itemId);

                    if (item && this.pay(item.buyValue)) {

                        this.hand = creature.activeNpc.hand;
                        creature.activeNpc.hand = null;

                        this.addItemToInventory(this.inventories[0].id);

                        this.updates.inventories = this.inventories;
                        this.updates.hand = this.hand;

                    }

                };

                creature.sellItem = function(itemId) {

                    this.grabItemFromInventory(this.inventories[0].id, itemId);

                    if (this.hand) {

                        this.earn(this.hand.sellValue);

                        this.set('hand', null);

                        this.updates.inventories = this.inventories;

                    }

                };

                creature.pickUp = function(x, y) {

                    var droppedItem = utils.findByHitTest(this.droppedItems, x, y), 
                        result;
                    
                    if (droppedItem) {

                        if (droppedItem.item.isGold) {

                            this.earn(droppedItem.item.amount);

                        } else if (droppedItem.item.isHealthGlobe) {

                            this.healPercent(settings.healthPotionHealPercent);

                        } else {

                            this.hand = droppedItem.item;
                            this.addItemToInventory(this.inventories[0].id);

                        }

                        // remove the dropped item from the list
                        utils.arrayRemove(this.droppedItems, droppedItem);

                        this.updates.hand = this.hand;
                        this.updates.droppedItems = this.droppedItems;

                        return true;

                    }

                    return false;

                };

            }

            creature.spendMana = function(amount) {

                if (this.mana >= amount) {

                    this.set('mana', this.mana - amount);

                    return true;

                }

                return false;

            };

            creature.useSkill = function(skillSlot, x, y) {
                
                var skill = this[skillSlot];
            
                if (!this.scheduledSkill && utils.skillReady(skill) && this.spendMana(skill.manaCost)) {

                    return skills.invoke(this, skill, x, y);

                }

            };

            if (creature.equipment) {

                for (key in creature.equipment) {

                    if (creature.equipment[key] != null) {

                        itemFactory.update(creature.equipment[key], true);

                    }

                }

                creature.equip = function(slot, itemId) {

                    var grabItemResult, item;

                    if (itemId) {

                        grabItemResult = this.inventories[0].grabItem(itemId);

                        if (grabItemResult.item) {

                            this.hand = grabItemResult.item;

                        }

                    } 

                    if (this.hand) {

                        slot = slot || this.hand.slots[0];

                        if (utils.canEquip(this, this.hand, slot)) {

                            item = this.hand;
                            this.hand = this.equipment[slot] || null;
                            this.equipment[slot] = item;

                            this.updateStats();

                            if (this.hand && grabItemResult) {

                                this.inventories[0].place(this.hand, grabItemResult.row, grabItemResult.col);
                                this.hand = null;

                                this.updates.inventories = this.inventories;

                            }

                            this.updates.hand = this.hand;
                            this.updates.equipment = this.equipment;

                            return true;

                        }

                    }

                    return false;

                };

                creature.unequip = function(itemId, moveToInventory) {

                    var key;

                    for (key in this.equipment) {
                        
                        if (this.equipment.hasOwnProperty(key) && this.equipment[key] && this.equipment[key].id == itemId) {

                            this.hand = this.equipment[key];
                            this.equipment[key] = null;

                            if (moveToInventory) {

                                if (this.inventories[0].add(this.hand)) {

                                    this.hand = null;
                                    
                                    this.updates.inventories = this.inventories;

                                }

                            }

                            this.updateStats();

                            this.updates.hand = this.hand;
                            this.updates.equipment = this.equipment;

                            return this.hand;

                        }

                    }

                    return null;

                };

                creature.dropItem = function(x, y) {

                    // move an item from the creatures hand to the dropped items list
                    this.droppedItems.push({ item: this.hand, x: x, y: y, width: 20, height: 20 });

                    // empty the creatures hand
                    this.set('hand', null);

                    this.updates.droppedItems = this.droppedItems;

                }

            }
            
            // update stats based on equipment
            creature.updateStats = function() {

                var item, i;

                for (i = 0; i < settings.attributes.length; i++) {

                    this.set(settings.attributes[i] + '_current', this[settings.attributes[i]] || 0);

                }

                if (this.equipment) {

                    for (key in this.equipment) {

                        if (this.equipment.hasOwnProperty(key) && this.equipment[key]) {

                            item = this.equipment[key];

                            if (item.durability > 0) {

                                for (i = 0; i < settings.attributes.length; i++) {

                                    this.set(settings.attributes[i] + '_current', this[settings.attributes[i] + '_current'] + item[settings.attributes[i]] || 0);

                                }       

                            }      

                        }

                    }
                
                }

                this.set('maxLife_current', this.maxLife_current + this.vitality_current * 10);
                this.set('lifePerSecond_current', this.lifePerSecond_current + this.vitality_current / 10);
                this.set('manaPerSecond_current', this.manaPerSecond_current + this.intelligence_current / 10);

                if (!this.life) {

                    this.set('life', this.maxLife_current);

                }

                if (!this.mana) {

                    this.set('mana', this.maxMana_current);

                }

            }, 

            creature.weapon = function() {

                if (this.equipment) {

                    return this.equipment.mainHand;

                }

            }

            creature.updateStats();
            creature.calculateXp();

            return creature;

        }

    }

};