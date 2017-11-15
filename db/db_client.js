let mysql = require('mysql');
let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dev',
    database: 'huella_carbono'
});

connection.connect();

let DBClient = {
    query: function (query, done) {
        connection.query(query, function (err, rows, fields) {
            if (err) {
                throw err
            }

            done(rows);
        });
    }
};

module.exports = DBClient;