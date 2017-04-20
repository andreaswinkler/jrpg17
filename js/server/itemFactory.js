"use strict";

module.exports = function(utils, settings, blueprints) {

    return {
    
        blueprints: blueprints,
        counter: 0,  

        create: function(key) {

            var item = Object.assign({}, this.blueprints[key])
            
            item.id = ++this.counter;

            return item;

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