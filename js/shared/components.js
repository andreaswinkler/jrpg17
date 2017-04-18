"use strict";

(function() {

    var isModule = typeof module !== 'undefined' && typeof module.exports !== 'undefined', 
        utils = isModule ? require('./utils.js'): window.Utils, 
        settings = isModule ? require('./../../data/settings.json') : window.settings;
        
    var components = {

        Movement: {

            moveTo: function(e, x, y) {

                var distance = utils.distance(e.x, e.y, x, y);

                e.movementTarget = {
                    x: x, 
                    y: y, 
                    dx: (x - e.x) / distance, 
                    dy: (y - e.y) / distance, 
                    infinite: false, 
                    ignoreObstacles: false, 
                    e: e, 
                    validatePosition: function(map, x, y) {
                            
                        var tile = utils.gridElement(map.grid, x, y, settings.tileSize);

                        return tile && tile.walkable;

                    }, 
                    update: function(ticks, map) {
                            
                        var targetX = this.e.x + (this.dx * this.e.speed * ticks), 
                            targetY = this.e.y + (this.dy * this.e.speed * ticks);
                            
                        if (this.ignoreObstacles || this.validatePosition(map, targetX, targetY)) {

                            this.e.x = targetX;
                            this.e.y = targetY;

                            if (utils.distance(this.e.x, this.e.y, this.x, this.y) < 10) {

                                this.stop();

                            }

                            this.e.moved = true;

                        } else {

                            this.stop();

                        }

                    }, 
                    stop: function() {

                        this.e.movementTarget = null;

                    }
                }

            }

        }
    
    };

    if (isModule) {

        module.exports = components;
    
    } else {

        window.Components = components;
    
    }

})(this);
