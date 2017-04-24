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

        // check if two rectangles intersect
        hitTest: function(x1, y1, w1, h1, x2, y2, w2, h2) {
            
            //console.log('hitTest', x1, y1, w1, h1, x2, y2, w2, h2);
            return !(x1 > x2 + w2 || x1 + w1 < x2 || y1 > y2 + h2 || y1 + h1 < y2);

        }, 

        // create a random number or choose a random element
        // the following cases are supported
        // 1) no argument; return a random number between 0.0 and 1.0 (not including 1.0) by delegating to Math.random
        // 2) one array: a random index is choosen between 0 and array.length - 1 and the element is returned
        // 3) one object: all properties are added to a list (and filtered by a probability property if provided), the list is than
        //                passed to the random function triggering case 2)
        // 4) min and max value: a random float is returned between min and max (including)
        // 5) min and max value (int): a random int is returned between min and max (including) 
        random: function() {

            // 1) no parameter -> return a random float between 0.0 and 1.0 (including 0 but not including 1)
            if (arguments.length == 0) {

                return Math.random();

            } 
            // 2/3) return a random element from array/object
            else if (arguments.length == 1) {
                
                if (Array.isArray(arguments[0])) {

                    return (arguments[0])[this.random(0, arguments[0].length - 1, true)];

                } else {

                    var list = [], 
                        rand = this.random();

                    for (var key in arguments[0]) {

                        if (arguments[0].hasOwnProperty(key) && arguments[0][key]) {

                            if (typeof arguments[0][key] == 'object' && (arguments[0][key].probability || 0) < rand) {

                                continue;

                            }

                            list.push(key);

                        }

                    }

                    return this.random(list);

                }
            } 
            // 4) min/max values provided -> return a random float between min/max
            else if (arguments.length == 2) {

                return Math.random() * (arguments[1] - arguments[0]) + arguments[0];

            } 
            // 5) min/max values provided -> return a random int between min/max
            else if (arguments.length == 3) {

                return Math.floor(Math.random() * (arguments[1] - arguments[0] + 1)) + arguments[0];

            }

        }, 

        // merge two objects by adding up all values
        addValues: function(target, src) {

            var key;

            for (key in src) {

                if (src.hasOwnProperty(key) && src[key] !== null) {

                    if (!target[key]) {

                        target[key] = 0;

                    }

                    target[key] += src[key];

                }

            }

            return target;

        }, 

        // add an element to an array only if it does not exists there already
        arrayPushUnique: function(arr, el) {

            var found = false, 
                i;

            for (i = 0; i < arr.length; i++) {

                if (arr[i] == el) {

                    found = true;

                }

            }

            if (!found) {

                arr.push(el);

            }

        }, 

        // remove an element from an array by its id
        arrayRemoveById: function(arr, id) {

            var i;

            for (i = arr.length; i--;) {

                if (arr[i].id == id) {

                    arr.splice(i, 1);

                }

            }

        }, 

        // add a variable to all cells in a rectangular section of a grid
        paintGridCells: function(grid, el, row, col, width, height) {

            var endRowIndex = Math.min(row + height, grid.length), 
                endColIndex = Math.min(col + width, grid[0].length), 
                i, j;

            for (i = row; i < endRowIndex; i++) {

                for (j = col; j < endColIndex; j++) {

                    grid[i][j] = el;

                }

            }

        }, 

        // remove an element from a grid by setting all affected cells to null
        removeFromGrid: function(grid, el) {

            var i, j;

            for (i = 0; i < grid.length; i++) {

                for (j = 0; j < grid[i].length; j++) {

                    if (grid[i][j] == el) {

                        grid[i][j] = null;

                    }

                }

            }

        }, 

        // search for an element in a grid by id and return the element 
        // along with its grid index
        searchGridById: function(grid, id) {

            var i, j;
            
            for (i = 0; i < grid.length; i++) {

                for (j = 0; j < grid[i].length; j++) {

                    if (grid[i][j] != null && grid[i][j].id == id) {

                        return {
                            el: grid[i][j], 
                            row: i, 
                            col: j
                        }

                    }
                
                }
            
            }

            return null;

        }, 

        // check if a creature can equip an item to a given slot
        canEquip: function(creature, item, slot) {

            return item.slots.indexOf(slot) != -1 && 
                creature.level >= item.levelRequirement && 
                creature.strength >= item.strengthRequirement && 
                creature.dexterity >= item.dexterityRequirement && 
                creature.intelligence >= item.intelligenceRequirement;

        }, 

        // create an empty grid of given dimensions
        grid: function(rows, cols) {

            var grid = [], 
                i, j;

            for (i = 0; i < rows; i++) {

                grid.push([]);

                for (j = 0; j < cols; j++) {

                    grid[i].push(null);

                }

            }

            return grid;

        }, 

        // convert cartesian coordinates to a grid cell and return its content
        gridElement: function(grid, x, y, cellSize) {

            var index = this.positionToGridIndex(x, y, cellSize);

            if (index.row >= 0 && index.row < grid.length && index.col >= 0 && index.col < grid[index.row].length) {

                return grid[index.row][index.col];

            }

            return null;

        }, 

        // return all contents of a grid section derived from two cartesian coordinate sets 
        // spanning a rectangle
        gridElements: function(grid, x1, y1, x2, y2, cellSize) {

            var startIndex = Utils.positionToGridIndex(x1, y1, cellSize), 
                endIndex = Utils.positionToGridIndex(x2, y2, cellSize), 
                startRow = Math.max(0, startIndex.row), 
                endRow = Math.min(grid.length, endIndex.row), 
                startCol = Math.max(0, startIndex.col), 
                endCol = Math.min(grid[0].length, endIndex.col), 
                elements = [], i, j;
                            
            for (i = startRow; i < endRow; i++) {

                for (j = startCol; j < endCol; j++) {

                    elements.push(grid[i][j]);

                }

            }

            return elements;

        }, 

        // convert cartesian coordinates to a grid index
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