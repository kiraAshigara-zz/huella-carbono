let DBClient = require('./db_client');

let TransporteService = {
    all: function (done) {
        let query = 'select * from transporte';
        this.response(query, done);
    },
    insertViajes: function (viajes, done) {
        let query = 'INSERT INTO viaje (cod_usuario,cod_transporte,fecha,kilometros,kg_co2) VALUES {0}';
        let values = [];

        for (let item of viajes) {
            values.push('("{0}","{1}","{2}",{3},{4})'.format(item.cod_usuario, item.cod_transporte, item.fecha, item.kilometros, item.kg_co2));
        }

        this.response(query.format(values.join(',')), done);
    },
    response: function (query, done) {
        DBClient.query(query, function (rows) {
            return done(rows);
        });
    }
};

module.exports = TransporteService;