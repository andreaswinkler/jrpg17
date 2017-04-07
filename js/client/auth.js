var Auth = {

    user:  null, 

    init: function() {

        this.user = {
            name: 'Testuser'
        };

        Events.emit('user.loaded', this.user);

    }, 

    login: function(username, password) {

    }, 

    logout: function() {

    }

}