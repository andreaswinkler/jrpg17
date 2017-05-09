"use strict";

module.exports = function(utils, settings, player, game) {

    return {

        // the current version of the server
        // completely useless at the moment, but fun to have
        // is however returned to the client upon handshake
        version: '0.1-a',                            
        
        // the timestamp of a loop start
        tsLoopStart: null, 
        
        // here we store our loopTimeSampleCount samples
        loopTimeSamples: [], 
        
        // how many samples should we produce?
        loopTimeSampleCount: 100, 
        
        // here we count our server loops
        loopCount: 0, 
        
        // the timestamp of the last loop
        tsLastLoopStart: 0, 
        
        // the time in ms we wait before starting a new loop
        // let's do 10fps at the beginning [fps = 1000 / msLoop]
        msLoop: 33,  
        
        games: [], 

        /* RUN - SERVER-SIDE GAME LOOP
        *  here we run through all open games and 
        *  invoke their loops 
        */        
        run: function() {
        
            var that = this, 
                i, j, updates, clientMapKey, game, client;
        
            // sample the start timestamp
            this.tsLoopStart = +new Date();
        
            // make sure we waited long enough
            if (this.tsLastLoopStart + this.msLoop < this.tsLoopStart) {
            
                // walk through all games and invoke loop
                for (i = this.games.length; i--;) {

                    game = this.games[i];

                    updates = game.game.update(this.tsLoopStart - this.tsLastLoopStart);

                    // go through all clients and sent their updates
                    for (j = 0; j < game.clients.length; j++) {

                        client = game.clients[j];

                        clientMapKey = client.hero.map.key;
                        
                        if ((updates[clientMapKey] || []).length > 0) {

                            client.emit('update', updates[clientMapKey]);

                        }

                        if (this.tsLoopStart - client.player.saveTS > settings.autoSaveFrequencyMS) {

                            client.player.save();

                        }

                    }

                    if (this.tsLoopStart - this.games[i].game.lastActivityTimestamp > 60000) {

                        this.removeGame(this.games[i].game);

                        console.log('no activity. game destroyed. remaining: ' + this.games.length);

                    }

                }

                // store how long it took us to perform this loop
                this.loopTimeSamples[this.loopCount % this.loopTimeSampleCount] = (+new Date() - this.tsLoopStart);
                
                // one more active looop, yay!
                this.loopCount++;

                // remember this (active) loop start timestamp
                this.tsLastLoopStart = this.tsLoopStart;
            
            }
            
            // rinse and repeat
            setTimeout(function() { that.run() });
        
        }, 

        createGame: function(client) {

            client.game = game.create();
            client.player.hero.game = client.game;

            this.games.push({
                game: client.game, 
                clients: [client]
            });

        }, 

        removeGame: function(game) {
            
            var i;
            
            for (i = this.games.length; i--;) {

                if (this.games[i].game.id == game.id) {

                    this.games.splice(i, 1);

                }

            }

        }, 

        login: function(client, id) {

            client.player = player.create(id);
            client.hero = client.player.hero;

        }, 

        logout: function(client) {
            
            if (client.game) {

                this.removeGame(client.game);

            }
            
        }
    
    }

};
