"use strict";

(function() {

    var isModule = typeof module !== 'undefined' && typeof module.exports !== 'undefined', 
        utils = isModule ? require('./utils.js') : window.Utils, 
        settings = isModule ? require('./../../data/settings.json') : window.settings, 
        log = isModule ? require('./log.js') : window.Log;
        
    var components = {

        Movement: {

            moveTo: function(e, x, y, range) {

                var distance = utils.distance(e.x, e.y, x, y);

                e.movementTarget = {
                    originX: e.x, 
                    originY: e.y, 
                    x: x, 
                    y: y, 
                    dx: (x - e.x) / distance, 
                    dy: (y - e.y) / distance, 
                    infinite: false, 
                    ignoreObstacles: false, 
                    range: range, 
                    e: e, 
                    update: function(ticks) {
                            
                        var targetX = ~~(this.e.x + (this.dx * this.e.speed * ticks)), 
                            targetY = ~~(this.e.y + (this.dy * this.e.speed * ticks));
                        
                        if (this.ignoreObstacles || utils.tileIsWalkable(this.e.map, targetX, targetY)) {

                            this.e.x = targetX;
                            this.e.y = targetY;

                            if (utils.distance(this, this.e) < 10) {
                                
                                this.stop();

                            }

                            if (this.range && utils.distance(this.originX, this.originY, this.x, this.y) > this.range) {
                                
                                this.stop();

                            }

                            this.e.updates.x = this.e.x;
                            this.e.updates.y = this.e.y;

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
