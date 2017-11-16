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
        $('.tab-graficas').click(loadGraficas);
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

    function loadGraficas() {
        setTimeout(function () {
            google.charts.load('current', {'packages': ['bar', 'corechart']});
            google.charts.setOnLoadCallback(drawChart);
        }, 30);
    }

    function drawChart() {
        drawChartBarDonutConsumoViaje();
    }

    function drawChartBarDonutConsumoViaje() {
        var date = moment().format('YYYY-MM-DD');

        $.ajax({
            url: '/api/grafica/consumo/{0}/{1}'.format(userId, date),
            dataType: 'json'
        }).done(function (dataConsumo) {
            $.ajax({
                url: '/api/grafica/viaje/{0}/{1}'.format(userId, date),
                dataType: 'json'
            }).done(function (dataViaje) {
                $.ajax({
                    url: '/api/grafica/ciudades',
                    dataType: 'json'
                }).done(function (dataCiudades) {
                    $.ajax({
                        url: '/api/grafica/ano/{0}'.format(userId),
                        dataType: 'json'
                    }).done(function (dataAno) {
                        var data = [['CO2', 'Electrodo...', 'Transporte']];
                        var temp = {};
                        var fecha;
                        var totalConsumo = 0;
                        var totalViaje = 0;

                        $.each(dataConsumo, function (i, item) {
                            fecha = moment(item.fecha).format('YYYY-MM-DD');
                            temp[fecha] = {
                                consumo: item.total
                            };
                            totalConsumo += item.total;
                        });

                        $.each(dataViaje, function (i, item) {
                            fecha = moment(item.fecha).format('YYYY-MM-DD');

                            if (temp[fecha]) {
                                temp[fecha].viaje = item.total;
                            } else {
                                temp[fecha] = {
                                    consumo: 0,
                                    viaje: item.total
                                };
                            }
                            totalViaje += item.total;
                        });

                        $.each(temp, function (key, value) {
                            data.push([
                                key,
                                value.consumo,
                                value.viaje
                            ]);
                        });

                        paintChartBarConsumoViaje(data);
                        paintChartDonutConsumoViaje([
                            ['Name', 'Value'],
                            ['Electrodomesticos', totalConsumo],
                            ['Transporte', totalViaje]
                        ]);
                        paintChartBubbleCiudades(dataCiudades);
                        paintChartDonutConsumoViajeAno([
                            ['Name', 'Value'],
                            ['Electrodomesticos', dataAno[1].total],
                            ['Transporte', dataAno[0].total]
                        ]);
                    }).fail(function (error) {
                        console.error(error);
                    });
                }).fail(function (error) {
                    console.error(error);
                });
            }).fail(function (error) {
                console.error(error);
            });
        }).fail(function (error) {
            console.error(error);
        });
    }

    function paintChartDonutConsumoViaje(_data) {
        var data = google.visualization.arrayToDataTable(_data);

        var options = {
            title: 'Total Electrodomesticos y Transporte',
            pieHole: 0.4,
        };

        var chart = new google.visualization.PieChart(document.getElementById('grafico-donut-consumo-viaje'));
        chart.draw(data, options);
    }

    function paintChartBarConsumoViaje(_data) {
        var data = google.visualization.arrayToDataTable(_data);

        var options = {
            chart: {
                title: 'Generacion de CO2',
                subtitle: 'Generacion de gases de efecto invernadero',
            },
            bars: 'vertical' // Required for Material Bar Charts.
        };

        var chart = new google.charts.Bar(document.getElementById('grafico-bar-consumo-viaje'));

        chart.draw(data, google.charts.Bar.convertOptions(options));
    }

    function paintChartBubbleCiudades(_data) {
        var temp = [['ID', 'Area(m2)', 'Poblacion', 'Pais', 'EmisionPromedio']];

        $.each(_data, function (i, item) {
            temp.push([item.nombre.substring(0, 3).toUpperCase(), item.area, item.poblacion, item.pais, item.emisionPromedio]);
        });

        var data = google.visualization.arrayToDataTable(temp);

        var options = {
            title: 'Relacion entre emision y poblacion',
            hAxis: {title: 'Area(m2)'},
            vAxis: {title: 'Poblacion'},
            bubble: {textStyle: {fontSize: 11}}
        };

        var chart = new google.visualization.BubbleChart(document.getElementById('grafico-bubble-ciudades'));
        chart.draw(data, options);
    }

    function paintChartDonutConsumoViajeAno(_data) {
        var data = google.visualization.arrayToDataTable(_data);

        var options = {
            title: '%CO2 Anual',
            pieHole: 0.4,
        };

        var chart = new google.visualization.PieChart(document.getElementById('grafico-donut-ano'));
        chart.draw(data, options);
    }

    return {
        init: init
    };

})();

$(document).ready(function () {
    Interface.init($('[user-id]').attr('user-id'));
});