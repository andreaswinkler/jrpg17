"use strict";

module.exports = function(fs, utils, creatureFactory) {

    return {
    
        // create a player
        create: function(id) {
            
            var path = './../../data/players/' + id + '.json', 
                player;

            delete require.cache[require.resolve(path)]
            
            player = require(path);
            
            player.hero = creatureFactory.create('hero', player.hero);

            player.saveTS = +new Date();
            
            player.pack = function() {

                return utils.pack(player);

            };

            player.save = function() {

                fs.writeFile('./../data/players/' + this.id + '.json', JSON.stringify(this.pack()), function(err) {

                    if (err) {

                        console.log('player data could not be saved', err);

                    }

                });

            };

            return player;
        
        }

    }

};