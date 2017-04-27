// app acts like a protocol parser and is the counterpart of the net module 
// on the client-side
var app = require('http').createServer(), 
    io = require('socket.io')(app),
    fs = require('fs'), 
    creatures = require('./../data/creatures.json'), 
    items = require('./../data/items.json'), 
    settings = require('./../data/settings.json'), 
    utils = require('./../js/shared/utils.js'), 
    inventory = require('./../js/server/inventory.js')(utils), 
    skills = require('./../js/server/skills.js')(utils), 
    mapFactory = require('./../js/server/mapFactory.js')(fs, utils, settings), 
    components = require('./../js/shared/components.js'), 
    itemFactory = require('./../js/server/itemFactory.js')(utils, settings, items), 
    creatureFactory = require('./../js/server/creatureFactory.js')(utils, settings, creatures, components, inventory, itemFactory), 
    player = require('./../js/server/player.js')(fs, utils, creatureFactory), 
    game = require('./../js/server/game.js')(utils, settings, skills, mapFactory, itemFactory), 
    server = require('./../js/server/server.js')(utils, settings, player, game);

app.listen(1337);

io.on('connection', function(client) {

    console.log('somebody connected, yay!');

    // TEMP: this should come from somewhere else
    server.login(client, 1);

    client.on('disconnect', function() {

        server.logout(client);

        console.log('We lost a client. Games remaining: ' + server.games.length);

    });

    client.on('createGame', function() {

        // create a new game instance
        server.createGame(client);

        // TEMP: fill our inventory and equipment
        /*for (var i = 0; i < 5; i++) {
            var drop = itemFactory.createDrop({ level: 1, treasureClass: 1 });
            for (var j = 0; j < drop.items.length; j++) {
                client.hero.hand = drop.items[j];
                client.game.addItemToInventory(client.hero, 1);
            }
            client.hero.balance += drop.gold;
        }*/
        
        client.hero.update();
        
        client.emit('inventoryUpdate', { inventory: client.hero.inventories[0].pack() });
        client.emit('update', [client.hero.pack()]);
        // end TEMP

        // TEMP: how do we determine which level we load?
        client.hero.changeMap('village');

        console.log('Game created. Games running: ' + server.games.length);

        client.emit('gameCreated', { game: client.game.pack(), map: client.hero.map.pack() });

    });

    client.on('input', function(data) {

        client.hero.inputs.push(data);

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
                client.emit('update', [client.hero.pack()]);

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
            client.emit('update', [client.hero.pack()]);

            if (result.moveToInventorySuccess) {

                client.emit('inventoryUpdate', { inventory: result.inventory.pack() });

            }

        }

    });

    client.emit('helo', { version: server.version, player: client.player.pack(), settings: settings });

});

console.log('SERVER STARTED <' + server.version + '>');

// start the server loop
server.run();                                                                                                                                                                            