var Assets = {

    store: {}, 
    
    scaleFactor: 25, 

    // temp
    blueprints: {
        'defaultTile': {
            'width': 1, 
            'height': 1
        }, 
        'betaVendor': {
            'width': 2, 
            'height': 5, 
            'color': 'rgba(100,100,100,.5)'
        },
        'hero': {
            'width': 2, 
            'height': 5, 
            'color': 'rgba(100,0,55,.5)'
        }
    }, 

    get: function(asset) {

        if (!Assets.store[asset]) {

            Assets.store[asset] = Assets.create(asset);

        }

        return Assets.store[asset];

    }, 

    create: function(asset) {

        var canvas = document.createElement('canvas'), 
            ctx = canvas.getContext('2d'), 
            blueprint = Assets.blueprints[asset];

        canvas.width = blueprint.width * Assets.scaleFactor;
        canvas.height = blueprint.height * Assets.scaleFactor;
        
        ctx.fillStyle = blueprint.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);        

        return canvas;

    }

}