from google.appengine.ext import ndb

DEFAULT_RESULTS_PER_PAGE = 100


def get_user_key(userId):
    """Construct a Datastore key for a User's Practice sessions"""

    return ndb.Key('User', userId)


class PracticeSession(ndb.Model):
    start = ndb.IntegerProperty()
    stop = ndb.IntegerProperty()
    notes = ndb.StringProperty()
    warmed_up = ndb.BooleanProperty()
    songs = ndb.StringProperty(repeated=True)

    def complete(self):
        return self.stop != None and self.start != None

    def serialize(self):
        _dict = self.to_dict()
        _dict["id"] = self.key.urlsafe()
        return _dict


def get_practice_sessions(userId, start=None, stop=None):
    user_key = get_user_key(userId)
    query = PracticeSession.query(ancestor=user_key)
    if start:
        start = int(start)
        query.filter(PracticeSession.start >= start)
    if stop:
        stop = int(stop)
        query.filter(PracticeSession.stop < stop)
    return query.order(-PracticeSession.start).fetch()


def get_latest_practice_session(userId):
    user_key = get_user_key(userId)
    return PracticeSession.query(ancestor=user_key).order(-PracticeSession.start).get()


def get_practice_session(userId, key):
    user_key = get_user_key(userId)
    session_key = ndb.Key(urlsafe=key)

    return PracticeSession.query(PracticeSession.key == session_key, ancestor=user_key).get()


def add_practice_session(userId, form):
    practice_session = PracticeSession(parent=get_user_key(userId))
    return update_practice_session(form, practice_session)


def update_practice_existing_session(userId, key, update):
    existing_session = get_practice_session(userId, key)
    if existing_session != None:
        return update_practice_session(update, existing_session)
    else:
        raise Exception("Could not update practice session, it does not exist")


def update_practice_session(data_update, practice_session):
    if "start" in data_update:
        practice_session.start = data_update["start"]

    if "stop" in data_update:
        practice_session.stop = data_update["stop"]

    if "notes" in data_update:
        practice_session.notes = data_update["notes"]

    if "warmed_up" in data_update:
        practice_session.warmed_up = data_update["warmed_up"]

    if "songs" in data_update:
        practice_session.songs = data_update["songs"]

    practice_session.put()

    return practice_session


def delete_practice_session(userId, key):
    practice_session = get_practice_session(userId, key);
    if practice_session:
        session_key = ndb.Key(urlsafe=key)
        session_key.delete()
        return True
    return False
