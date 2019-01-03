(function () {


    const str_pad_left = function (string, pad, length) {
        return (new Array(length + 1).join(pad) + string).slice(-length);
    };

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

    const practiceSessionHandlers = function () {

        let startInp = $("#session-start");
        let stopInp = $("#session-stop");
        let noteInp = $("#session-notes");
        let header = $("#sessiontime");

        let stopTime = parseInt(stopInp.val());
        let startTime = parseInt(startInp.val());

        if (stopTime > 0) {
            header.text(get_diff(startTime, stopTime))
            stopInp.val(new Date(stopTime).toLocaleString());
        } else {
            stopInp.val("--");
            header.text("--:--:--");

        }
        startInp.val(new Date(startTime).toLocaleString());

        $("#session-update").click(function () {
            var parts = window.location.pathname.split('/');
            var id = parts[parts.length - 1];
            let data = {};

            data.notes = noteInp.val();
            data.warmed_up = $("#warm-up").hasClass("active");

            if ($("#song-list").attr("dirty")) {
                songs = [];
                $("#song-list").children("li").each(function () {
                    songs.push($(this).text())
                });
                data.songs = songs.reverse()
            }

            $.ajax({
                url: "/sessions/" + id,
                method: "PUT",
                contentType: "application/json utf-8",
                data: JSON.stringify(data),
                dataType: "json"
            }).done(function () {
                var html = `
                <div class="alert alert-success">
                    Successfully Updated Practice Session
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                `;
                $("#alert-center").html(html)
            });


        });
        $("#add-song-button").click(function () {
            let songName = $("#add-song").val();
            if (songName) {
                $("#add-song").val(null);
                let html = '<li class="list-group-item">' + songName + '</li>';
                $("#song-list").append(html)
                $("#song-list").attr("dirty", true)
            }
        });
    };

    const main = function () {
        practiceSessionHandlers();
    };


    $(document).ready(function () {
        main();
    });
})();