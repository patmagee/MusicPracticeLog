from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, IntegerField, BooleanField, FieldList
from wtforms.validators import DataRequired


class LoginForm(FlaskForm):
    username = StringField("username", validators=[DataRequired()])
    password = PasswordField('password', validators=[DataRequired()])


class PracticeSessionForm(FlaskForm):
    start = IntegerField("start")
    stop = IntegerField("stop")
    warmed_up = BooleanField("warmed_up")
    notes = StringField("notes")
    songs = FieldList(StringField("songs"))
