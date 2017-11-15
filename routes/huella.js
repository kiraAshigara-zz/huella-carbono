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

var dateFormat = require('dateformat');

router.post('/api/consumo', function (req, res, next) {
    let consumos = req.body;
    let timeFormated = dateFormat(new Date(), 'yyyy-mm-dd');

    for (let i = 0, size = consumos.length; i < size; i++) {
        consumos[i]['fecha'] = timeFormated;
        consumos[i]['totalCo'] = 30;
    }

    ElectrodomesticoService.insertConsumos(consumos, function (response) {
        res.send();
    });
});

router.post('/api/viaje', function (req, res, next) {
    let viajes = req.body;
    let timeFormated = dateFormat(new Date(), 'yyyy-mm-dd');

    for (let i = 0, size = viajes.length; i < size; i++) {
        viajes[i]['fecha'] = timeFormated;
        viajes[i]['totalCo'] = 30;
    }

    TransporteService.insertViajes(viajes, function (response) {
        res.send();
    });
});

module.exports = router;
