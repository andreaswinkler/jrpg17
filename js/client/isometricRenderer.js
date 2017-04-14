var IsometricRenderer =  {

    // everything that needs to be redrawn when the player moves
    staticLayer: null, 
    // everything that needs to be updated every frame
    dynamicLayer: null, 

    // the stage dimensions
    width: 0, 
    height: 0, 
    halfWidth: 0, 
    halfHeight: 0, 

    tileSize: 0, 

    // the current offset of the rendered section from the world orgin
    offset: { x: 0, y: 0, map: 0 }, 

    init: function(container, tileSize) {

        this.width = 1200;
        this.height = this.width / 16 * 9;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;

        this.tileSize = tileSize;
        this.halfTileSize = this.tileSize / 2;
        this.quarterTileSize = this.tileSize / 4;
        
        this.staticLayer = new IsometricRenderLayer(this.width, this.height);
        this.dynamicLayer = new IsometricRenderLayer(this.width, this.height);

        container.append(this.staticLayer.canvas);
        container.append(this.dynamicLayer.canvas);

    }, 

    cartesianToIsometric: function(x, y) {

        return {
            x: (x - y), 
            y: (x + y) / 2
        };

    }, 

    isometricToCartesian: function(x, y) {

        return {
            x: (x + y) / 2, 
            y: (y - x) / 2
        };

    }, 

    /* could be a new map, render to map buffer and update static content layer */
    updateMap: function(map) {

        var length = map.grid.length + map.grid[0].length,  
            width = length * this.tileSize + this.halfTileSize, 
            height = length * this.halfTileSize + this.quarterTileSize,  
            i, j, iso;
        
        this.offset.map = this.cartesianToIsometric(map.grid[map.grid.length - 1][0].x, map.grid[map.grid.length - 1][0].y).x * -1;

        this.mapBuffer = new IsometricRenderBuffer(width, height);
        this.objectsBuffer = new IsometricRenderBuffer(width, height);

        for (i = 0; i < map.grid.length; i++) {

            for (j = 0; j < map.grid[i].length; j++) {

                iso = this.cartesianToIsometric(map.grid[i][j].x, map.grid[i][j].y);
                iso.x += this.offset.map;
                this.mapBuffer.draw(Assets.get('tile_' + map.grid[i][j].t), iso.x, iso.y);

                /*if (map.grid[i][j] == '') {
                        
                    this.objectsBuffer.draw(Assets.get('wall'), iso.x, iso.y);
                }*/

            }
        
        }

    }, 

    // set the offset based on the heroes position (he's always in the center)
    // return whether or not the offset has changed
    setOffset: function(map) {

        var x = this.offset.x, 
            y = this.offset.y, 
            heroIsoCoordinates = this.cartesianToIsometric(map.hero.x, map.hero.y);

        this.offset.x = this.offset.map + heroIsoCoordinates.x - this.halfWidth;
        this.offset.y = heroIsoCoordinates.y - this.halfHeight;

        return x != this.offset.x || y != this.offset.y;
    
    }, 

    // update dynamic content and also update static content
    // if the player has moved
    update: function(map) {

        var offsetChanged = this.setOffset(map);

        this.dynamicLayer.clear();

        map.creatures.forEach(this.renderElement, this);

        if (offsetChanged) {

            this.updateStaticContent(map);

        }

    }, 

    // put the correct map section on the screen
    updateStaticContent: function(map) {

        this.staticLayer.clear();

        this.mapBuffer.drawTo(this.staticLayer, 0, 0, this.offset.x, this.offset.y, this.width, this.height);
        //this.objectsBuffer.drawTo(this.staticLayer, this.offset.x, this.offset.y, this.width, this.height);

    }, 

    // render a single element to the dynamic layer
    renderElement: function(element) {

        var isoCoordinates = this.cartesianToIsometric(element.x, element.y);

        if (!element._drawInfo) {

            element._drawInfo = {
                offsetX: (element.width / 2) * - 1, 
                offsetY: (element.height) * -1
            };

        }

        this.dynamicLayer.draw(
            Assets.get(element.asset), 
            isoCoordinates.x - this.offset.x + element._drawInfo.offsetX, 
            isoCoordinates.y - this.offset.y + element._drawInfo.offsetY
        );

    }

}

var IsometricRenderLayer = function(width, height) {

    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    this.isoDraw = function(src, x, y) {

        var isoCoordinates = Utils.cartesianToIsometric(x, y);

        this.draw(src, isoCoordinates.x, isoCoordinates.y);

    };

    this.draw = function(src, x, y, srcX, srcY, srcWidth, srcHeight, width, height) {

        this.ctx.drawImage(src, srcX || 0, srcY || 0, srcWidth || src.width, srcHeight || src.height, x || 0, y || 0, width || src.width, height || src.height);

    };

    this.clear = function() {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    };

    this.drawRect = function(x, y, width, height, fillStyle) {

        this.ctx.fillStyle = fillStyle;
        this.ctx.fillRect(x, y, width, height);

    };

    this.drawCircle = function(x, y, radius, fillStyle) {

        this.ctx.fillStyle = fillStyle;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.fill();

    };

    return this;

}


var IsometricRenderBuffer = function(width, height) {

    var size = 8000, 
        rows = Math.floor(height / size), 
        cols = Math.floor(width / size), 
        i, j, layer;

    this.layers = [];

    for (i = 0; i <= rows; i++) {

        for (j = 0; j <= cols; j++) {

            layer = new IsometricRenderLayer(size, size);
            layer.offsetX = i * size;
            layer.offsetY = j * size;

            this.layers.push(layer);

            $('.debug-layers').append(layer.canvas);

        }

    }

    this.clear = function() {

        this.layers.forEach(function(layer) { layer.clear(); });

    };

    this.findLayers = function(x, y, w, h) {
       
        return this.layers.filter(function(i) { return Utils.hitTest(i.offsetX, i.offsetY, i.width, i.height, x, y, w, h); });

    };

    this.isoDraw = function(src, x, y) {
        
        var isoCoordinates = Utils.cartesianToIsometric(x, y);

        this.draw(src, isoCoordinates.x, isoCoordinates.y);

    };

    this.draw = function(src, x, y) {

        var layers = this.findLayers(x, y, src.width, src.height);
        
        layers.forEach(function(layer) {

            layer.draw(src, x - layer.offsetX, y - layer.offsetY);

        });

    };

    this.drawTo = function(target, x, y, srcX, srcY, srcWidth, srcHeight, width, height) {
        
        target.draw(this.layers[0].canvas, x, y, srcX, srcY, srcWidth, srcHeight, width || srcWidth, height || srcHeight);

    };

}