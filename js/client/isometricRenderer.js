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

        this.width = 1024;
        this.height = this.width / 16 * 9;
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;

        this.tileSize = tileSize;
        this.halfTileSize = this.tileSize / 2;
        this.quarterTileSize = this.tileSize / 4;
        
        this.staticLayerBack = new IsometricRenderLayer(this.width, this.height);
        this.dynamicLayer = new IsometricRenderLayer(this.width, this.height);
        this.staticLayerFront = new IsometricRenderLayer(this.width, this.height);

        container.append(this.staticLayerBack.canvas);
        container.append(this.dynamicLayer.canvas);
        container.append(this.staticLayerFront.canvas);

    }, 

    cartesianToIsometric: function(x, y) {

        return {
            x: (x - y), 
            y: (x + y) / 2
        };

    }, 

    isometricToCartesian: function(x, y) {

        return {
            x: (2 * y + x) / 2, 
            y: (2 * y - x) / 2
        };

    }, 

    /* could be a new map, render to map buffer and update static content layer */
    updateMap: function(map) {

        var length = map.grid.length + map.grid[0].length,  
            width = (length * this.tileSize + this.halfTileSize) / 10, 
            height = (length * this.halfTileSize + this.quarterTileSize) / 10,  
            leftMostTile = map.grid[map.grid.length - 1][0], 
            wallAsset = Assets.get('wall'), 
            i, j, iso, tile;
        
        // calculate the horizontal offset necessary to avoid negative values on the map tile positions
        // we do so by getting the first tile of the last row (i.e. the left-most) and use its 
        // isometric coordinates as the offset
        this.offset.map = (this.cartesianToIsometric(leftMostTile.x, leftMostTile.y).x - this.tileSize) / 10 * -1;
    
        this.mapBuffer = new IsometricRenderBuffer(width, height);

        for (i = 0; i < map.grid.length; i++) {

            for (j = 0; j < map.grid[i].length; j++) {

                tile = map.grid[i][j];

                iso = this.cartesianToIsometric(tile.x, tile.y);
                iso.x += this.offset.map;
                
                this.mapBuffer.draw(Assets.get('smalltile_' + tile.t), (iso.x - this.tileSize) / 10, (iso.y / 10));

            }
        
        }

    }, 

    // set the offset based on the heroes position (he's always in the center)
    // return whether or not the offset has changed
    setOffset: function(map) {

        var x = this.offset.x, 
            y = this.offset.y, 
            heroIsoCoordinates = this.cartesianToIsometric(map.hero.x, map.hero.y);

        this.offset.x = this.halfWidth - heroIsoCoordinates.x;
        this.offset.y = this.halfHeight - heroIsoCoordinates.y;

        return x != this.offset.x || y != this.offset.y;
    
    }, 

    // update dynamic content and also update static content
    // if the player has moved
    update: function(map) {

        var offsetChanged = this.setOffset(map);

        this.dynamicLayer.clear();

        map.creatures.forEach(this.renderElement, this);
        map.interactables.forEach(this.renderElement, this);

        //this.dynamicLayer.drawCircle($G.mouseX, $G.mouseY, 5, 'rgba(10,90,222,0.5)');

        /*var heroIsoCoords = this.cartesianToIsometric(map.hero.x, map.hero.y), 
            coords = this.isometricToCartesian(heroIsoCoords.x - this.halfWidth + $G.mouseX, heroIsoCoords.y - this.halfHeight + $G.mouseY), 
            tile = Game.activeMap.tile(coords.x, coords.y);
       
        if (tile.x || tile.x == 0) {

            var isoCoords = this.cartesianToIsometric(tile.x, tile.y);
            this.dynamicLayer.drawRect(isoCoords.x + this.offset.x, isoCoords.y + this.offset.y, 64, 32);

        }*/

        if (offsetChanged) {

            this.updateStaticContent(map);

        }

    }, 

    // put the correct map section on the screen
    updateStaticContent: function(map) {

        var offset = $G.tileSize * 5, 
            tiles = Utils.gridElements(map.grid, map.hero.x - offset, map.hero.y - offset, map.hero.x + offset, map.hero.y + offset, $G.tileSize);
 
        this.staticLayerBack.clear();
        this.staticLayerFront.clear();

        tiles.forEach(this.renderTile, this);

            /*bufferX = Math.floor(heroIsoCoordinates.x + this.offset.map - this.halfWidth), 
            bufferY = Math.floor(heroIsoCoordinates.y - this.halfHeight);
        
        this.mapBuffer.drawTo(this.staticLayer, 0, 0, bufferX, bufferY, this.width, this.height);*/

    }, 

    renderTile: function(tile) {

        var heroIsoCoordinates = this.cartesianToIsometric($G.hero.x, $G.hero.y), 
            isoCoordinates = this.cartesianToIsometric(tile.x, tile.y), 
            front = tile.y > $G.hero.y, 
            layer = front ? this.staticLayerFront : this.staticLayerBack;

        if (tile.t != '') {

            layer.draw(
                Assets.get('tile_' + tile.t), 
                isoCoordinates.x - this.tileSize + this.offset.x, 
                isoCoordinates.y + this.offset.y
            );
        
        } else {

            layer.draw(
                Assets.get('wall'), 
                isoCoordinates.x - this.tileSize + this.offset.x, 
                isoCoordinates.y + this.offset.y - 40
            ); 


        
        }

    }, 

    // render a single element to the dynamic layer
    renderElement: function(element) {

        var isoCoordinates = this.cartesianToIsometric(element.x, element.y);
        
        this.dynamicLayer.draw(
            Assets.get(element.asset), 
            Math.floor(isoCoordinates.x + this.offset.x - (element.width / 2)), 
            Math.floor(isoCoordinates.y + this.offset.y - element.height + (element.width / 4))
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

    this.text = function(text, x, y) {

        this.ctx.font = "10px Arial";

        if (text.indexOf('\n')) {

            var lines = text.split('\n'), 
                i;
            
            for (i = 0; i < lines.length; i++) {

                this.ctx.fillText(lines[i], x, y + i * 10);

            }

        } else {

            this.ctx.fillText(text, x, y);
        }

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
            layer.offsetX = j * size;
            layer.offsetY = i * size;

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

    this.text = function(text, x, y) {

        this.findLayers(x, y, 1, 1).shift().text(text, x, y);

    };

    this.draw = function(src, x, y) {

        var layers = this.findLayers(x, y, src.width, src.height);
        
        layers.forEach(function(layer) {

            layer.draw(src, x - layer.offsetX, y - layer.offsetY);

        });

    };

    this.drawTo = function(target, x, y, srcX, srcY, srcWidth, srcHeight, width, height) {
        
        var layers = this.findLayers(srcX, srcY, srcWidth, srcHeight), 
            i;

        for (i = 0; i < layers.length; i++) {

            target.draw(layers[i].canvas, x, y, srcX - layers[i].offsetX, srcY - layers[i].offsetY, srcWidth, srcHeight, width || srcWidth, height || srcHeight);

        }

    };

}