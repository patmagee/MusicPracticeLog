(function () {

    const str_pad_left = function (string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    }
    const get_diff = function (start, stop) {

        var diff = stop - start;
        diff = diff / 1000;
        var seconds = Math.floor(diff % 60);
        diff = diff / 60;
        var minutes = Math.floor(diff % 60);
        diff = diff / 60;
        var hours = Math.floor(diff % 60);

        return str_pad_left(hours, '0', 2) + ":" + str_pad_left(minutes, '0', 2) + ":" + str_pad_left(seconds, "0", 2);
    };

    const tableHandlers = function () {
        $(".practice-session-row").click(function () {
            var id = $(this).data("id");
            window.location = "/sessions/" + id
        });

        $(".practice-session-row").each(function () {

            var startCol = $(this).children(".practice-session-start").first();
            var stopCol = $(this).children(".practice-session-stop").first();
            var diffCol = $(this).children(".practice-session-diff").first();

            var startTime = parseInt(startCol.data("start"));
            var stopTime = parseInt(stopCol.data("stop"));

            var startDate = new Date(startTime);
            startCol.text(startDate.toLocaleString());

            if (stopTime > 0) {
                var stopDate = new Date(stopTime);
                stopCol.text(stopDate.toLocaleString());
                diffCol.text(get_diff(startTime, stopTime));
            }
        });
    };

    function main() {
        tableHandlers();
    }


    $(document).ready(function () {
        main();
    })

})();