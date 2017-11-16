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
    getRecomendaciones: function (userId, done) {
        let query = 'SELECT recomendacion.num, recomendacion.descripcion,recomendacion.tipo,asignacion.fecha ' +
            'FROM asignacion ' +
            'INNER JOIN recomendacion ON asignacion.num_recomendacion=recomendacion.num where asignacion.cod_usuario="{0}";';
        DBClient.query(query.format(userId), function (rows) {
            let temp = {
                consumo: [],
                viaje: []
            };

            for (let item of rows) {
                temp[item.tipo].push(item);
            }

            done(temp);
        });
    },
    getArboles: function (userId, done) {
        const query = 'SELECT (SELECT SUM(kg_co2) FROM viaje where cod_usuario={0}) + (SELECT SUM(kg_co2) FROM consumo where cod_usuario={0}) as total_kg';
        this.response(query.format(userId), function (total) {
            if (total) {
                done({
                    total: (total.total_kg / 90) >> 0
                });
            } else {
                done({
                    total: 0
                });
            }
        });
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