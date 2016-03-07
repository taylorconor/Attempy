import unittest
from flask import Flask, g
from flask.ext import login
from flask.ext.sqlalchemy import SQLAlchemy
import os, sys
topdir = os.path.join(os.path.dirname(__file__), "..")
sys.path.append(topdir)
from app import app 

app.config.from_object('app.settings')


login_manager = login.LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

db = SQLAlchemy(app)

#import views to register blueprints
from app.views.home import home
from app.views.auth import auth
from app.models import User
from app.database import db_session
from app.database import init_db

init_db()

app.register_blueprint(home)
app.register_blueprint(auth)

class SimplepagesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def tearDown(self):
        pass

    def test_show(self):
        page = self.app.get('/')
        assert '404 Not Found' not in page.data

if __name__ == '__main__':
    unittest.main()
