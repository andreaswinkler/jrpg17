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
    components = require('./../js/shared/components.js'), 
    itemFactory = require('./../js/server/itemFactory.js')(utils, settings, items), 
    creatureFactory = require('./../js/server/creatureFactory.js')(utils, settings, creatures, components, inventory, itemFactory),
    mapFactory = require('./../js/server/mapFactory.js')(fs, utils, settings, creatureFactory),  
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

        client.hero.inputs.push({ key: 'grabItem', data: data });

    });

    client.on('placeItem', function(data) {

        client.hero.inputs.push({ key: 'placeItem', data: data });

    });

    client.on('equipItem', function(data) {

        client.hero.inputs.push({ key: 'equipItem', data: data });

    });

    client.on('unequipItem', function(data) {

        client.hero.inputs.push({ key: 'unequipItem', data: data });

    });

    client.on('sellItem', function(data) {

        client.hero.inputs.push({ key: 'sellItem', data: data });

    });

    client.on('buyItem', function(data) {

        client.hero.inputs.push({ key: 'buyItem', data: data });

    });

    client.emit('helo', { version: server.version, player: client.player.pack(), settings: settings });

});

console.log('SERVER STARTED <' + server.version + '>');

// start the server loop
server.run();                                                                                                                                                                            