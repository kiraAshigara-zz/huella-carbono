let DBClient = require('./db_client');

let UserService = {
    get: function (email, password, done) {
        let query = 'select * from usuario where correo="{0}" and contrasena="{1}"'.format(email, password);
        this.response(query, done);
    },
    getByEmail: function (email, done) {
        let query = 'select * from usuario where correo="{0}"'.format(email);
        this.response(query, done);
    },
    response: function (query, done) {
        DBClient.query(query, function (rows) {
            if (rows.length === 0) {
                done(undefined);
            } else {
                done(rows[0]);
            }
        });
    }
};

module.exports = UserService;