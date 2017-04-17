(function() {

    var events = {

        handlers: {}, 

        on: function(event, handler, context) {

            if (!this.handlers[event]) {

                this.handlers[event] = [];

            }

            this.handlers[event].push({ handler: handler, context: context });

        }, 

        emit: function(event, data) {

            console.log('Events.emit', event, data);

            if (this.handlers[event]) {

                this.handlers[event].map(function(e) { e.handler.call(e.context, data); });
            
            }

        }

    };

    if (typeof module != 'undefined' && module.exports) {

        module.exports = events;

    } else {

        window.Events = events;

    }

})();