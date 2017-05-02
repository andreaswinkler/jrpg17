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

                return utils.pack(this);

            };

            player.save = function() {

                var id = this.id, 
                    packedPlayer = this.pack(), 
                    that = this;
                
                packedPlayer.hero.droppedItems = null;
                packedPlayer.hero.activeNpc = null;
                that.saveTS = +new Date();

                fs.writeFile('./../data/players/' + id + '-latest.json', JSON.stringify(packedPlayer), function(err) {

                    if (err) {

                        console.log('player data could not be saved', err);

                    } else {

                        fs.rename('./../data/players/' + id + '-latest.json', './../data/players/' + id + '.json', function(err) {

                            if (err) {
                            }

                            that.saveTS = +new Date();

                        });

                    }

                });

            };

            return player;
        
        }

    }

};