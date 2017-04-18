"use strict";

module.exports = function() {

    return {

        // the current version of the server
        // completely useless at the moment, but fun to have
        // is however returned to the client upon handshake
        version: '0.1-a', 
        
        /* INPUT
        *  we handle an input (click, keypress) from the client
        */
        input: function(event, socket, data) {
        
            // let's store the input on the hero entity so we can 
            // process it in the next loop
            // data contains key, x, y
            socket.player.inputs.unshift(data);
        
        },                              
        
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
        msLoop: 100,  
        
        games: [], 

        /* RUN - SERVER-SIDE GAME LOOP
        *  here we run through all open games and 
        *  invoke their loops 
        */        
        run: function() {
        
            var that = this, 
                i, updates;
        
            // sample the start timestamp
            this.tsLoopStart = +new Date();
        
            // make sure we waited long enough
            if (this.tsLastLoopStart + this.msLoop < this.tsLoopStart) {
            
                // walk through all games and invoke loop
                // there shouldn't be too many games in the beginning so we dont't
                // care _.each is more expansive than a loop
                for (i = 0;  i < this.games.length; i++) {

                    this.games[i].update(this.tsLoopStart - this.tsLastLoopStart);

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
        
        }
    
    }

};
