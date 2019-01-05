(function () {

        const parseData = function () {
            let data = {};

            var start = $("#session-start-picker").datetimepicker("date");
            if (start !== undefined && $("#session-start").attr("dirty")) {
                data.start = start.toDate().getTime();
            }

            var stop = $("#session-stop-picker").datetimepicker("date");
            if (stop !== undefined && $("#session-stop").attr("dirty")) {
                data.stop = stop.toDate().getTime();
            }

            data.notes = $("#session-notes").val();
            data.warmed_up = $("#warm-up").hasClass("active");

            if ($("#song-list").attr("dirty")) {
                songs = [];
                $("#song-list").children("li").each(function () {
                    songs.push($(this).text())
                });
                data.songs = songs.reverse()
            }

            return data;

        };


        const updateTime = function () {
            let header = $("#sessiontime");
            let state = $("#data-row").data("state");
            if (state === "update") {
                var stopMoment = $('#session-stop-picker').datetimepicker('date')
                var startMoment = $('#session-start-picker').datetimepicker('date');

                if (stopMoment && startMoment) {
                    var ms = stopMoment.diff(startMoment);
                    var d = moment.duration(ms);
                    var s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
                    header.text(s);
                } else {
                    header.text("--:--:--");
                }
            }
        };

        const alertMessage = function (message, type) {
            var html = `
                <div class="alert alert-${type}">
                    ${message}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                `;
            $("#alert-center").html(html)
        }

        const sharedHandlers = function () {
            $('#session-start-picker').datetimepicker({
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
            $('#session-stop-picker').datetimepicker({
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
            $("#session-start-picker").on("change.datetimepicker", function (e) {
                $("#session-start").attr("dirty", true);
                $('#session-stop-picker').datetimepicker('minDate', e.date);
                updateTime();
            });
            $("#session-stop-picker").on("change.datetimepicker", function (e) {
                $("#session-stop").attr("dirty", true);
                $('#session-start-picker').datetimepicker('maxDate', e.date);
                updateTime();
            });

            $("#add-song-button").click(function () {
                let songName = $("#add-song").val();
                if (songName) {
                    $("#add-song").val(null);
                    let html = `
                            <li class="list-group-item ">
                               ${ songName }
                                <span style="float:right">
                                    <a class="delete-song" href="#"><i class="fas fa-times"></i></a>
                                </span>
                            </li>
                            `;
                    $("#song-list").append(html)
                    $("#song-list").attr("dirty", true)
                }
            });

            $("#song-list").on("click", ".delete-song", function (event) {
                event.preventDefault();
                $(this).parents("li").remove();
            });

        };

        const updateHandlers = function () {
            let startInp = $("#session-start");
            let stopInp = $("#session-stop");
            let stopTime = parseInt(stopInp.data("stop"));
            let startTime = parseInt(startInp.data("start"));
            var startMoment = moment(startTime);
            var stopMoment = moment(stopTime);

            if (startTime > 0) {
                $("#session-start-picker").datetimepicker('date', startMoment)

            }
            if (stopTime > 0) {
                $("#session-stop-picker").datetimepicker('date', stopMoment);
            }

            updateTime();


            var getId = function () {
                var parts = window.location.pathname.split('/');
                return parts[parts.length - 1];
            };

            $("#session-update").click(function () {
                let id = getId();
                let data = parseData();

                $.ajax({
                    url: "/sessions/" + id,
                    method: "PUT",
                    contentType: "application/json utf-8",
                    data: JSON.stringify(data),
                    dataType: "json"
                }).done(function (response) {
                    alertMessage("Successfully updated practice", "success");
                });
            });

            $("#session-cancel").click(function () {
                window.location.reload();
            });

            $("#session-delete").click(function () {
                let id = getId();
                $.ajax({
                    url: "/sessions/" + id,
                    method: "DELETE"
                }).done(function () {
                    window.location = "/sessions";
                });
            });
        };

        const createHandlers = function () {
            $("#session-create").click(function () {
                let data = parseData();

                try {

                    if (data.start === undefined || data.stop === undefined) {
                        throw "Cannot create new practice session, you must define both start and stop times";
                    }

                    $.ajax({
                        url: "/sessions",
                        method: "POST",
                        contentType: "application/json utf-8",
                        data: JSON.stringify(data),
                        dataType: "json"
                    }).done(function (response) {
                        window.location = "/sessions/" + response.id;
                    });
                } catch (err) {
                    alertMessage(err, "danger");
                }
            });
        };


        const main = function () {
            let state = $("#data-row").data("state");
            sharedHandlers();
            if (state !== undefined && state === "update") {
                updateHandlers();
            } else {
                createHandlers();
            }
        };


        $(document).ready(function () {
            main();
        });
    }
)();