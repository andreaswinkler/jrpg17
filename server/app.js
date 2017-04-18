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
    game = require('./../js/server/game.js')(fs, settings),  
    components = require('./../js/shared/components.js'), 
    creatureFactory = require('./../js/server/creatureFactory.js')(creatures, components);

app.listen(1337);

io.on('connection', function(client) {

    console.log('somebody connected, yay!');
    server.games = [];

    client.player = { name: 'abc', hero: creatureFactory.create('hero') };
    client.player.hero.x = 1600;
    client.player.hero.y = 1600;

    client.on('disconnect', function() {

        console.log('We lost a client.');

    });

    client.on('createGame', function() {

        client.game = game.create();
        client.game.clients.push(client);

        server.games.push(client.game);

        client.game.changeMap('village');
        client.game.map.creatures.push(client.player.hero);

        client.emit('gameCreated', { game: client.game.pack() });

    });

    client.on('input', function(data) {

        if (client.game) {

            client.game.onInput(data, client.player.hero);

        }

    });

    client.emit('helo', { version: server.version, player: client.player, settings: settings });

});

console.log('SERVER STARTED <' + server.version + '>');

// start the server loop
server.run();                                                                                                                                                                              