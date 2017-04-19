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
         
            if (item) {

                this.e.html('<div class="ui-equipment-item rank-' + item.rank + '"><img src="assets/items/' + item.asset + '.png" /></div>');
                this.item = item;

            } else {

                this.e.html('');
                this.item = null;

            }

        };

        this.unequip = function() {

            var item;

            if (UI.itemInHand) {

                if (Utils.canEquip($G.hero, UI.itemInHand, this.slot)) {

                    item = this.item;

                    this.update(UI.itemInHand);

                    UI.itemInHand = item;

                }

            } else {

                UI.itemInHand = this.item;

                this.update(null);

            }

        };

        this.equip = function(item) {

            this.update(item);

        };

        var that = this;

        // if we click on a slot we determine if there is an item attached and if so, we put it into the hand
        this.e
            .on('click', function(ev) {
                
                if (that.item) {

                    Net.emit('unequipItem', { itemId: that.item.id });

                } else if ($G.hero.hand) {

                    Net.emit('equipItem', { slot: that.slot });

                }
                
                ev.preventDefault();
                return false;

            })
            .on('contextmenu', function(ev) {

                if (that.item) {

                    Net.emit('unequipItem', { itemId: that.item.id, moveToInventory: true });
                    
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

        this.e = $('<div class="ui-inventory"><div class="ui-inventory-grid"></div></div>');
        this.eGrid = this.e.find('.ui-inventory-grid');

        this.update = function(inventory) {
            
            var rows = inventory.grid.length, 
                cols = inventory.grid[0].length, 
                height = this.e.height(), 
                cellSize = Math.floor(height / rows), 
                i, j, item;
            
            this.eGrid
                .html('')
                .css('background-size', cellSize + 'px ' + cellSize + 'px')
                .css('width', (cols * cellSize) + 'px')
                .css('height', (rows * cellSize) + 'px');

            for (i = 0; i < inventory.grid.length; i++) {

                for (j = 0; j < inventory.grid[i].length; j++) {

                    item = inventory.grid[i][j];

                    if (item != null && this.eGrid.find('.ui-inventory-item[data-id=' + item.id + ']').length == 0) {

                        this.eGrid.append('<div class="ui-inventory-item" data-id="' + item.id + '" style="width:' + (item.inventoryWidth * cellSize) + 'px;height:' + (item.inventoryHeight * cellSize) + 'px;top:' + (i * cellSize) + 'px;left:' + (j * cellSize) + 'px"><img src="assets/items/' + item.asset + '.png" /></div>');

                    }

                }

            }

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

        this.eHand = $('<div class="ui-hand positioned"></div>').appendTo(this.container);
        this.eStatusBar = $('.status-bar');

        Events.on('game.init', this.loadingScreen, this);
        Events.on('game.start', this.gameScreen, this);

        Events.on('map.loaded', this.onMapLoaded, this);

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