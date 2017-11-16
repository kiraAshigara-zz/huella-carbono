let express = require('express');
let router = express.Router();

let UserService = require('../db/user_service');

function getUser(email, password, done) {
    UserService.get(email, password, done);
}

function checkAuthentication(req, res, next) {
    let user_logged = req.cookies['user_logged'];
    let email = req.cookies['email'];

    if (user_logged && email) {
        UserService.getByEmail(email, function (user) {
            if (user) {
                req.user = user;
                next();
            } else {
                res.redirect('/');
            }
        });
    } else {
        res.redirect('/');
    }
}

function loginUser(req, res, next) {
    let user = {
        email: req.body.email,
        password: req.body.password
    };

    getUser(user.email, user.password, function (_user) {
        if (_user) {
            res.cookie('email', _user.correo);
            res.cookie('user_logged', true);

            res.redirect('/huella_carbono');
        } else {
            res.render('login', {
                error: 'Invalid Email or Password'
            });
        }
    });
}

/* Huella Carbono Login Page*/
router.get('/', function (req, res, next) {
    res.render('login');
});

router.post('/', function (req, res, next) {
    loginUser(req, res, next);
    //res.render('login', {title: 'Express'});
});

router.get('/huella_carbono', checkAuthentication, function (req, res, next) {
    res.render('index', {
        user: req.user
    });
});

/* Mini Api */
let ElectrodomesticoService = require('../db/electrodomestico_service');
let TransporteService = require('../db/transporte_service');

router.get('/api/electrodomesticos', function (req, res, next) {
    ElectrodomesticoService.all(function (response) {
        res.json(response);
    });
});

router.get('/api/transportes', function (req, res, next) {
    TransporteService.all(function (response) {
        res.json(response);
    });
});

let dateFormat = require('dateformat');

router.post('/api/consumo', function (req, res, next) {
    let consumos = req.body;

    ElectrodomesticoService.insertConsumos(consumos, function (response) {
        res.send();
    });
});

router.post('/api/viaje', function (req, res, next) {
    let viajes = req.body;

    TransporteService.insertViajes(viajes, function (response) {
        res.send();
    });
});

router.get('/api/users/:userId/recomendaciones', function (req, res, next) {
    const userId = req.params.userId;

    UserService.getRecomendaciones(userId, function (recomendaciones) {
        res.json(recomendaciones);
    });
});

router.get('/api/users/:userId/arboles', function (req, res, next) {
    const userId = req.params.userId;

    UserService.getArboles(userId, function (arboles) {
        res.json(arboles);
    });
});

const GraficaService = require('../db/grafica_service');

router.get('/api/grafica/consumo/:userId/:date', function (req, res, next) {
    const userId = req.params.userId;
    const date = req.params.date;

    GraficaService.consumo(userId, date, function (data) {
        res.json(data);
    });
});

router.get('/api/grafica/viaje/:userId/:date', function (req, res, next) {
    const userId = req.params.userId;
    const date = req.params.date;

    GraficaService.viaje(userId, date, function (data) {
        res.json(data);
    });
});

router.get('/api/grafica/ciudades', function (req, res, next) {
    GraficaService.ciudades(function (data) {
        res.json(data);
    });
});

router.get('/api/grafica/ano/:userId', function (req, res, next) {
    const userId = req.params.userId;

    GraficaService.ano(userId, function (data) {
        res.json(data);
    });
});

module.exports = router;
