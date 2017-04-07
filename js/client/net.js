Net = {

    init: function() {



    }, 

    send: function(event, data) {

        console.log('Net.send', event, data);

    }, 

    receive: function(event, data) {

        console.log('Net.receive', event, data);

    }

}