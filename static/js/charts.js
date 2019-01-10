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
        var quickRanges = function (id, duration) {
            $("#" + id).on('change', function () {
                hold = true;
                updateDatesOnButtonClick(duration);
                getData()
                    .then(function (result) {
                        updateChart(result);
                        hold = false;
                    });
            });

        };

        quickRanges("today","day");
        quickRanges("this-week","week");
        quickRanges("this-month","month");
        quickRanges("this-year","year");


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

        if (diff.asHours() <= 48) {
            updateChartHoursAsScale(results)
        }
        else if (diff.asDays() <= 93) {
            updateChartDaysAsScale(results);
        } else {
            updateChartMonthsAsScale(results);
        }

    };


    const updateChartWithScale = function (FORMAT, duration, results) {
        var labelDataPairs = {};
        var labels = [];
        var data = [];
        var rangeStart = results.startMoment;

        while (rangeStart.isSameOrBefore(results.stopMoment, duration)) {
            var key = rangeStart.format(FORMAT);
            labels.push(key);
            labelDataPairs[key] = {total: 0};
            rangeStart.add(1, duration)
        }


        RESULTS = results
        var sessions = results.results;

        if (sessions && sessions.length > 0) {
            for (i = 0; i < sessions.length; i++) {
                var session = sessions[i];
                console.log(session)
                if (session.start && session.stop) {
                    console.log(session)
                    var endOfRange = moment(session.start).endOf(duration);
                    var start = moment(session.start);
                    var stop = moment(session.stop);

                    do {
                        var propName = start.format(FORMAT);
                        if (labelDataPairs.hasOwnProperty(propName)) {
                            console.log("start: " + labelDataPairs[start.format(FORMAT)].total)
                            if (endOfRange.isBefore(stop)) {
                                console.log(start.format(FORMAT))
                                labelDataPairs[start.format(FORMAT)].total += Math.abs(endOfRange.diff(start));
                                start.add(1, duration).startOf(duration);
                                endOfRange = start.clone().endOf(duration);
                            } else {
                                console.log(start.format(FORMAT))
                                labelDataPairs[start.format(FORMAT)].total += Math.abs(stop.diff(start));
                            }
                             console.log("end: " + labelDataPairs[start.format(FORMAT)].total)
                        } else {
                            start.add(1, duration).startOf(duration);
                            endOfRange = start.clone().endOf(duration);
                        }
                    } while (stop.isAfter(endOfRange));
                }
            }
        }


        for (j = 0; j < labels.length; j++) {
            var label = labels[j];
            data.push(moment.duration(labelDataPairs[label].total).abs().asHours());
        }

        DATA = data;
        LABEL = labels;

        return buildChart(labels, data);
    };

    const updateChartDaysAsScale = function (results) {
        const FORMAT = "dddd MMM DD YY";
        return updateChartWithScale(FORMAT, 'day', results)

    };

    const updateChartHoursAsScale = function (results) {
        const FORMAT = "ddd DD HH:MM:SS"
        return updateChartWithScale(FORMAT, 'hour', results);
    }

    const updateChartMonthsAsScale = function (results, chart) {
        const FORMAT = "MMMM";
        return updateChartWithScale(FORMAT, 'month', results);
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