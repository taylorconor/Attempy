from flask import Flask, g
from flask.ext import login
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask(__name__, static_url_path='/static')
app.config.from_object('app.settings')


login_manager = login.LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

db = SQLAlchemy(app)

#import views to register blueprints
from .views.home import home
from .views.auth import auth
from .views.diagram import diagram
from app.models import User
from app.database import db_session
from app.database import init_db

init_db()

app.register_blueprint(home)
app.register_blueprint(auth)
app.register_blueprint(diagram)

@app.before_request
def global_user():
    g.user = login.current_user

@login_manager.user_loader
def load_user(userid):
    try:
        return User.query.get(int(userid))
    except (TypeError, ValueError):
        pass

# Make current user available on templates
@app.context_processor
def inject_user():
    try:
        return {'user': g.user}
    except AttributeError:
        return {'user': None}

@app.teardown_appcontext
def shutdown_session(exception=None):
	db_session.remove