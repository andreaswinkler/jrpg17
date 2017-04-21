"use strict";

module.exports = function(utils, settings, blueprints) {

    return {
    
        blueprints: blueprints,
        counter: 0,  

        create: function(blueprint, level, rank, quality, namedItem) {
            
            var item = Object.assign({}, blueprint, namedItem || {}), 
                qualitySettings = settings.itemQualities[quality], 
                rankSettings = settings.itemRanks[rank], 
                affixCount = utils.random(rankSettings.minAffixCount, rankSettings.maxAffixCount), 
                possibleAffixes = settings.affixes.filter(function(i) { return i.classes.indexOf(item.class) != -1 && i.minLevel <= level && i.maxLevel >= level }), 
                i, affix;
            
            item.level = level;
            item.rank = rank;
            item.quality = quality;

            for (i = item.affixes.filter(function(i) { return !i.internal; }).length; i < affixCount; i++) {

                // get a random affix from the list of possible ones
                affix = utils.random(possibleAffixes);

                // remove the affix from the list of possible ones -> we don't add affixes twice
                possibleAffixes = possibleAffixes.filter(function(i) { return i != affix; });

                item.affixes.push(affix);

            }

            // instantiate all affixes
            for (i = 0; i < item.affixes.length; i++) {

                item.affixes[i] = Object.assign({}, item.affixes[i]);

            }

            // calculate all affixes
            item.affixes.forEach(function(affix) {

                affix[affix.attrib] = utils.random(affix.minValue, affix.maxValue, affix.isInteger);

                // apply quality armor multiplier on the base armor value
                if (affix.internal && affix.attrib == 'armor') {

                    affix.armor *= qualitySettings.armorMultiplier;

                }

                // apply quality damage multiplier on the base damage value
                if (affix.internal && affix.attrib == 'minDmg') {

                    affix.minDmg *= qualitySettings.damageMultiplier;

                }

                if (affix.internal && affix.attrib == 'maxDmg') {

                    affix.maxDmg *= qualitySettings.damageMultiplier;

                }

            });

            console.log(item.affixes);

            if (item.rank == 'normal') {
                
                item.name = qualitySettings.nameTemplate.replace('%', item.name); 

            } else if (item.rank == 'magic') {

                item.name = [
                    (item.affixes.find(function(i) { return !i.internal && i.type == 'prefix'; }) || {}).name, 
                    item.name, 
                    (item.affixes.find(function(i) { return !i.internal && i.type == 'suffix'; }) || {}).name 
                ].join(' ');

            } else if (item.rank == 'rare') {

                item.name = utils.random(blueprint.rareNames);

            }

            item.durability = item.maxDurability;

            delete item.mythicalItems;
            delete item.setItems;
            delete item.legendaryItems;
            delete item.minLevel;
            delete item.maxLevel;
            delete item.treasureClass;
            delete item.rareNames;

            this.update(item, true);

            return item;

        }, 

        // generate a drop based on the source level (creature level or area level)
        // and the treasure class (normal critter vs boss or rocks vs massive chest)
        // treasure classes are also used to gain access to very specific items
        // in case the source has an equipment, we could also drop something from there
        createDrop: function(source) {

            var amount = 1, 
                drop = {
                    items: [], 
                    mats: {},  
                    essences: {
                        beast: 0, 
                        demon: 0, 
                        spirit: 0, 
                        human: 0
                    }, 
                    gold: 0, 
                    healthGlobes: 0
                }, 
                i, key, rand, salvageResult, item, rank, quality, possibleBlueprints, blueprint, namedItem;

            drop.gold = source.treasureClass * utils.random(0, source.level / 10);

            if (amount > 0) {

                // if our source is a creature and the creature is dead we extract an essences
                // and check if we drop some equipment
                if (source.isDead) {

                    for (key in drop.essences) {

                        if (source.type == key) {

                            drop.essences[key] += (1 * settings.creatureRanks[source.rank].essenceMultiplier);

                        }

                    }

                    // check if we drop a healthglobe
                    if (utils.random() < settings.creatureRanks[source.rank].healthGlobeDropChance) {

                        drop.healthGlobes += 1;

                    }

                    // if the source uses items itself
                    if (source.equipment) {

                        for (key in source.equipment) {

                            if (source.equipment.hasOwnProperty(key) && source.equipment[key]) {

                                item = source.equipment[key];

                                rand = utils.random();

                                if (rand < settings.equipmentDropChance) {

                                    drop.items.push(item);

                                } else if (rand < settings.equipmentSalvageChance) {

                                    utils.addValues(drop.mats, this.salvage(item));

                                }

                                source.equipment[key] = null;

                            }

                        }

                    }
                
                }

                // if we have some space left in our drop
                if (drop.items.length < amount) {

                    possibleBlueprints = this.blueprints.filter(function(i) {

                        return i.minLevel <= source.level &&
                            i.maxLevel >= source.level &&
                            i.treasureClass <= source.treasureClass;

                    });

                    for (i = 0; i < amount; i++) {

                        // get a random blueprint out of the possible ones
                        blueprint = utils.random(possibleBlueprints);

                        // get a random rank for the item (normal, magic, rare, legendary, set, mythical)
                        // beware that the resulting item could be of lower rank if there are no 
                        // named items available (set, legendary, mythical)
                        rank = utils.random(settings.itemRanks);

                        // cascade down the ranks while trying to find a named item
                        ['mythical', 'set', 'legendary'].forEach(function(i, index, arr) {

                            if (rank == i) {

                                namedItem = utils.random(blueprint[i + 'Items']);

                                if (!namedItem) {

                                    rank = index < arr.length - 1 ? arr[index + 1] : 'rare';

                                }

                            }

                        });

                        // get a random quality for the item (damaged, normal, good, exceptional, etheral)
                        // beware that the damged quality has no effect on legendary, set or mythical items
                        quality = utils.random(settings.itemQualities);

                        drop.items.push(this.create(blueprint, source.level, rank, quality, namedItem));

                    }
                
                }

            }
            
            return drop;

        }, 

        salvage: function(item) {

            return settings.salvageResults[item.rank];

        }, 

        update: function(item, renewId) {

            var i;

            if (renewId) {

                item.id = ++this.counter;

            }

            // reset item
            settings.attributes.forEach(function(attrib) {
                
                item[attrib] = 0;

            });

            if (item.affixes) {

                this.applyAffixes(item);
            
            }

            if (item.minDmg) {

                item.dps = (item.minDmg + item.maxDmg / 2) * item.attackSpeed;

            }

        }, 

        applyAffixes: function(item) {

            item.affixes.forEach(function(affix) {

                settings.attributes.forEach(function(attrib) {

                    if (affix[attrib]) {

                        item[attrib] += affix[attrib];

                    }

                });

            });

        }

    }

};