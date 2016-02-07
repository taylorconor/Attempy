import unittest
from flask import Flask

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = 'I_AM_A_V3RY_S3CRET_KEY'

app.config.update(
    DEBUG=True
    #put any additional config settings in here, or else make a config file
)

#import views to register blueprints
from views.home import home

#register blueprints
app.register_blueprint(home)


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