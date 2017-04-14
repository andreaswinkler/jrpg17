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

            this.dynamicLayer.clear();
            UI.renderer.mapBuffer.drawTo(this.dynamicLayer, 0, 0, Game.hero.x - 250, Game.hero.y - 250, 500, 500, 250, 250);

        };

    },  

    init: function(container) {

        UI.container = container;

        UI.minimap = new UI.Minimap($('<div class="ui-minimap positioned" />').appendTo(UI.container));
        
        UI.renderer = IsometricRenderer;
        UI.renderer.init($('<div class="ui-stage positioned fullscreen" />').appendTo(UI.container), $G.tileSize);

        Events.on('game.init', UI.loadingScreen);
        Events.on('game.start', UI.gameScreen);

        Events.on('map.loaded', UI.onMapLoaded);

    }, 

    onMapLoaded: function(map) {

        UI.minimap.setMapName(map.name);
        UI.minimap.updateStaticContent();
        // show map name accross screen


    }, 

    loadingScreen: function() {

    }, 

    gameScreen: function() {

    }

}