var Assets = {

    store: {}, 
    
    scaleFactor: 1, 

    // temp
    blueprints: {
        'missing': {
            'width': 32, 
            'height': 32, 
            'color': 'rgba(255,0,0,1)'
        },
        'betaVendor': {
            'width': 40, 
            'height': 100, 
            'color': 'rgba(100,100,100,.5)',
            'block': true
        },
        'hero': {
            'width': 40, 
            'height': 100, 
            'color': 'rgba(100,0,55,1)', 
            'block': true
        },
        'tile_F': {
            'color': 'rgba(200,200,200,1)', 
            'tile': true
        },  
        'tile_': {
            'color': 'rgba(0,0,0,0)', 
            'tile': true
        },  
        'tile_DR': {
            'color': 'rgba(0,0,99,1)', 
            'tile': true
        }, 
        'smalltile_F': {
            'color': 'rgba(200,200,200,1)', 
            'smalltile': true
        },  
        'smalltile_': {
            'color': 'rgba(0,0,0,0)', 
            'smalltile': true
        },  
        'smalltile_DR': {
            'color': 'rgba(0,0,99,1)', 
            'smalltile': true
        }, 
        'wall': {
            'color': 'rgba(150,150,150,1)', 
            'block': true, 
            'height': 400
        },
        'chest': {
            'color': 'rgba(30,40,200,1)', 
            'block': true, 
            'height': 50, 
            'width': 50
        }, 
        'gold': {
            'color': 'rgba(0,255,255,1)', 
            'block': true, 
            'height': 20, 
            'width': 20
        }, 
        'healthGlobe': {
            'color': 'rgba(200,0,0,1)', 
            'block': true, 
            'height': 20, 
            'width': 20
        },
        'item': {
            'color': 'rgba(90,30,200,1)', 
            'block': true, 
            'height': 20, 
            'width': 20
        }
    }, 

    get: function(asset) {

        if (!Assets.store[asset]) {

            Assets.store[asset] = Assets.create(asset);

        }

        return Assets.store[asset];

    }, 

    createDiamond: function(ctx, x, y, size, fillStyle) {
      
        ctx.fillStyle = fillStyle;

        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size / 4);
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.lineTo(x, y + size / 4);
        ctx.closePath();
            
        ctx.stroke();
        ctx.fill();

    }, 

    create: function(asset) {

        var canvas = document.createElement('canvas'), 
            ctx = canvas.getContext('2d'), 
            blueprint = Assets.blueprints[asset] || Assets.blueprints.missing;

        canvas.width = (blueprint.width || $G.tileSize * 2) * Assets.scaleFactor;
        canvas.height = (blueprint.height || $G.tileSize) * Assets.scaleFactor;
        
        if (blueprint.smalltile) {
            canvas.width = canvas.width / 10;
            canvas.height = canvas.height / 10;
        }

        ctx.fillStyle = blueprint.color;
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        
        if (blueprint.tile) {

            Assets.createDiamond(ctx, 0, 0, canvas.width, blueprint.color);

        } else if (blueprint.block) {

            Assets.createDiamond(ctx, 0, 0, canvas.width, blueprint.color); 

            ctx.beginPath();
            ctx.moveTo(0, canvas.width / 4);
            ctx.lineTo(0, canvas.height - canvas.width / 4);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.lineTo(canvas.width / 2, canvas.width / 2);
            ctx.closePath();
            
            ctx.stroke();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(canvas.width, canvas.width / 4);
            ctx.lineTo(canvas.width, canvas.height - canvas.width / 4);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.lineTo(canvas.width / 2, canvas.width / 2);
            ctx.closePath();
            
            ctx.stroke();
            ctx.fill();


        } else {
        
            ctx.fillRect(0, 0, canvas.width, canvas.height);

        }        

        return canvas;

    }

}