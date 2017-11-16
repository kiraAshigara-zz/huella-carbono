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
        this.insertAsignacion(viajes);
    },
    insertAsignacion: function (consumos) {
        const query = 'select * from recomendacion where tipo="viaje" and consumo_kg_co2<=(SELECT sum(kg_co2) FROM viaje where cod_usuario={0} and fecha = "{1}")';
        const userId = consumos[0].cod_usuario;
        const date = consumos[0].fecha;
        let that = this;

        this.response(query.format(userId, date), function (recomendaciones) {
            const query = 'INSERT INTO asignacion (num_recomendacion,cod_usuario,estado,fecha,numero_arboles) VALUES ({0},"{1}","{2}","{3}",{4})';

            for (let item of recomendaciones) {
                that.response(query.format(item.num, userId, 'activada', date, 0), function (res) {
                    console.log('Asignacion actualizada');
                }, function (error) {
                });
            }
        });
    },
    response: function (query, done, fail) {
        DBClient.query(query, function (rows) {
            return done(rows);
        }, fail);
    }
};

module.exports = TransporteService;