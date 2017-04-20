var UI = {

    container: null,
    minimap: null,
    renderer: null, 

    Minimap: function(container) {

        this.container = container;
        this.mapName = $('<span class="ui-title ui-minimap-mapName" />').appendTo(container);
        this.staticLayer = new IsometricRenderLayer(250, 250);
        this.dynamicLayer = new IsometricRenderLayer(250, 250);

        container.append(this.dynamicLayer.canvas);
        container.append(this.staticLayer.canvas);

        this.setMapName = function(mapName) {

            this.mapName.html(mapName);

        };

        this.updateStaticContent = function() {

            this.staticLayer.clear();
            this.staticLayer.drawCircle(125, 125, 5, 'rgba(0,0,200,1)');

        };

        this.update = function() {
            
            var heroIsoCoordinates = UI.renderer.cartesianToIsometric($G.hero.x, $G.hero.y);

            this.dynamicLayer.clear();
            UI.renderer.mapBuffer.drawTo(this.dynamicLayer, 0, 0, heroIsoCoordinates.x + UI.renderer.offset.map - 2000, heroIsoCoordinates.y - 2000, 4000, 4000, 250, 250);

        };

    },  

    Window: function(container, options) {

        var options = $.extend({
                align: 'center', 
                layer: 'default'
            }, options);

        this.e = $('<div class="positioned ui-window ui-window-align-' + options.align + ' ui-window-layer-' + options.layer + '"></div>');
        this.e.css('width', options.width);

        container.append(this.e);

        this.toggle = function() {

            this.e.toggleClass('visible');

        };

    }, 

    StatField: function(container, options) {

        this.e = $('<div class="ui-statField"><label>' + options.label + '</label><span class="value"></span></div>');

        if (options.cssClass) {

            this.e.addClass(options.cssClass);

        }

        this.eValue = this.e.find('.value');

        this.update = function(value) {

            this.eValue.html(value);

        };

        container.append(this.e);

    }, 

    StatsBar: function(container) {

        this.e = $('<div class="ui-statsBar"></div>');

        this.strengthField = new UI.StatField(this.e, { label: 'Strength' });
        this.dexterityField = new UI.StatField(this.e, { label: 'Dexterity' });
        this.intelligenceField = new UI.StatField(this.e, { label: 'Intelligence' });
        this.vitalityField = new UI.StatField(this.e, { label: 'Vitality' });

        this.balanceField = new UI.StatField(this.e, { label: '', cssClass: 'ui-statField-balance' });

        container.append(this.e);

        this.update = function(hero) {

            this.strengthField.update(hero.strength);
            this.dexterityField.update(hero.dexterity);
            this.intelligenceField.update(hero.intelligence);
            this.vitalityField.update(hero.vitality);
            
            this.balanceField.update(hero.balance);

        };

    }, 

    EquipmentSlot: function(container, options) {

        this.e = $('<div class="ui-equipmentSlot ui-equipmentSlot-' + options.slot +'" title="' + options.title + '"></div>');
        this.item = null;
        this.slot = options.slot;

        this.update = function(item) {
         
            var that = this;

            if (item) {

                this.e.html('<div class="ui-equipment-item item-rank-' + item.rank + '"><img src="assets/items/' + item.asset + '.png" /></div>');
                this.item = item;

                this.e.find('.ui-equipment-item')
                    .on('contextmenu', function(ev) {

                        Net.emit('unequipItem', { itemId: that.item.id, moveToInventory: true });

                        ev.preventDefault();
                        return false;

                    })
                    .on('mouseenter', function(ev) {

                        var e = $(ev.target).closest('.ui-equipment-item');

                        UI.itemOverlay.show(e.offset().left, e.offset().top, that.item, 'equipment');

                    })
                    .on('mouseleave', function(ev) {

                        UI.itemOverlay.hide();   

                    });

            } else {

                this.e.html('');
                this.item = null;

            }

        };

        var that = this;

        // if we click on a slot we determine if there is an item attached and if so, we put it into the hand
        this.e
            .on('click', function(ev) {
                
                if ($G.hero.hand) {

                    Net.emit('equipItem', { slot: that.slot });

                } else if (that.item) {

                    Net.emit('unequipItem', { itemId: that.item.id });

                } 

                ev.preventDefault();
                return false;

            });

        container.append(this.e);

    }, 

    EquipmentScreen: function(container) {

        this.e = $('<div class="ui-equipmentScreen"></div>');

        this.headPieceSlot = new UI.EquipmentSlot(this.e, { title: 'Head Piece', slot: 'headPiece' });
        this.amuletSlot = new UI.EquipmentSlot(this.e, { title: 'Amulet', slot: 'amulet' });
        this.shouldersSlot = new UI.EquipmentSlot(this.e, { title: 'Shoulders', slot: 'shoulders' });
        this.glovesSlot = new UI.EquipmentSlot(this.e, { title: 'Gloves', slot: 'gloves' });
        this.chestPieceSlot = new UI.EquipmentSlot(this.e, { title: 'Chest Piece', slot: 'chestPiece' });
        this.bracersSlot = new UI.EquipmentSlot(this.e, { title: 'Bracers', slot: 'bracers' });
        this.beltSlot = new UI.EquipmentSlot(this.e, { title: 'Belt', slot: 'belt' });
        this.pantsSlot = new UI.EquipmentSlot(this.e, { title: 'Pants', slot: 'pants' });
        this.bootsSlot = new UI.EquipmentSlot(this.e, { title: 'Boots', slot: 'boots' });
        this.leftRingSlot = new UI.EquipmentSlot(this.e, { title: 'Ring', slot: 'ring1' });
        this.rightRingSlot = new UI.EquipmentSlot(this.e, { title: 'Ring', slot: 'ring2' });
        this.tokenSlot1 = new UI.EquipmentSlot(this.e, { title: 'Token', slot: 'token1' });
        this.tokenSlot2 = new UI.EquipmentSlot(this.e, { title: 'Token', slot: 'token2' });
        this.tokenSlot3 = new UI.EquipmentSlot(this.e, { title: 'Token', slot: 'token3' });
        this.mainHandSlot = new UI.EquipmentSlot(this.e, { title: 'Weapon', slot: 'mainHand' });
        this.alternativeMainHandSlot = new UI.EquipmentSlot(this.e, { title: 'Weapon', slot: 'alternativeMainHand' });
        this.offhandSlot = new UI.EquipmentSlot(this.e, { title: 'Offhand', slot: 'offhand' });
        this.alternativeOffhandSlot = new UI.EquipmentSlot(this.e, { title: 'Offhand', slot: 'alternativeOffhand' });

        this.update = function(equipment) {
            
            this.mainHandSlot.update(equipment.mainHand);

        };

        container.append(this.e);

    }, 

    InventoryScreen: function(container) {

        this.e = $('<div class="ui-inventory"><div class="ui-inventory-grid"><div class="ui-inventory-highlight"></div></div></div>');
        this.eGrid = this.e.find('.ui-inventory-grid');
        this.eHighlight = this.e.find('.ui-inventory-highlight');
        this.cellSize = 0;
        this.width = 0;
        this.inventory = null;

        this.update = function(inventory) {

            var rows = inventory.grid.length, 
                cols = inventory.grid[0].length, 
                height = this.e.height(), 
                i, j, item, eItem;
                
            this.inventory = inventory;
            this.cellSize = Math.floor(height / rows);

            this.e.attr('data-id', inventory.id);

            this.eGrid.find('.ui-inventory-item').remove();

            this.eGrid
                .css('background-size', this.cellSize + 'px ' + this.cellSize + 'px')
                .css('width', (cols * this.cellSize) + 'px')
                .css('height', (rows * this.cellSize) + 'px');

            for (i = 0; i < inventory.grid.length; i++) {

                for (j = 0; j < inventory.grid[i].length; j++) {

                    item = inventory.grid[i][j];

                    if (item != null && this.eGrid.find('.ui-inventory-item[data-id=' + item.id + ']').length == 0) {

                        eItem = $('<div class="ui-inventory-item item-rank-' + item.rank + '" data-id="' + item.id + '"></div>')
                            .append('<img src="assets/items/' + item.asset + '.png" />')
                            .on('click', function(ev) {

                                var itemId = $(ev.target).closest('.ui-inventory-item').attr('data-id'), 
                                    inventoryId = $(ev.target).closest('.ui-inventory').attr('data-id');

                                Net.emit('grabItem', { itemId: itemId, inventoryId: inventoryId });

                                ev.preventDefault();
                                return false;

                            })
                            .on('contextmenu', function(ev) {

                                var itemId = $(ev.target).closest('.ui-inventory-item').attr('data-id'); 

                                Net.emit('equipItem', { itemId: itemId });

                                ev.preventDefault();
                                return false;

                            })
                            .on('mouseenter', function(ev) {

                                var e = $(ev.target).closest('.ui-inventory-item');

                                UI.itemOverlay.show(e.offset().left, e.offset().top, e.get(0)._item, 'inventory');

                            })
                            .on('mouseleave', function(ev) {

                                UI.itemOverlay.hide();   

                            });
                            
                        eItem.get(0)._item = item;
                        
                        UI.positionAndResize(eItem, i * this.cellSize, j * this.cellSize, item.inventoryWidth * this.cellSize, item.inventoryHeight * this.cellSize);

                        this.eGrid.append(eItem);

                    }

                }

            }

        };

        this.updateHighlight = function(x, y) {

            var row = Math.floor(y / this.cellSize), 
                col = Math.floor(x / this.cellSize), 
                width = $G.hero.hand.inventoryWidth * this.cellSize, 
                height = $G.hero.hand.inventoryHeight * this.cellSize, 
                positionValid = (row + $G.hero.hand.inventoryHeight - 1) < this.inventory.grid.length && 
                                (col + $G.hero.hand.inventoryWidth - 1) < this.inventory.grid[0].length, 
                // position is valid if there is enough space on the inventory and we at 
                // most only replace one item
                valid = positionValid && Utils.gridElements(this.inventory.grid, row, col, row + $G.hero.hand.inventoryWidth - 1, col + $G.hero.hand.inventoryHeight - 1, 1).length <= 1;

            UI.positionAndResize(this.eHighlight, row * this.cellSize, col * this.cellSize, width, height);
            
            if (valid) {

                this.eHighlight.removeClass('invalid');

            } else {

                this.eHighlight.addClass('invalid');

            }

            this.eHighlight.attr('data-row', row).attr('data-col', col).show();

        };

        var that = this;

        this.eGrid.on('mousemove', function(ev) {

            if ($G.hero.hand) {

                that.updateHighlight(ev.pageX - that.eGrid.offset().left, ev.pageY - that.eGrid.offset().top);

            } else {

                that.eHighlight.hide();

            }

        });

        this.eGrid.on('mouseleave', function(ev) {

            that.eHighlight.hide();

        });

        this.eHighlight.on('click', function(ev) {
            
            if ($G.hero.hand) {

               Net.emit('placeItem', { 
                   inventoryId: $(ev.target).closest('.ui-inventory').attr('data-id'), 
                   row: that.eHighlight.attr('data-row'), 
                   col: that.eHighlight.attr('data-col'), 
                });

            }

            ev.preventDefault();
            return false;

        });

        container.append(this.e);

    }, 

    ItemOverlay: function(container) {

        this.e = $('<div class="ui-item-overlay positioned"></div>');
        this.eTitle = $('<div class="ui-item-overlay-title"></div>').appendTo(this.e);
        this.eContent = $('<div class="ui-item-overlay-content"></div>').appendTo(this.e);
        this.eActions = $('<div class="ui-item-overlay-actions"></div></div>').appendTo(this.e);
        
        this.eImage = $('<div class="ui-item-overlay-image"></div>').appendTo(this.eContent);
        this.eMainstats = $('<div class="ui-item-overlay-mainstats"></div>').appendTo(this.eContent);
        this.eAffixes = $('<div class="ui-item-overlay-affixes"></div>').appendTo(this.eContent);
        this.eSlots = $('<div class="ui-item-overlay-slots"></div>').appendTo(this.eContent);
        this.eSetinfo = $('<div class="ui-item-overlay-setinfo"></div>').appendTo(this.eContent);
        this.eLore = $('<div class="ui-item-overlay-lore"></div>').appendTo(this.eContent);
        this.eInfo = $('<div class="ui-item-overlay-info"></div>').appendTo(this.eContent);

        this.eDescription = $('<div class="ui-item-overlay-description"></div>').appendTo(this.eMainstats);
        this.eSlot = $('<div class="ui-item-overlay-slot"></div>').appendTo(this.eMainstats);
        this.eMainstat = $('<div class="ui-item-overlay-mainstat"></div>').appendTo(this.eMainstats);

        this.item = null;
        this.actions = {
            'equipment': ['unequip', 'move to inventory'], 
            'inventory': ['grab', 'equip'], 
            'inventoryWithVendor': ['grab', 'sell'], 
            'vendor': [null, 'buy']
        };

        this.update = function(item, location, comparisonItem) {

            this.item = item;

            this.e.attr('data-rank', this.item.rank);

            this.updateTitle(this.item);

            this.updateContent(this.item, comparisonItem);

            this.updateActions(location);

        };

        this.updateTitle = function(item) {

            this.eTitle.html(item.name);

        };

        this.updateContent = function(item, comparisonItem) {

            var description = item.type, 
                mainStat = '', 
                slots ='', 
                i;

            if (item.rank != 'normal') {

                description = item.rank + ' ' + description;

            }

            if (item.class == 'weapon') {

                mainStat += '<strong>' + item.dps + '</strong><br />Damage Per Second<br />';
                mainStat += '<b>' + item.minDmg + ' - ' + item.maxDmg + '</b> Damage<br />';
                mainStat += '<b>' + item.attackSpeed + '</b> Attacks Per Second';

            } else if (item.class == 'armor') {

                mainStat += '<strong>' + item.armor + '</strong><br />Armor';

            }

            for (i = 0; i < item.slots.length; i++) {

                slots += '<div class="ui-item-overlay-slot"></div>';

            }

            this.eImage.css('background-image', 'url(assets/items/' + item.asset + '.png)');
            this.eDescription.html(description);
            this.eSlot.html(item.slotHint);
            this.eMainstat.html(mainStat);

            this.eAffixes.html('');
            this.eSlots.html(slots);
            this.eSetinfo.html('');
            this.eLore.html('');
            this.eInfo.html('<label>Required Level:</label><b>' + item.levelRequirement + '</b>');

        };

        this.updateActions = function(location) {

            var leftClickAction = this.actions[location][0], 
                rightClickAction = this.actions[location][1];

            this.eActions.html('');

            if (leftClickAction) {

                this.eActions.append('<span class="ui-item-overlay-action ui-item-overlay-action-leftclick">' + leftClickAction + '</span>');

            }

            if (rightClickAction) {

                this.eActions.append('<span class="ui-item-overlay-action ui-item-overlay-action-rightclick">' + rightClickAction + '</span>');

            }

        };

        this.show = function(x, y, item, location) {

            this.update(item, location);

            this.e
                .css('top', (y - this.e.height()) + 'px')
                .css('left', (x - this.e.width()) + 'px')
                .show();

        };

        this.hide = function() {

            this.e.hide();

        };

        container.append(this.e);

    }, 

    init: function(container) {

        this.container = container;
        
        this.handInUse = false;

        this.minimap = new UI.Minimap($('<div class="ui-minimap positioned" />').appendTo(this.container));
        
        this.renderer = IsometricRenderer;
        this.renderer.init($('<div class="ui-stage positioned fullscreen" />').appendTo(this.container), $G.tileSize);

        this.characterWindow = new UI.Window(this.container, { align: 'right', width: '45%' });
        this.statsBar = new UI.StatsBar(this.characterWindow.e);
        this.equipmentScreen = new UI.EquipmentScreen(this.characterWindow.e);
        this.inventoryScreen = new UI.InventoryScreen(this.characterWindow.e);

        this.itemOverlay = new UI.ItemOverlay(this.container);
        this.coparisonItemOverlay = new UI.ItemOverlay(this.container);

        this.eHand = $('<div class="ui-hand positioned"></div>').appendTo(this.container);
        this.eStatusBar = $('.status-bar');

        Events.on('game.init', this.loadingScreen, this);
        Events.on('game.start', this.gameScreen, this);

        Events.on('map.loaded', this.onMapLoaded, this);

    }, 

    positionAndResize: function(e, top, left, width, height) {

        e.css('top', top + 'px').css('left', left + 'px').css('width', width + 'px').css('height', height + 'px');

    },

    toggleCharacterWindow: function() {

        this.statsBar.update($G.hero);
        this.equipmentScreen.update($G.hero.equipment);
        this.inventoryScreen.update($G.hero.inventories[0]);

        this.characterWindow.toggle();

    }, 

    onMapLoaded: function(map) {

        this.minimap.setMapName(map.name);
        this.minimap.updateStaticContent();
        this.minimap.update();
        // show map name accross screen


    }, 

    handUpdate: function(item) {

        if (item) {

            this.handInUse = true;
            this.eHand.html('<img src="assets/items/' + item.asset + '.png" />').show();
        
        } else {

            this.handInUse = false;
            this.eHand.hide();

        }

    }, 

    onMouseMove: function(x, y) {

        if (this.handInUse) {

            this.eHand.css('left', (x + 15) + 'px').css('top', (y + 15) + 'px');
        
        }
        
        this.eStatusBar.html(x + ' / ' + y);

    }, 

    loadingScreen: function() {

    }, 

    gameScreen: function() {

    }

}