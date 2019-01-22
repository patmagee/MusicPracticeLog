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

        quickRanges("today", "day");
        quickRanges("this-week", "week");
        quickRanges("this-month", "month");
        quickRanges("this-year", "year");


        var startPicker = $('#session-start-picker');
        var stopPicker = $('#session-stop-picker');

        startPicker.on('change.datetimepicker', function () {
            if (!hold) {
                getData()
                    .then(function (result) {
                        updateChart(result);
                        hold = false;
                    });
            }
        });

        stopPicker.on('change.datetimepicker', function () {
            if (!hold) {
                hold = true;
                getData()
                    .then(function (result) {
                        updateChart(result);
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


    class DateRange {

        constructor(startMoment, endMoment, duration, FORMAT) {
            this.duration = duration;
            this.FORMAT = FORMAT;
            this.originalStart = startMoment.clone();
            this.originalEnd = endMoment.clone();

            this.buildRanges();
        }
    }

    DateRange.prototype.buildRanges = function () {
        this.bins = [];
        var order = 0;
        var rangeStart = this.originalStart.clone();
        rangeStart.startOf(this.duration);

        var rangeStop = this.originalEnd.clone();
        rangeStop.endOf(this.duration);

        while (rangeStart.isSameOrBefore(rangeStop, this.duration)) {
            var label = rangeStart.format(this.FORMAT);

            var bin = {
                order: order,
                label: label,
                total: 0,
                start: rangeStart.clone()
            };

            rangeStart.add(1, this.duration);
            bin["stop"] = rangeStart.clone();
            order += 1;
            this.bins.push(bin);
        }
    };

    DateRange.prototype.addSessionToBin = function (session) {
        if (session.start && session.stop) {
            var endOfRange = moment(session.start);
            endOfRange = endOfRange.endOf(this.duration);
            var startMoment = moment(session.start);
            var stopMoment = moment(session.stop);


            if (startMoment.isBefore(this.originalStart)) {
                startMoment = this.originalStart.clone();
                endOfRange = startMoment.clone();
                endOfRange.endOf(this.duration)
            }


            var count = 0;
            do {
                var bin = this.findBin(startMoment);
                if (bin) {
                    if (bin.stop.isSameOrAfter(stopMoment)) {
                        bin.total += Math.abs(stopMoment.diff(startMoment));
                        return;
                    } else {
                        bin.total += Math.abs(endOfRange.diff(startMoment));
                        startMoment.add(1, this.duration);
                        startMoment.startOf(this.duration);
                        endOfRange = startMoment.clone();
                    }
                } else {
                    startMoment.add(1, this.duration);
                    startMoment.startOf(this.duration);
                    endOfRange = startMoment.clone();
                }
                count += 1;
            }
            while (endOfRange.isBefore(stopMoment) && count < 10)
        }
    };


    DateRange.prototype.findBin = function (startMoment) {

        for (var i = 0; i < this.bins.length; i++) {
            var bin = this.bins[i];
            if (startMoment.isSameOrAfter(bin.start) && startMoment.isBefore(bin.stop)) {
                return bin;
            }
        }
    };


    DateRange.prototype.getLabels = function () {
        var labels = [];
        for (var i = 0; i < this.bins.length; i++) {
            labels.push(this.bins[i].label);
        }
        return labels;

    };

    DateRange.prototype.getData = function () {
        var data = [];
        for (var i = 0; i < this.bins.length; i++) {
            data.push(moment.duration(this.bins[i].total).abs().asMinutes());
        }
        return data;
    };

    DateRange.prototype.getSum = function () {
        var sum = 0;
        for (var i = 0; i < this.bins.length; i++) {
            sum += Math.abs(this.bins[i].total);
        }

        return moment.duration(sum).abs().asMinutes();
    };


    const updateChartWithScale = function (FORMAT, duration, results) {
        var dateRange = new DateRange(results.startMoment, results.stopMoment, duration, FORMAT);
        var sessions = results.results;
        if (sessions && sessions.length > 0) {
            for (var i = 0; i < sessions.length; i++) {
                var session = sessions[i];
                dateRange.addSessionToBin(session);
            }
        }
        $("#totaltime").text(Math.round(dateRange.getSum()) + " min");
        return buildChart(dateRange.getLabels(), dateRange.getData());
    };

    const updateChartDaysAsScale = function (results) {
        const FORMAT = "dddd MMM DD YY";
        return updateChartWithScale(FORMAT, 'day', results)

    };

    const updateChartHoursAsScale = function (results) {
        const FORMAT = "hh:mm A";
        return updateChartWithScale(FORMAT, 'hour', results);
    };

    const updateChartMonthsAsScale = function (results, chart) {
        const FORMAT = "MMMM";
        return updateChartWithScale(FORMAT, 'month', results);
    };

    const buildChart = function (labels, data) {
        if (CHART) {
            CHART.destroy();
        }
        $("#data-chart-container").children("canvas").remove();
        var html = '<canvas id="data-chart" height="100%" width="100%"></canvas>';
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