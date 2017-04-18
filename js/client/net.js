Net = {

    init: function() {

        // connect to server
        this.connection = io.connect('http://localhost:1337', { 'force new connection': true }); 

        this.on('helo', function(data) {

            console.log('Connected with server <' + data.version + '>');

            Events.emit('net.connected', data);

        }, this);

        this.on('error', function() {

            Events.emit('net.disconnected');

        });

    }, 

    input: function(data) {
        
        this.emit('input', data);

    }, 

    on: function(event, handler, context) {

        this.connection.on(event, function(data) {

            handler.call(context, data);

        });

    }, 

    emit: function(event, data) {

        this.connection.emit(event, data);

    }

}