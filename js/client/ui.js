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

        this.eTitle = $('<div class="ui-window-title"><span>' + options.title + '</span><input type="button" class="ui-window-close" value="X" /></div>').appendTo(this.e);
        this.eContent = $('<div class="ui-window-content"></div>').appendTo(this.e);

        container.append(this.e);

        this.eTitle.find('input').click(function(ev) {

            $(ev.target).closest('.ui-window').removeClass('visible');

            ev.preventDefault();

            return false;

        });

        this.active = function() {

            return this.e.hasClass('visible');

        };

        this.toggle = function() {

            this.e.toggleClass('visible');

        };

        this.title = function(title) {

            this.eTitle.find('span').html(title);

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

        this.dpsField = new UI.StatField(this.e, { label: 'DPS' });
        this.armorField = new UI.StatField(this.e, { label: 'Armor' });

        this.balanceField = new UI.StatField(this.e, { label: '', cssClass: 'ui-statField-balance' });

        container.append(this.e);

        this.update = function(hero) {

            this.strengthField.update(hero.strength_current);
            this.dexterityField.update(hero.dexterity_current);
            this.intelligenceField.update(hero.intelligence_current);
            this.vitalityField.update(hero.vitality_current);
            
            this.dpsField.update(Utils.dps(hero).toFixed(1));
            this.armorField.update(hero.armor_current.toFixed(0));

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
                    .append(UI.sockets(this.item))
                    .on('contextmenu', function(ev) {

                        Net.emit('unequipItem', { itemId: that.item.id, moveToInventory: true });

                        UI.itemOverlay.hide();   
                        UI.comparisonItemOverlay.hide();

                        ev.preventDefault();
                        return false;

                    })
                    .on('mouseenter', function(ev) {

                        var e = $(ev.target).closest('.ui-equipment-item');

                        UI.itemOverlay.show(e.offset().left - 50, e.offset().top, that.item, 'equipment');

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
            this.chestPieceSlot.update(equipment.chestPiece);
            this.glovesSlot.update(equipment.gloves);
            this.headPieceSlot.update(equipment.headPiece);
            this.amuletSlot.update(equipment.amulet);
            this.beltSlot.update(equipment.belt);
            this.pantsSlot.update(equipment.pants);
            this.leftRingSlot.update(equipment.ring1);
            this.rightRingSlot.update(equipment.ring2);
            this.offhandSlot.update(equipment.offhand);
            this.bootsSlot.update(equipment.boots);

        };

        container.append(this.e);

    }, 

    InventoryScreen: function(container, location) {

        this.e = $('<div class="ui-inventory"><div class="ui-inventory-grid"><div class="ui-inventory-highlight"></div></div></div>');
        this.eGrid = this.e.find('.ui-inventory-grid');
        this.eHighlight = this.e.find('.ui-inventory-highlight');
        this.cellSize = 0;
        this.width = 0;
        this.inventory = null;
        this.location = location; 

        this.update = function(inventory) {

            var rows = inventory.grid.length, 
                cols = inventory.grid[0].length, 
                height = this.e.height(), 
                location = this.location, 
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
                            .append(UI.sockets(item))
                            .on('click', function(ev) {

                                var itemId = $(ev.target).closest('.ui-inventory-item').attr('data-id'), 
                                    inventoryId = $(ev.target).closest('.ui-inventory').attr('data-id');

                                Net.emit('grabItem', { itemId: itemId, inventoryId: inventoryId });

                                UI.itemOverlay.hide();   
                                UI.comparisonItemOverlay.hide();

                                ev.preventDefault();
                                return false;

                            })
                            .on('contextmenu', function(ev) {

                                var itemId = $(ev.target).closest('.ui-inventory-item').attr('data-id'); 

                                if (UI.vendorWindow.active()) {

                                    if (location == 'vendor') {

                                        Net.emit('buyItem', { itemId: itemId });

                                    } else {

                                        Net.emit('sellItem', { itemId: itemId });
                                    
                                    }

                                } else {

                                    Net.emit('equipItem', { itemId: itemId });

                                }

                                UI.itemOverlay.hide();   
                                UI.comparisonItemOverlay.hide();

                                ev.preventDefault();
                                return false;

                            })
                            .on('mouseenter', function(ev) {

                                var e = $(ev.target).closest('.ui-inventory-item'), 
                                    item = e.get(0)._item, 
                                    comparisonItem, i;
                                
                                for (i = 0; i < item.slots.length; i++) {

                                    if ($G.hero.equipment[item.slots[i]]) {

                                        comparisonItem = $G.hero.equipment[item.slots[i]];

                                    }

                                }

                                UI.itemOverlay.show(e.offset().left, e.offset().top, item, location == 'inventory' && UI.vendorWindow.active() ? 'inventoryWithVendor' : location);

                                if (comparisonItem) {

                                    UI.comparisonItemOverlay.show(UI.itemOverlay.e.offset().left - 22, e.offset().top, comparisonItem, 'comparison');

                                }

                            })
                            .on('mouseleave', function(ev) {

                                UI.itemOverlay.hide();   
                                UI.comparisonItemOverlay.hide();

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
        this.eSockets = $('<div class="ui-item-overlay-sockets"></div>').appendTo(this.eContent);
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
            'vendor': [null, 'buy'], 
            'comparison': [null, null]
        };

        this.update = function(item, location, comparisonItem) {

            this.item = item;

            this.e.attr('data-rank', this.item.rank);

            this.updateTitle(this.item);

            this.updateContent(this.item, location, comparisonItem);

            this.updateActions(location);

        };

        this.updateTitle = function(item) {

            this.eTitle.html(item.name);

        };

        this.updateContent = function(item, location, comparisonItem) {

            var description = item.type, 
                mainStat = '', 
                sockets ='', 
                affixes = '', 
                info = '', 
                i, affix;

            if (item.rank != 'normal') {

                description = item.rank + ' ' + description;

            }

            if (item.class == 'weapon') {

                mainStat += '<strong>' + Utils.itemDps(item).toFixed(1) + '</strong><br />Damage Per Second<br />';
                mainStat += '<b>' + item.minDmg.toFixed(1) + ' - ' + item.maxDmg.toFixed(1) + '</b> Damage<br />';
                mainStat += '<b>' + item.attackSpeed.toFixed(2) + '</b> Attacks Per Second';

            } else if (item.class == 'armor') {

                mainStat += '<strong>' + item.armor.toFixed(1) + '</strong><br />Armor';

            }

            for (i = 0; i < item.sockets.length; i++) {

                sockets += '<div class="ui-item-overlay-socket">Empty Socket</div>';

            }

            item.affixes.forEach(function(affix) {

                if (!affix.internal) {

                    affixes += '<div class="ui-item-overlay-affix">+' + (affix.isPercent ? (affix[affix.attrib] * 100) + '%' : affix[affix.attrib]) + ' ' + affix.attrib + '</div>';

                }

            });

            info += '<label>Required Level:</label><b>' + item.levelRequirement + '</b>';

            if (location == 'inventoryWithVendor') {

                info += '<label>Sell Value:</label><b>' + item.sellValue + '</b>';

            } else if (location == 'vendor') {

                info += '<label>Price:</label><b>' + item.buyValue + '</b>';

            }

            this.eImage.css('background-image', 'url(assets/items/' + item.asset + '.png)');
            this.eDescription.html(description);
            this.eSlot.html(item.slotHint);
            this.eMainstat.html(mainStat);

            this.eAffixes.html(affixes);
            this.eSockets.html(sockets);
            this.eSetinfo.html('');
            this.eLore.html('');
            this.eInfo.html(info);

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

            var top, left;

            this.update(item, location);

            top = y - this.e.height();
            left = x - this.e.width();

            if (top < 0) {

                top = 0;

            } 

            if (left < 0) {

                left = x + 100;

            }

            this.e
                .css('top', top + 'px')
                .css('left', left + 'px')
                .show();

        };

        this.hide = function() {

            this.e.hide();

        };

        container.append(this.e);

    }, 

    DroppedItemOverlay: function(container) {

        this.e = $('<div class="ui-dropped-item-overlay positioned"></div>');

        this.update = function(item) {
            
            var s = '';

            if (item.isGold) {

                s = Utils.currency(item.amount);

            } else if (item.isHealthGlobe) {

                s = 'Health Globe';

            } else {

                s = item.name;

            }

            this.e.html(s);

        };

        this.show = function(droppedItem, x, y) {

            var top = y - 40, 
                left = x;
            
            this.update(droppedItem.item);

            this.e
                .css('top', top + 'px')
                .css('left', left + 'px')
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
        this.renderer.init($('<div class="ui-stage positioned fullscreen" />').appendTo(this.container), $G.settings.tileSize);

        this.characterWindow = new UI.Window(this.container, { align: 'right', width: '45%' });
        this.statsBar = new UI.StatsBar(this.characterWindow.eContent);
        this.equipmentScreen = new UI.EquipmentScreen(this.characterWindow.eContent);
        this.inventoryScreen = new UI.InventoryScreen(this.characterWindow.eContent, 'inventory');

        this.itemOverlay = new UI.ItemOverlay(this.container);
        this.comparisonItemOverlay = new UI.ItemOverlay(this.container);

        this.droppedItemOverlay = new UI.DroppedItemOverlay(this.container);

        this.vendorWindow = new UI.Window(this.container, { align: 'left', width: '45%', name: 'Vendor' });
        this.vendorWindow.update = function(vendor) {

            var tabs = '';

            this.eContent.addClass('vendor').html('');
            this.title(vendor.name);

            vendor.inventories.forEach(function(inventory, ind) {

                this['inventoryScreen' + ind] = new UI.InventoryScreen(this.eContent, 'vendor');
                this['inventoryScreen' + ind].update(inventory);

                if (ind > 0) {

                    this['inventoryScreen' + ind].e.hide();

                }

                tabs += '<input type="button" value="' + ind + '"' + (ind == 0 ? ' class="active"' : '') + ' data-inventory-id="' + inventory.id +'" />';

            }, this);

            this.eContent.append('<div class="tabs">' + tabs + '</div>');

            this.eContent.find('.tabs input').click(function(ev) {

                var e = $(ev.target), 
                    inventoryId = e.attr('data-inventory-id'), 
                    w = e.closest('.ui-window');
                
                w.find('.ui-inventory').hide();
                w.find('.ui-inventory[data-id=' + inventoryId + ']').show();
                w.find('.tabs input').removeClass('active');
                e.addClass('active');

                ev.preventDefault();

                return false;

            });

        };

        this.itemOverlay.hide();
        this.comparisonItemOverlay.hide();

        this.eHand = $('<div class="ui-hand positioned"></div>').appendTo(this.container);
        this.eStatusBar = $('.status-bar');

        Events.on('game.init', this.loadingScreen, this);
        Events.on('game.start', this.gameScreen, this);

        Events.on('map.loaded', this.onMapLoaded, this);

    }, 

    sockets: function(item) {

        var e = $('<div class="ui-sockets"></div>');

        item.sockets.forEach(function(socket) {

            e.append('<div class="ui-socket"></div>');

        });

        return e;

    }, 

    positionAndResize: function(e, top, left, width, height) {

        e.css('top', top + 'px').css('left', left + 'px').css('width', width + 'px').css('height', height + 'px');

    },

    showVendorWindow: function(vendor) {

        this.vendorWindow.update(vendor);
        this.vendorWindow.toggle();

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

        var worldPosition = this.renderer.isometricToCartesian(
                x - this.renderer.offset.x, 
                y - this.renderer.offset.y), 
            droppedItem = $G.hero.droppedItems.find(function(droppedItem) { 
                
                return Utils.hitTest(droppedItem, worldPosition.x, worldPosition.y); 
            
            });
        
        if (this.handInUse) {

            this.eHand.css('left', (x + 15) + 'px').css('top', (y + 15) + 'px');
        
        }
        
        this.eStatusBar.html(x + ' / ' + y);

        if (droppedItem) {

            this.droppedItemOverlay.show(droppedItem, x, y);

        } else {

            this.droppedItemOverlay.hide();

        }

    }, 

    loadingScreen: function() {

    }, 

    gameScreen: function() {

    }

}