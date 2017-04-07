(function() {

    var movementSystem = {

        moveTo: function(creature, x, y) {

            creature.movementTarget = {
                    x: x, 
                    y: y, 
                    dx: 1, 
                    dy: 1, 
                    infinite: false, 
                    creature: creature, 
                    loop: function(ticks) {
                        this.creature.x += this.dx;
                        this.creature.y += this.dy;

                        if (this.creature.x == this.x && this.creature.y == this.y) {
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