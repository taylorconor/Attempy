from flask import Flask

app = Flask(__name__, static_url_path='/static')
app.config['SECRET_KEY'] = 'I_AM_A_V3RY_S3CRET_KEY'

app.config.update(
    DEBUG=True
    #put any additional config settings in here, or else make a config file
)

#import views to register blueprints
from .views.home import home

#register blueprints
app.register_blueprint(home)
