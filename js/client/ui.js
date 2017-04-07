var UI = {

    container: null,
    minimap: null,

    Minimap: function(container) {

        this.container = container;
        this.mapName = $('<span class="ui-title ui-minimap-mapName" />').appendTo(container);

        this.setMapName = function(mapName) {

            this.mapName.html(mapName);

        }

    },  

    Renderer: {

        groundLayer: null, 

        init: function(container) {

            UI.Renderer.groundLayer = new UI.RenderLayer(container);

        }, 

        render: function(map) {

            this.groundLayer.clear();

            map.creatures.forEach(this.renderCreature, this);

        }, 

        renderCreature: function(creature) {
            
            this.groundLayer.draw(Assets.get(creature.asset), creature.x, creature.y);

        }

    },

    RenderLayer: function(container) {

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = $(container).width();
        this.canvas.height = $(container).height();

        container.append(this.canvas);

        this.clear = function() {

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        };

        this.draw = function(asset, x, y) {

            this.ctx.drawImage(asset, x, y);

        };

    }, 

    init: function(container) {

        UI.container = container;

        UI.minimap = new UI.Minimap($('<div class="ui-minimap positioned" />').appendTo(UI.container));
        
        UI.Renderer.init($('<div class="ui-stage positioned fullscreen" />').appendTo(UI.container));

        Events.on('game.init', UI.loadingScreen);
        Events.on('game.start', UI.gameScreen);

        Events.on('map.loaded', UI.onMapLoaded);

    }, 

    onMapLoaded: function(map) {

        UI.minimap.setMapName(map.name);
        // upate map name in minimap
        // show map name accross screen


    }, 

    loadingScreen: function() {

    }, 

    gameScreen: function() {

    }

}