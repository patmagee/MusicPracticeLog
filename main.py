from functools import wraps

from flask import Flask
from flask import flash, redirect, render_template, request, session, url_for, jsonify

from google.appengine.api import users
from google.appengine.api import app_identity

from utils import config
from utils.Forms import LoginForm, PracticeSessionForm
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


@app.route('/')
def index():
    current_user = users.get_current_user()
    if current_user:
        current_user = users.get_current_user()
        userId = current_user.user_id()
        latest_session = models.get_latest_practice_session(userId)

        if latest_session != None and not latest_session.complete():
            return render_authorized_template(current_user, "index.html",
                                              current_session=latest_session.serialize())
        else:
            return render_authorized_template(current_user, "index.html")
    else:
        return render_template("login.html", signinurl=users.create_login_url("/"))


# @app.route("/login", methods=["POST", "GET"])
# def login():
#     form = LoginForm()
#     if form.is_submitted():
#         username = form.username.data
#         password = form.password.data
#
#         if username in users.users and bcrypt.checkpw(password.encode("utf-8"), users.users[username].encode("utf-8")):
#             session['username'] = username
#
#             return redirect(url_for("index"))
#         else:
#             flash("Login Failed. Username or password incorrect", category="error")
#             return redirect(url_for("login"))
#     else:
#         if logged_in():
#             return redirect(url_for("index"))
#         else:
#             return render_template("login.html")


def get_time_zone(tzoffset):
    hours = abs(tzoffset) / 60
    minutes = abs(tzoffset) % 60


@app.route("/sessions", methods=["POST", "GET"])
@force_logged_in
def practice_sessions():
    user = users.get_current_user()
    if request.method == "POST":
        data = request.get_json()
        currentSession = models.add_practice_session(user.user_id(), data)

        return jsonify(currentSession.serialize())
    elif request.method == "GET":
        all_sessions = models.get_practice_sessions(user.user_id())
        all_serialized = [s.serialize() for s in all_sessions]
        return render_authorized_template(user, "all_sessions.html", practice_sessions=all_serialized)


@app.route("/sessions/<id>", methods=["PUT", "GET"])
@force_logged_in
def practice_session(id):
    user = users.get_current_user()
    if request.method == "PUT":
        data = request.get_json()
        updated_session = models.update_practice_existing_session(user.user_id(), id, data)
        return jsonify(updated_session.serialize())
    elif request.method == "GET":
        practice_session = models.get_practice_session(user.user_id(), id)
        if practice_session:
            return render_authorized_template(user, "practice_session.html",
                                              practice_session=practice_session.serialize())
        else:
            return redirect(url_for("index"))


@app.errorhandler(500)
def handle_internal_server_error(error):
    message = "Internal Server Error: {}".format(error.message)
    return render_authorized_template(users.get_current_user(), "error.html", errorcode=500, errormessage=message)


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
