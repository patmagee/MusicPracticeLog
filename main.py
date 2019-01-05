from functools import wraps

from flask import Flask
from flask import flash, redirect, render_template, request, session, url_for, jsonify

from google.appengine.api import users

from utils import config
from utils import models

app = Flask(__name__)
app.secret_key = config.SECRET_KEY


def force_logged_in(func):
    @wraps(func)
    def logged_in_wrapper(*args, **kwargs):
        user = users.get_current_user()
        if not user:
            return redirect(users.create_login_url("/"))
        else:
            return func(*args, **kwargs)

    return logged_in_wrapper


def render_authorized_template(user, template_name, **kwargs):
    if user:
        signouturl = users.create_logout_url('/')
        return render_template(template_name, username=user.nickname(), signouturl=signouturl, **kwargs)


def request_wants_json():
    best = request.accept_mimetypes \
        .best_match(['application/json; charset=utf-8', 'text/html'])
    print best
    return best == 'application/json' and \
           request.accept_mimetypes[best] > \
           request.accept_mimetypes['text/html']


@app.route('/')
def index():
    current_user = users.get_current_user()
    if current_user:
        current_user = users.get_current_user()
        userId = current_user.user_id()
        latest_session = models.get_latest_practice_session(userId)

        if latest_session != None and not latest_session.complete():
            return render_authorized_template(current_user, "index.html",
                                              current_session=latest_session.serialize(),
                                              scripts=["/static/js/index.js"], )
        else:
            return render_authorized_template(current_user, "index.html", scripts=["/static/js/index.js"], )
    else:
        return render_template("login.html", signinurl=users.create_login_url("/"))


@app.route("/sessions", methods=["POST", "GET"])
@force_logged_in
def practice_sessions():
    user = users.get_current_user()
    if request.method == "POST":
        data = request.get_json()
        currentSession = models.add_practice_session(user.user_id(), data)

        return jsonify(currentSession.serialize())
    elif request.method == "GET":
        start = request.args.get("start")
        stop = request.args.get("stop")
        all_sessions = models.get_practice_sessions(user.user_id(), start=start, stop=stop)
        all_serialized = [s.serialize() for s in all_sessions]
        if "application/json" in request.accept_mimetypes.values():

            return jsonify(all_serialized)
        else:

            return render_authorized_template(user, "all_sessions.html", scripts=["/static/js/all_sessions.js"],
                                              practice_sessions=all_serialized)


@app.route("/sessions/<id>", methods=["PUT", "GET", "DELETE"])
@force_logged_in
def practice_session(id):
    user = users.get_current_user()
    if request.method == "PUT":
        data = request.get_json()
        updated_session = models.update_practice_existing_session(user.user_id(), id, data)
        return jsonify(updated_session.serialize())
    elif request.method == "GET":
        if id == "add":
            return render_authorized_template(user, "practice_session.html",
                                              scripts=["/static/js/practice_session.js"],
                                              state="create")
        else:
            practice_session = models.get_practice_session(user.user_id(), id)
            if practice_session:
                return render_authorized_template(user, "practice_session.html",
                                                  scripts=["/static/js/practice_session.js"],
                                                  state="update",
                                                  practice_session=practice_session.serialize())
            else:
                return redirect(url_for("index"))
    elif request.method == "DELETE":
        if (models.delete_practice_session(user.user_id(), id)):
            return
        else:
            return "Could not delete sessions, not found", 404


@app.route("/charts", methods=["GET"])
@force_logged_in
def charts():
    user = users.get_current_user()
    return render_authorized_template(user, "charts.html",
                                      scripts=["https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.3/Chart.min.js",
                                               "/static/js/charts.js"])


@app.errorhandler(500)
def handle_internal_server_error(error):
    message = "Internal Server Error: {}".format(error.message)
    return render_authorized_template(users.get_current_user(), "error.html", errorcode=500, errormessage=message)


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
