let DBClient = require('./db_client');

let ElectrodomesticoService = {
    all: function (done) {
        let query = 'select * from electrodomestico';
        this.response(query, done);
    },
    insertConsumos: function (consumos, done) {
        let query = 'INSERT INTO consumo (cod_usuario,cod_electro,fecha,horasdeUso,totalCo) VALUES {0}';
        let values = [];

        for (let item of consumos) {
            values.push('("{0}","{1}","{2}",{3},{4})'.format(item.cod_usuario, item.cod_electro, item.fecha, item.horasdeUso, item.totalCo));
        }

        this.response(query.format(values.join(',')), done);
    },
    response: function (query, done) {
        DBClient.query(query, function (rows) {
            done(rows);
        });
    }
};

module.exports = ElectrodomesticoService;