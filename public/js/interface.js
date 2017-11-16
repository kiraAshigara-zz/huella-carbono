String.prototype.format = function () {
    var formatted = this, i, size = arguments.length;
    for (i = 0; i < size; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

var Interface = (function () {

    var userId;

    function init(_userId) {
        userId = _userId;
        registerEvents();
        initializeDatePickers();
        loadElectrodomesticos();
        loadTransportes();
        loadRecomendaciones();
    }

    function registerEvents() {
        $('.logout-user').click(logoutUser);
        $('.save-electrodomesticos-form').click(saveElectrodomesticosForm);
        $('.save-transportes-form').click(saveTransportesForm);
    }

    function initializeDatePickers() {
        $('.datepicker').attr('data-value', moment().format('YYYY-MM-DD'));

        $('.datepicker').pickadate({
            format: 'yyyy-mm-dd',
            selectMonths: true,
            selectYears: 15,
            today: 'Today',
            clear: '',
            close: 'Ok',
            closeOnSelect: false
        });
    }

    function logoutUser() {
        deleteCookie('user_logged');
        window.location.href = '/';
    }

    function deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    var inputElectrodomesticosTemplate = '<div class="input-field col s12 m6 l6">' +
        '<input value="0" electro-id="{0}" id="electro_{0}" type="number" min="0" class="custom-input">' +
        '<label class="active truncate" for="electro_{0}">{0} - {1} {2} - {3} - Horas</label>' +
        '</div>';

    var inputTransportesTemplate = '<div class="input-field col s12 m6 l6">' +
        '<input value="0" transporte-id="{0}" id="transporte_{0}" type="number" min="0" class="custom-input">' +
        '<label class="active truncate" for="transporte_{0}">{0} - {1} {2} - {3} - Kilometros</label>' +
        '</div>';

    function loadElectrodomesticos() {
        $.ajax({
            url: '/api/electrodomesticos',
            dataType: 'json'
        }).done(function (electrodomesticos) {
            $('.list-inputs-electrodomesticos').empty();
            var itemDOM;

            $.each(electrodomesticos, function (i, item) {
                itemDOM = $(inputElectrodomesticosTemplate.format(
                    item.codigo,
                    item.nombreGenerico,
                    item.nombreReal,
                    item.marca
                ));

                itemDOM.find('[electro-id]').data('co-data', item);

                $('.list-inputs-electrodomesticos').append(itemDOM);
            });
        }).fail(function (error) {
            console.error(error);
        });
    }

    function loadTransportes() {
        $.ajax({
            url: '/api/transportes',
            dataType: 'json'
        }).done(function (transportes) {
            $('.list-inputs-transportes').empty();
            var itemDOM;

            $.each(transportes, function (i, item) {
                itemDOM = $(inputTransportesTemplate.format(
                    item.codigo,
                    item.nombreGenerico,
                    item.nombreReal,
                    item.marca
                ));

                itemDOM.find('[transporte-id]').data('co-data', item);

                $('.list-inputs-transportes').append(itemDOM);
            });
        }).fail(function (error) {
            console.error(error);
        });
    }

    function loadRecomendaciones() {
        $.ajax({
            url: '/api/users/{0}/recomendaciones'.format(userId),
            dataType: 'json'
        }).done(function (recomendaciones) {
            var template = '<div class="chip">{0}</div>';
            $('.recomendaciones-electro,.recomendaciones-transporte').empty();

            $.each(recomendaciones.consumo, function (i, item) {
                $('.recomendaciones-electro').append(template.format(item.descripcion));
            });

            $.each(recomendaciones.viaje, function (i, item) {
                $('.recomendaciones-transporte').append(template.format(item.descripcion));
            });

            loadArboles();
        }).fail(function (error) {
            console.error(error);
        });
    }

    function loadArboles() {
        $.ajax({
            url: '/api/users/{0}/arboles'.format(userId),
            dataType: 'json'
        }).done(function (arboles) {
            $('.total-arboles').text(arboles.total);
        }).fail(function (error) {
            console.error(error);
        });
    }

    function calculateElectroCo2(item, data) {
        //# of items x watts x .001 kW x hrs used x 0.354224 kg CO2e = kg CO2e  watt day kWh day
        return (1 * data.watts * item.horasdeUso * data.factor_kgc02).toFixed(3);
    }

    function saveElectrodomesticosForm() {
        var inputList = $('.list-inputs-electrodomesticos [electro-id]');
        var json = [];
        var temp;

        $.each(inputList, function (i, item) {
            if ($(item).val().trim() !== '' && parseInt($(item).val().trim()) > 0) {
                temp = {
                    cod_usuario: userId,
                    cod_electro: $(item).attr('electro-id'),
                    horasdeUso: parseInt($(item).val().trim()),
                    fecha: $('#date-electro').val()
                };

                temp.kg_co2 = calculateElectroCo2(temp, $(item).data('co-data'));

                console.log(temp);
                json.push(temp);
            }
        });

        if (json.length > 0) {
            $.ajax({
                type: 'POST',
                url: '/api/consumo',
                data: JSON.stringify(json),
                contentType: 'application/json'
            }).done(function () {
                swal({
                    title: 'Listo',
                    text: 'Tus horas han sido guardadas en nuestra base de datos!',
                    type: 'success'
                }).then(function () {
                    $('.list-inputs-electrodomesticos [electro-id]').val('0');
                });

                loadRecomendaciones();
            }).fail(function (error) {
                console.error(error);
            });
        } else {
            swal('Oops', 'No has introducido ninguna hora intentemoslo de nuevo!', 'warning');
        }
    }

    function calculateTransporteCo2(item, data) {
        //x miles x 0.40935 kg CO2e x 1 month x 1 week = kg CO2e month mile 4 weeks 7 days day
        return (item.kilometros * data.factor_kgco2 * 1).toFixed(3);
    }

    function saveTransportesForm() {
        var inputList = $('.list-inputs-transportes [transporte-id]');
        var json = [];
        var temp;

        $.each(inputList, function (i, item) {
            if ($(item).val().trim() !== '' && parseInt($(item).val().trim()) > 0) {
                temp = {
                    cod_usuario: userId,
                    cod_transporte: $(item).attr('transporte-id'),
                    kilometros: parseInt($(item).val().trim()),
                    fecha: $('#date-transporte').val()
                };

                temp.kg_co2 = calculateTransporteCo2(temp, $(item).data('co-data'));

                console.log(temp);
                json.push(temp);
            }
        });

        if (json.length > 0) {
            $.ajax({
                type: 'POST',
                url: '/api/viaje',
                data: JSON.stringify(json),
                contentType: 'application/json'
            }).done(function () {
                swal({
                    title: 'Listo',
                    text: 'Tus kilometros han sido guardados en nuestra base de datos!',
                    type: 'success'
                }).then(function () {
                    $('.list-inputs-transportes [transporte-id]').val('0');
                });
                loadRecomendaciones();
            }).fail(function (error) {
                console.error(error);
            });
        } else {
            swal('Oops', 'No has introducido ningun kilometro intentemoslo de nuevo!', 'warning');
        }
    }

    return {
        init: init
    };

})();

$(document).ready(function () {
    Interface.init($('[user-id]').attr('user-id'));
});