(function() {

    var isModule = typeof module !== 'undefined' && typeof module.exports !== 'undefined', 
        settings = isModule ? require('./../../data/settings.json') : window.settings;

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
            
            if (arguments.length == 2) {

                return this.hitTest(arguments[0].x, arguments[0].y, arguments[0].width, arguments[0].height, arguments[1].x, arguments[1].y, arguments[1].width, arugments[1].height);

            } else if (arguments.length == 3) {

                return this.hitTest(arguments[0].x, arguments[0].y, arguments[0].width, arguments[0].height, arguments[1], arguments[2], 0, 0);

            } else {

                //console.log('hitTest', x1, y1, w1, h1, x2, y2, w2, h2);
                return !(x1 > x2 + w2 || x1 + w1 < x2 || y1 > y2 + h2 || y1 + h1 < y2);
            
            }

        }, 

        clone: function(obj) {
            
            return obj ? JSON.parse(JSON.stringify(obj)) : {};

        }, 

        assign: function() {

            var args = Array.prototype.slice.call(arguments).map(this.clone, this);
            
            return Object.assign.apply(this, args);

        }, 

        averageDamagePerSecond: function(minDmg, maxDmg, attackSpeed) {

            return (minDmg + maxDmg) / 2 * attackSpeed;

        }, 

        itemDps: function(item) {

            return this.averageDamagePerSecond(item.minDmg, item.maxDmg, item.attackSpeed);

        }, 

        dps: function(creature) {
            
            return this.averageDamagePerSecond(creature.minDmg_current, creature.maxDmg_current, creature.attackSpeed_current);

        }, 

        cooldown: function(obj, ticks) {

            if (obj.cooldown_current > 0) {

                obj.cooldown_current = Math.max(0, obj.cooldown_current - ticks);

            }

        }, 

        skillReady: function(skill) {

            return skill && skill.cooldown_current == 0;

        }, 

        // calculate a random damage value dealt by a source
        // the source provides min/max damage and an optional modifier (aka skill) can 
        // change this value
        damage: function(source, modifier) {

            var result = {
                    damage: 0, 
                    isCritical: false, 
                    flavor: 'physical'
                };
            
            result.damage = utils.random(source.minDmg_current, source.maxDmg_current);

            if (utils.random() < source.criticalHitChance_current) {

                result.isCritical = true;
                result.damage *= (1 + source.criticalHitDamage_current);

            }

            if (modifier) {

                if (modifier.damageMultiplier) {

                    result.damage *= modifier.damageMultiplier;
                
                }

                if (modifier.flavor) {

                    result.flavor = modifier.flavor;

                }

            }

            return result;

        }, 

        // calculate the damage applied to a target
        hitDamage: function(target, damage, flavor, sourceLevel) {

            var result = {
                    isBlocked: false, 
                    isDodged: false, 
                    damage: 0
                }, 
                resistance = target['resistance_' + flavor + '_current'] || 0;
            
            // check if the attack is dodged
            if (utils.random() < target.dodgeChance_current) {

                result.isDodged = true;

            } else {

                // check if the attack is blocked -> if so, subtract the block amount
                if (utils.random() < target.blockChance_current) {

                    result.isBlocked = true;

                    damage = Math.max(0, damage - target.blockAmount_current);

                }

                // handle armor
                damage *= target.armor_current / (50 * sourceLevel + target.armor_current);

                // handle resistances
                damage *= resistance / (5 * sourceLevel + resistance);

                result.damage = damage;
            
            }

            return result;

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

        arrayRemove: function(arr, el) {

            var i;

            for (i = arr.length; i--;) {

                if (arr[i] === el) {

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

                    if (grid[i][j] === el) {

                        grid[i][j] = null;

                    }

                }

            }

        }, 

        // search for an element in a grid by id and return the element 
        // along with its grid index
        searchGridById: function(grid, id) {

            var result = {
                    el: null, 
                    row: -1, 
                    col: -1
                }, i, j;
            
            for (i = 0; i < grid.length; i++) {

                for (j = 0; j < grid[i].length; j++) {

                    if (grid[i][j] != null && grid[i][j].id == id) {

                        result.el = grid[i][j];
                        result.row = i;
                        result.col = j;
                        
                        return result;

                    }
                
                }
            
            }

            return result;

        }, 

        // check if a creature can equip an item to a given slot
        canEquip: function(creature, item, slot) {

            return item.slots.indexOf(slot) != -1 && 
                creature.level >= item.levelRequirement && 
                creature.strength >= item.strengthRequirement && 
                creature.dexterity >= item.dexterityRequirement && 
                creature.intelligence >= item.intelligenceRequirement;

        }, 

        tile: function(map, x, y) {
            
            return utils.gridElement(map.grid, x, y, settings.tileSize);

        }, 

        tileIsWalkable: function(map, x, y) {

            var tile = this.tile(map, x, y);
                    
            return tile && tile.walkable;

        }, 

        currency: function(amount) {

            if (amount > 1) {

                return Math.floor(amount) + ' Gold';

            } else if (amount > 0.1) {

                return Math.floor(amount * 10) + ' Silver';

            } else {

                return Math.floor(amount * 100) + ' Copper';

            }

        }, 

        packField: function(prop) {

            if (Array.isArray(prop)) {
                                
                return prop.map(this.packField, this);

            } else if (prop && prop.pack) {

                return prop.pack();

            } 

            return prop;

        }, 

        pack: function(obj, rootInvokePack) {

            if (obj != null && typeof obj == 'object') {

                var fields = obj.packFields || Object.getOwnPropertyNames(obj), 
                     propertyBlacklist = ['packFields', 'excludeFields'], 
                     result = {},
                    i, key, prop;

                if (obj.excludeFields) {

                    fields = fields.filter(function(i) { return obj.excludeFields.indexOf(i) == -1; });

                }

                for (i = 0; i < fields.length; i++) {

                    key = fields[i];
                    prop = obj[key];

                    if (typeof prop != 'function' && propertyBlacklist.indexOf(key) == -1) {

                        result[key] = this.packField(prop);
                        
                    }

                }

                return result;
                
            }

            return obj;

        }, 

        packGrid: function(grid, key, widthProp, heightProp) {

            var packedGrid = [], 
                packedElements = [], 
                packedElement, i, j;
            
            for (i = 0; i < grid.length; i++) {

                for (j = 0; j < grid[i].length; j++) {

                    if (grid[i][j] && packedElements.indexOf(grid[i][j]) == -1) {

                        packedElement = { 
                            row: i, 
                            col: j, 
                            width: widthProp? grid[i][j][widthProp] : 1, 
                            height: heightProp ? grid[i][j][heightProp] : 1 
                        };
                        packedElement[key] = grid[i][j];

                        packedElements.push(grid[i][j]);
                        packedGrid.push(packedElement);

                    }

                }

            }

            return packedGrid;

        }, 

        expandGrid: function(packedGrid, key, rows, cols) {

            var grid = this.grid(rows, cols), 
                i;
            
            for (i = 0; i < packedGrid.length; i++) {

                this.paintGridCells(grid, packedGrid[i][key], packedGrid[i].row, packedGrid[i].col, packedGrid[i].width, packedGrid[i].height);

            }

            return grid;

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

        }, 

        findByHitTest: function(arr, x, y) {

            return arr.find(function(el) { return utils.hitTest(el, x, y); });

        }, 

        /* ARCHEMEDEAN SPIRAL POSITIONS
        *  return amount positions on an Archemedean spiral which are 
        *  chord away from each other 
        *  
        *  this is from here:
        *  http://stackoverflow.com/questions/13894715/draw-equidistant-points-on-a-spiral               
        */    
        equidistantPositionsOnArchimedeanSpiral: function(amount, chord, x, y) {
        
                // number of coils, this should be determined by the amount
            var coils = 5, 
                // value of theta corresponding to end of last coil
                thetaMax = coils * 2 * Math.PI, 
                radius = chord * coils,  
                // How far to step away from center for each side
                awayStep = radius / thetaMax,
                positions = [], 
                theta, away, around;
            
            // For every side, step around and away from center.
            // start at the angle corresponding to a distance of chord
            // away from centre.
            for (theta = chord / awayStep; theta <= thetaMax; theta++) {
            
                away = awayStep * theta;
                
                positions.push({
                    x: x + Math.cos(theta) * away, 
                    y: y + Math.sin(theta) * away
                });
                
                theta += chord / away;  
                
                if (positions.length >= amount) {
                
                    break;
                
                }  
            
            }
            
            return positions;
        
        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = utils;

    } else {

        window.Utils = utils;

    }

})();