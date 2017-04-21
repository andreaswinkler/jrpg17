// app acts like a protocol parser and is the counterpart of the net module 
// on the client-side
var app = require('http').createServer(), 
    io = require('socket.io')(app),
    fs = require('fs'), 
    server = require('./../js/server/server.js')(), 
    creatures = require('./../data/creatures.json'), 
    items = require('./../data/items.json'), 
    settings = require('./../data/settings.json'), 
    utils = require('./../js/shared/utils.js'), 
    inventory = require('./../js/server/inventory.js')(utils), 
    game = require('./../js/server/game.js')(fs, utils, settings),  
    components = require('./../js/shared/components.js'), 
    itemFactory = require('./../js/server/itemFactory.js')(utils, settings, items), 
    creatureFactory = require('./../js/server/creatureFactory.js')(utils, settings, creatures, components, inventory, itemFactory); 

app.listen(1337);

console.log(itemFactory.createDrop({ level: 1, treasureClass: 1 }));

io.on('connection', function(client) {

    console.log('somebody connected, yay!');
    server.games = [];

    client.player = { name: 'abc', hero: creatureFactory.create('hero') };
    client.hero = client.player.hero;
    client.hero.x = 600;
    client.hero.y = 600;

    client.on('disconnect', function() {

        if (client.game) {

            utils.arrayRemoveById(client.game.id);

        }

        console.log('We lost a client. Games remaining: ' + server.games.length);

    });

    client.on('createGame', function() {

        client.game = game.create();
        client.game.clients.push(client);

        server.games.push(client.game);

        client.game.changeMap('village');
        client.game.map.creatures.push(client.player.hero);

        console.log('Game created. Games running: ' + server.games.length);

        client.emit('gameCreated', { game: client.game.pack() });

    });

    client.on('input', function(data) {

        var item;

        if (client.game) {

            if (data.key == 'mouseLeft' && client.hero.hand != null && client.game.tileIsWalkable(client.game.map, data.x, data.y)) {
                
                client.emit('handUpdate', { item: null });
                client.emit('drop', { item: client.hero.hand, x: data.x, y: data.y });

                client.hero.hand = null;

            } else {

                client.game.onInput(data, client.hero);
            
            }

        }

    });

    client.on('grabItem', function(data) {

        var result = client.game.grabItemFromInventory(client.hero, data.inventoryId, data.itemId);

        if (result.success) {

            client.emit('handUpdate', { item: client.hero.hand });
            client.emit('inventoryUpdate', { inventory: result.inventory.pack() });

        }

    });

    client.on('placeItem', function(data) {

        var result = client.game.addItemToInventory(client.hero, data.inventoryId, data.row, data.col);

        if (result.success) {

            client.emit('handUpdate', { item: client.hero.hand });
            client.emit('inventoryUpdate', { inventory: result.inventory.pack() });

        }

    });

    client.on('equipItem', function(data) {

        var moveToInventory = false, 
            slot, row, col, grabItemResult;

        if (data.itemId) {

            grabItemResult = client.game.grabItemFromInventory(client.hero, client.hero.inventories[0].id, data.itemId);

            row = grabItemResult.row;
            col = grabItemResult.col;
            
            moveToInventory = true;

        }

        item = client.hero.hand;

        if (client.hero.hand) {

            result = client.game.equipItem(client.hero, client.hero.hand, (data.slot || client.hero.hand.slots[0]), moveToInventory, row, col);
            
            if (result.success) {

                client.emit('handUpdate', { item: client.hero.hand });
                client.emit('equipmentUpdate', { equipment: client.hero.equipment });
                client.emit('update', [client.hero]);

                // we send an inventory update if we put back an item or if we took it directly 
                // from there
                if (result.moveToInventorySuccess || data.itemId) {

                    client.emit('inventoryUpdate', { inventory: result.inventory.pack() });

                }

            }

        }

    });

    client.on('unequipItem', function(data) {

        var result = client.game.unequipItem(client.hero, data.itemId, data.moveToInventory);

        if (result.success) {

            client.emit('handUpdate', { item: client.hero.hand });
            client.emit('equipmentUpdate', { equipment: client.hero.equipment });
            client.emit('update', [client.hero]);

            if (result.moveToInventorySuccess) {

                client.emit('inventoryUpdate', { inventory: result.inventory.pack() });

            }

        }

    });

    client.emit('helo', { version: server.version, player: client.player, settings: settings });

});

console.log('SERVER STARTED <' + server.version + '>');

// start the server loop
server.run();                                                                                                                                                                            