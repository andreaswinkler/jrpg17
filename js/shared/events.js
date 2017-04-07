(function() {

    var events = {

        handlers: {}, 

        on: function(event, handler) {

            if (!this.handlers[event]) {

                this.handlers[event] = [];

            }

            this.handlers[event].push(handler);

        }, 

        emit: function(event, data) {

            console.log('Events.emit', event, data);

            if (this.handlers[event]) {

                this.handlers[event].map(function(e) { e.call(e, data); });
            
            }

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = events;

    } else {

        window.Events = events;

    }

})();