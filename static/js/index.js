(function () {


    var currentInterval = null;

    function str_pad_left(string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    }

    var countUp = function () {
        var stopBtn = $("#session-stop-content");
        var start = parseInt(stopBtn.data("start"));
        var now = new Date().getTime();

        var diff = now - start;
        diff = diff / 1000;
        console.log(start)
        var seconds = Math.floor(diff % 60)
        diff = diff / 60;
        var minutes = Math.floor(diff % 60)
        diff = diff / 60
        var hours = Math.floor(diff % 60)

        var counter = $('#counter').text(str_pad_left(hours, '0', 2) + ":" + str_pad_left(minutes, '0', 2) + ":" + str_pad_left(seconds, "0", 2))
    }

    startHandler = function () {
        $("#session-start").click(function () {
            var now = new Date;
            $("#session-start-content").hide().queue(function () {
            });
            $.ajax({
                url: "/sessions",
                dataType: 'json',
                contentType: "application/json utf-8",
                method: "POST",
                data: JSON.stringify({start: now.getTime()})
            })
                .done(function (result) {
                    var stopBtn = $("#session-stop-content");
                    stopBtn.data("start", result.start);
                    stopBtn.data("id", result.id);

                    $("#session-stop-content").show();
                    currentInterval = setInterval(countUp, 1000);
                });
        });
    };

    stopHandler = function () {
        $("#session-stop").click(function () {
            let now = new Date;
            let stopBtn = $("#session-stop-content");
            let id = stopBtn.data("id")
            if (currentInterval != null) {
                clearInterval(currentInterval);
                currentInterval = null;
            }

            $.ajax({
                url: "/sessions/" + id,
                method: "PUT",
                contentType: "application/json utf-8",
                data: JSON.stringify({stop: now.getTime()}),
                dataType: "json"
            }).done(function (result) {
                window.location = "/sessions/" + id;
            });
        })
    };

    function main() {
        startHandler();
        stopHandler();
        var stopBtn = $("#session-stop-content");
        if (stopBtn.data("start") != null) {
            currentInterval = setInterval(countUp, 1000)
        }

    }


    $(document).ready(function () {
        main();
    });

})();