(function() {

    var creatureFactory = {

        blueprints: {}, 

        init: function() {

            return new Promise(function(resolve, reject) {

                $.getJSON('data/creatures.json', function(res) {

                    CreatureFactory.blueprints = res;

                    resolve();

                });

            });

        }, 

        create: function(options) {

            var creature = $.extend(true, {}, CreatureFactory.blueprints[options.spawns]);

            creature.x = options.x;
            creature.y = options.y;

            if (creature.speed) {

               creature.moveTo = function(x, y) { 

                   MovementSystem.moveTo(this, x, y);

               };

            }

            return [creature];

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = creatureFactory;

    } else {

        window.CreatureFactory = creatureFactory;

    }

})();