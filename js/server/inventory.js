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

            var valid, i, j, k, l;

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

                        return { row: i, col: j };

                    }

                }

            }

            return null;

        };

        // get a list of items within a grid section
        this.items = function(row, col, width, height) {

            var items = [],
                endRowIndex = Math.min(row + height, this.grid.length), 
                endColIndex = Math.min(col + width, this.grid[0].length),  
                i, j, k, found;

            for (i = row; i < endRowIndex; i++) {

                for (j = col; j < endColIndex; j++) {

                    if (this.grid[i][j] != null) {

                        utils.arrayPushUnique(items, this.grid[i][j]);

                    }

                }

            }

            return items;

        };

        this.grabItem = function(itemId, replacement) {

            var result = utils.searchGridById(this.grid, itemId);

            // great, we found the item
            if (result) {

                result.item = result.el;

                // if we have a replacement, try to put it in place
                if (replacement) {
                    
                    // we were able to replace the item, so the other one is 
                    // already removed
                    if (this.place(replacement, result.row, result.col) != null) {

                        return result;

                    }

                } 
                // we just grab the item so remove it from the inventory
                else {

                    utils.removeFromGrid(this.grid, result.item);

                }

            }

            return result;

        };

        this.place = function(item, row, col) {

            var items = this.items(row, col, item.inventoryWidth, item.inventoryHeight);
    
            // if the section is empty we just place the item
            if (items.length == 0) {

                utils.paintGridCells(this.grid, item, row, col, item.inventoryWidth, item.inventoryHeight);

                return true;

            } 
            // if there is only one item affected, we replace it
            else if (items.length == 1) {

                utils.removeFromGrid(this.grid, items[0]);

                utils.paintGridCells(this.grid, item, row, col, item.inventoryWidth, item.inventoryHeight);

                return items[0];

            }

            return false;

        };

        this.update([]);

    };

    return {
    
        create: function(id, name, rows, cols) {

            return new Inventory(id, name, rows, cols);

        }

    }

};