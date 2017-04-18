"use strict";

module.exports = function(blueprints, components) {

    return {
    
        blueprints: blueprints,
        counter: 0,  

        create: function(key) {

            var creature = Object.assign({}, this.blueprints[key]);

            creature.id = ++this.counter;

            if (creature.speed) {

                creature.moveTo = function(x, y) {

                    components.Movement.moveTo(this, x, y);

                };

            }

            return creature;

        }

    }

};