(function () {

    var CHART = null;
    var hold = false;

    const updateDatesOnButtonClick = function (duration) {
        var startPicker = $('#session-start-picker');
        var stopPicker = $('#session-stop-picker');

        var startMoment = moment().startOf(duration);
        var stopMoment = moment().endOf(duration);
        startPicker.datetimepicker('date', startMoment);
        stopPicker.datetimepicker('date', stopMoment);
    };

    const getData = function () {
        var startPicker = $('#session-start-picker');
        var stopPicker = $('#session-stop-picker');

        var startMoment = startPicker.datetimepicker('date');
        var stopMoment = stopPicker.datetimepicker('date');
        var data = {
            start: startMoment.toDate().getTime(),
            stop: stopMoment.toDate().getTime()
        }

        return $.ajax({
            url: "/sessions",
            contentType: "text/html",
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            data: data,
            dataType: "json"
        }).then(function (result) {
            return {
                startMoment: startMoment,
                stopMoment: stopMoment,
                results: result
            };
        });
    };


    const initialState = function () {
        var startPicker = $('#session-start-picker');
        var stopPicker = $('#session-stop-picker');
        startPicker.datetimepicker({
            icons: {
                time: 'far fa-clock',
                date: 'far fa-calendar',
                up: 'fas fa-arrow-up',
                down: 'fas fa-arrow-down',
                previous: 'fas fa-chevron-left',
                next: 'fas fa-chevron-right',
                today: 'far fa-calendar-check',
                clear: 'fas fa-trash',
                close: 'fas fa-times'
            }
        });

        stopPicker.datetimepicker({
            useCurrent: false,
            icons: {
                time: 'far fa-clock',
                date: 'far fa-calendar',
                up: 'fas fa-arrow-up',
                down: 'fas fa-arrow-down',
                previous: 'fas fa-chevron-left',
                next: 'fas fa-chevron-right',
                today: 'far fa-calendar-check',
                clear: 'fas fa-trash',
                close: 'fas fa-times'
            }
        });

        updateDatesOnButtonClick('week');
        getData().then(function (result) {
            updateChart(result)
        })
    };

    const pageHandlers = function () {
        $("#this-week").on('change', function () {
            hold = true;
            updateDatesOnButtonClick('week');
            getData()
                .then(function (result) {
                    updateChart(result);
                    hold = false;
                });
        });
        $("#this-month").on('change', function () {
            hold = true;
            updateDatesOnButtonClick('month');
            getData()
                .then(function (result) {
                    updateChart(result);
                    hold = false;
                });
        });
        $("#this-year").on('change', function () {
            hold = true;
            updateDatesOnButtonClick('year');
            getData()
                .then(function (result) {
                    updateChart(result);
                    hold = false;
                });
        });


        var startPicker = $('#session-start-picker');
        var stopPicker = $('#session-stop-picker');

        startPicker.on('change.datetimepicker', function () {
            if (!hold) {
                getData()
                    .then(function (result) {
                        updateChart(result)
                        hold = false;
                    });
            }
        });

        stopPicker.on('change.datetimepicker', function () {
            if (!hold) {
                hold = true
                getData()
                    .then(function (result) {
                        updateChart(result)
                        hold = false;
                    });
            }
        });

    };


    const updateChart = function (results) {

        var diff = moment.duration(results.stopMoment.diff(results.startMoment)).abs();

        if (diff.asDays() <= 31) {
            updateChartDaysAsScale(results);
        } else {
            updateChartMonthsAsScale(results);
        }

    };

    const updateChartDaysAsScale = function (results) {
        const FORMAT = "dddd MMM DD YY"
        var labels = [];
        labelDataPairs = {};
        labels = [];
        data = [];
        day = results.startMoment;

        while (day.isSameOrBefore(results.stopMoment, 'day')) {
            var key = day.format(FORMAT);
            labels.push(key);
            labelDataPairs[key] = {day: day.clone(), total: 0};
            day.add(1, "days")
        }


        sessions = results.results;

        if (sessions && sessions.length > 0) {
            for (i = 0; i < sessions.length; i++) {
                session = sessions[i];
                var start = moment(session.start);
                labelDataPairs[start.format(FORMAT)].total += session.stop - session.start
            }
        }


        for (j = 0; j < labels.length; j++) {
            label = labels[j];
            data.push(moment.duration(labelDataPairs[label].total).abs().asHours());
        }

        return buildChart(labels, data);
    };


    const updateChartWeeksAsScale = function (results) {
        const FORMAT = "dddd MMM DD YY"
        var labels = [];
        var labelDataPairs = {};
        var labels = [];
        var data = [];
        var day = results.startMoment;

        while (day.isSameOrBefore(results.stopMoment, 'day')) {
            var key = day.format(FORMAT);
            labels.push(key);
            labelDataPairs[key] = {day: day.clone(), total: 0};
            day.add(1, "days")
        }


        var sessions = results.results;

        if (sessions && sessions.length > 0) {
            for (i = 0; i < sessions.length; i++) {
                session = sessions[i];
                var start = moment(session.start);
                labelDataPairs[start.format(FORMAT)].total += session.stop - session.start
            }
        }


        for (j = 0; j < labels.length; j++) {
            var label = labels[j];
            data.push(moment.duration(labelDataPairs[label].total).abs().asHours());
        }

        return buildChart(labels, data);

    };

    const updateChartMonthsAsScale = function (results, chart) {
        const FORMAT = "MMMM";
        var labels = [];
        var labelDataPairs = {};
        var labels = [];
        var data = [];
        var month = results.startMoment;

        while (month.isSameOrBefore(results.stopMoment, 'month')) {
            var key = month.format(FORMAT);
            labels.push(key);
            labelDataPairs[key] = {month: month.clone(), total: 0};
            month.add(1, "month")
        }


        var sessions = results.results;

        if (sessions && sessions.length > 0) {
            for (i = 0; i < sessions.length; i++) {
                session = sessions[i];
                var start = moment(session.start);
                labelDataPairs[start.format(FORMAT)].total += session.stop - session.start
            }
        }


        for (j = 0; j < labels.length; j++) {
            var label = labels[j];
            data.push(moment.duration(labelDataPairs[label].total).abs().asHours());
        }

        return buildChart(labels, data);

    };

    const buildChart = function (labels, data) {
        if (CHART) {
            CHART.destroy();
        }
        $("#data-chart-container").children("canvas").remove();
        var html = '<canvas id="data-chart" height="100%" width="100%"></canvas>'
        $("#data-chart-container").append(html);
        var ctx = document.getElementById("data-chart").getContext('2d');
        CHART = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Hours of Play",
                        data: data,
                        borderColor: "rgb(240,128,128)"

                    }],
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 12,
                                maxRotation: 90,
                                minRotation: 90
                            }
                        }]
                    }
                }


            }
        );

    };


    $(document).ready(function () {
        initialState();
        pageHandlers();
    });
})
();