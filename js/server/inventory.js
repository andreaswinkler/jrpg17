"use strict";

module.exports = function(utils) {

    var Inventory = function(id, name, rows, cols) {

        this.id = id;
        this.name = name;
        this.rows = rows;
        this.cols = cols;

        this.grid = null;

        this.pack = function() {

            return {
                id: this.id, 
                name: this.name, 
                grid: this.grid
            }

        };

        this.add = function(item) {

            var index = this.emptyGridIndex(item.inventoryWidth, item.inventoryHeight);

            if (index) {

                this.place(item, index.row, index.col);

                return true;

            } 

            return false;

        };

        this.update = function(elements) {

            var elements = elements || [], 
                i;

            this.grid = utils.grid(this.rows, this.cols);

            for (i = 0; i < elements.length; i++) {
               
                this.place(elements[i].item, elements[i].row, elements[i].col);
            
            }

        };

        this.emptyGridIndex = function(width, height) {

            var index = null, 
                valid, i, j, k, l;

            for (i = 0; i < this.grid.length - height + 1; i++) {

                for (j = 0; j < this.grid[i].length - width + 1; j++) {

                    valid = true;

                    for (k = 0; k < height; k++) {

                        for (l = 0; l < width; l++) {

                            if (this.grid[i + k][j + l] !== null) {

                                valid = false;

                            }

                        }

                    }

                    if (valid) {

                        index = { row: i, col: j };

                    }

                }

                if (index) {

                    break;

                }

            }

            return index;

        };

        // get a list of items within a grid section
        this.items = function(row, col, width, height) {

            var items = [], 
                i, j, k, found;

            for (i = row; i < row + height; i++) {

                for (j = col; j < col + width; j++) {

                    if (this.grid[i][j] != null) {

                        utils.arrayPushUnique(items, this.grid[i][j]);

                    }

                }

            }

            return items;

        };

        this.grabItem = function(itemId, replacement) {

            var item = null, 
                i, j, index;

            // try to find the item by id and get its grid index
            for (i = 0; i < this.grid.length; i++) {

                for (j = 0; j < this.grid[i].length; j++) {

                    if (this.grid[i][j] != null && this.grid[i][j].id == itemId) {

                        item = this.grid[i][j];
                        index = { row: i, col: j };

                    }

                }
            
            }

            // great, we found the item
            if (item) {

                // if we have a replacement, try to put it in place
                if (replacement) {
                    
                    // we were able to replace the item, so the other one is 
                    // already removed
                    if (this.place(replacement, index.row, index.col) != null) {

                        return item;

                    }

                } 
                // we just grab the item so remove it from the inventory
                else {

                    this.remove(item);

                }

            }

            return item;

        };

        this.remove = function(item) {

            var i, j;

            for (i = 0; i < this.grid.length; i++) {

                for (j = 0; j < this.grid[i].length; j++) {

                    if (this.grid[i][j] == item) {

                        this.grid[i][j] = null;

                    }

                }

            }

        };

        this.place = function(item, row, col) {

            var items = this.items(row, col, item.inventoryWidth, item.inventoryHeight), 
                replacedItem = null;
    
            // if the section is empty we just place the item
            if (items.length == 0) {

                this._markGridCells(item, row, col);

                return true;

            } 
            // if there is only one item affected, we replace it
            else if (items.length == 1) {

                replacedItem = items[0];

                this.remove(replacedItem);

                this._markGridCells(item, row, col);

                return replacedItem;

            }

            return false;

        };

        this._markGridCells = function(item, row, col) {

            var i, j;

            for (i = row; i < row + item.inventoryHeight; i++) {

                for (j = col; j < col + item.inventoryWidth; j++) {

                    this.grid[i][j] = item;

                }

            }

        };

        this.update([]);

    };

    return {
    
        create: function(id, name, rows, cols) {

            return new Inventory(id, name, rows, cols);

        }

    }

};