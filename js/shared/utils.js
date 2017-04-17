(function() {

    var utils = {

        // calculate the distance between two positions in pixels
        distance: function(x, y, x2, y2) {
            
            return Math.sqrt((x2 - x) * (x2 - x) + (y2 - y) * (y2 - y));  
            
        }, 
            
        // calculate the angle between the given vector and the x-axis
        direction: function(x, y, x2, y2) {
            
            var theta = Math.atan2((y2 - y) * -1, x2 - x);
                
            if (theta < 0) {
                
                theta += 2 * Math.PI;
                
            }
                
            return theta;
            
        }, 

        hitTest: function(x1, y1, w1, h1, x2, y2, w2, h2) {
            
            //console.log('hitTest', x1, y1, w1, h1, x2, y2, w2, h2);
            return !(x1 > x2 + w2 || x1 + w1 < x2 || y1 > y2 + h2 || y1 + h1 < y2);

        }, 

        gridElement: function(grid, x, y, cellSize) {

            var index = this.positionToGridIndex(x, y, cellSize);

            if (index.row >= 0 && index.row < grid.length && index.col >= 0 && index.col < grid[index.row].length) {

                return grid[index.row][index.col];

            }

            return null;

        }, 

        positionToGridIndex: function(x, y, cellSize) {

            return {
                row: Math.floor(y / cellSize), 
                col: Math.floor(x / cellSize)
            };

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = utils;

    } else {

        window.Utils = utils;

    }

})();