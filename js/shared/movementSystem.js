(function() {

    var movementSystem = {

        moveTo: function(creature, x, y) {

            var distance = Utils.distance(creature.x, creature.y, x, y);

            creature.movementTarget = {
                    x: x, 
                    y: y, 
                    dx: (x - creature.x) / distance, 
                    dy: (y - creature.y) / distance, 
                    infinite: false, 
                    ignoreObstacles: false, 
                    creature: creature, 
                    validatePosition: function(x, y) {

                        return this.creature.map.tile(x, y).walkable;

                    }, 
                    loop: function(ticks) {

                        var targetX = this.creature.x + (this.dx * this.creature.speed * ticks), 
                            targetY = this.creature.y + (this.dy * this.creature.speed * ticks);

                        if (this.ignoreObstacles || this.validatePosition(targetX, targetY)) {

                            this.creature.x = targetX;
                            this.creature.y = targetY;

                            if (Utils.distance(this.creature.x, this.creature.y, this.x, this.y) < 10) {

                                this.creature.movementTarget = null;

                            }

                        } else {

                            this.creature.movementTarget = null;

                        }

                    }
                };

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = movementSystem;

    } else {

        window.MovementSystem = movementSystem;

    }

})();