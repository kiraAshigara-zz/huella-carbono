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
        loadElectrodomesticos();
        loadTransportes();
    }

    function registerEvents() {
        $('.logout-user').click(logoutUser);
        $('.save-electrodomesticos-form').click(saveElectrodomesticosForm);
        $('.save-transportes-form').click(saveTransportesForm);
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

                itemDOM.data('co-data', item);

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

                itemDOM.data('co-data', item);

                $('.list-inputs-transportes').append(itemDOM);
            });
        }).fail(function (error) {
            console.error(error);
        });
    }

    function saveElectrodomesticosForm() {
        var inputList = $('.list-inputs-electrodomesticos [electro-id]');
        var json = [];

        $.each(inputList, function (i, item) {
            if ($(item).val().trim() !== '' && parseInt($(item).val().trim()) > 0) {
                json.push({
                    cod_usuario: userId,
                    cod_electro: $(item).attr('electro-id'),
                    horasdeUso: parseInt($(item).val().trim())
                });
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
            }).fail(function (error) {
                console.error(error);
            });
        } else {
            swal('Oops', 'No has introducido ninguna hora intentemoslo de nuevo!', 'warning');
        }
    }

    function saveTransportesForm() {
        var inputList = $('.list-inputs-transportes [transporte-id]');
        var json = [];

        $.each(inputList, function (i, item) {
            if ($(item).val().trim() !== '' && parseInt($(item).val().trim()) > 0) {
                json.push({
                    cod_usuario: userId,
                    cod_transporte: $(item).attr('transporte-id'),
                    kilometros: parseInt($(item).val().trim())
                });
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