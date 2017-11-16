let DBClient = require('./db_client');

let GraficaService = {
    consumo: function (userId, date, done) {
        const consumo = 'SELECT sum(kg_co2) as total, fecha FROM consumo ' +
            'where cod_usuario= {0} ' +
            'and fecha <= "{1}" ' +
            'GROUP BY fecha ' +
            'order by fecha;';

        this.response(consumo.format(userId, date), done);
    },
    viaje: function (userId, date, done) {
        const viaje = 'SELECT sum(kg_co2) as total, fecha FROM viaje ' +
            'where cod_usuario={0} ' +
            'and fecha <= "{1}" ' +
            'GROUP BY fecha ' +
            'order by fecha;';

        this.response(viaje.format(userId, date), done);
    },
    ciudades: function (done) {
        const ciudades = 'select nombre, emisionPromedio,pais,poblacion,area from ciudad;';
        this.response(ciudades, done);
    },
    ano: function (userId, done) {
        const ano = 'SELECT sum(kg_co2) as total FROM viaje ' +
            'where fecha>"2016-12-31" and fecha<"2018-01-01" and cod_usuario={0} ' +
            'union ' +
            'SELECT sum(kg_co2) as total FROM consumo ' +
            'where fecha>"2016-12-31" and fecha<"2018-01-01" and cod_usuario={0};';
        this.response(ano.format(userId), done);
    },
    response: function (query, done, fail) {
        DBClient.query(query, function (rows) {
            return done(rows);
        }, fail);
    }
};

module.exports = GraficaService;