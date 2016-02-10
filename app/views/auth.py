from flask import Blueprint, Flask, render_template, request, redirect, url_for, current_app, flash
from app import app, login_manager, db
from app.models import User
from app.database import db_session
from flask.ext.login import login_user, current_user, logout_user, login_required
from rauth import OAuth2Service
import json, urllib2

auth = Blueprint('auth', __name__)

#Routes 
@auth.route('/login', methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")

    #POST
    print request
    email = request.form["email"]
    password = request.form["password"]
    remember = request.form.get("remember-me")
    user = User.query.filter_by(email=email).first()
    print user
    if not user or user.password_hash == None: #user doesn't exist
        flash("No user with that email or user uses third party login")
        return redirect(url_for("auth.login"))

    if user.check_password(password) == True: #password correct
        login_user(user, remember=remember)
        flash("Logged in")
        return redirect(request.args.get('next') or url_for('home.index'))


@auth.route('/register' , methods=['GET','POST'])
def register():
    if request.method == 'GET':
        return render_template('auth/register.html')

    #POST
    #TODO:
    #Check passwords match
    #Perform other validation
    user = User.query.filter_by(email=request.form["email"]).first()
    if user:
        flash("User already registered with that email")
        return redirect(url_for('auth.register'))

    user = User(email=request.form['email'], password=request.form["password"], name=request.form["name"])
    db_session.add(user)
    db_session.commit()
    flash('User successfully registered')
    return redirect(url_for('auth.login'))
    

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home.index'))


@auth.route('/auth/<provider>')
def oauth_auth(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home.index'))
    oauth = OAuthSignIn.get_provider(provider)
    return oauth.authorize()

@auth.route('/callback/<provider>')
def oauth_callback(provider):
    if not current_user.is_anonymous:
        return redirect(url_for('home.index'))
    oauth = OAuthSignIn.get_provider(provider)
    res = oauth.callback()
    if res["social_id"] is None:
        flash("Auth failed")
        return redirect(url_for('home.index'))
    user = User.query.filter_by(social_id=res["social_id"]).first()

    if not user:
        #before we make an account, check if the user exists with the email address
        #ie check if the user registered using another account
        exists = User.query.filter_by(email=res["email"]).first()
        if exists:
            flash("User already exists with that email, please login using the account you registered it with")
            return redirect(url_for('auth.login'))
        #user does not exist, proceed to create an account
        user = User(social_id=res["social_id"], name=res["name"], email=res["email"])
        db_session.add(user)
        db_session.commit()

    login_user(user, True)
    return redirect(url_for('home.index'))

def email_login(email, password):
    status = {
        "success": True,
        "reason": ""
    }
    # check if valid email
    user = User.query.filter_by(email=email)
    if user == None:
        status["success"] = False
        status["reason"] = "Invalid email address"
    
    if not check_password(tempUser, password):
        status['reason'] = 'Error: Wrong password.'
        return status

    #if we want to add email verification
    if not tempUser.is_active():
        status["success"] = False
        status['reason'] = 'User not active'
        return status

    # actually log in the user
    login.login_user(user)

    return status


def hash_password(password):
    return generate_password_hash(password)

def check_password(user, password):
    return check_password_hash(user.password_hash, password)


#Oauth stuff
class OAuthSignIn(object):
    providers = None

    def __init__(self, provider_name):
        self.provider_name = provider_name
        credentials = current_app.config['OAUTH_CREDENTIALS'][provider_name]
        self.consumer_id = credentials['id']
        self.consumer_secret = credentials['secret']

    def authorize(self):
        pass

    def callback(self):
        pass

    def get_callback_url(self):
        print url_for('auth.oauth_callback', provider=self.provider_name, _external=True)
        return url_for('auth.oauth_callback', provider=self.provider_name,
                       _external=True)

    @classmethod
    def get_provider(self, provider_name):
        if self.providers is None:
            self.providers = {}
            for provider_class in self.__subclasses__():
                provider = provider_class()
                self.providers[provider.provider_name] = provider
        return self.providers[provider_name]


class FacebookSignIn(OAuthSignIn):
    def __init__(self):
        super(FacebookSignIn, self).__init__('facebook')
        self.service = OAuth2Service(
            name='facebook',
            client_id=self.consumer_id,
            client_secret=self.consumer_secret,
            authorize_url='https://graph.facebook.com/oauth/authorize',
            access_token_url='https://graph.facebook.com/oauth/access_token',
            base_url='https://graph.facebook.com/'
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='email,user_about_me',
            response_type='code',
            redirect_uri=self.get_callback_url())
        )

    def callback(self):
        if 'code' not in request.args:
            return {
                "social_id": None,
                "email": None, 
                "name": None
            }
        oauth_session = self.service.get_auth_session(
            data={'code': request.args['code'],
                  'grant_type': 'authorization_code',
                  'redirect_uri': self.get_callback_url()}
        )
        me = oauth_session.get('me?fields=id,email,first_name,last_name').json()
        print me
        return {
            "social_id": 'facebook$' + me['id'],
            "email": me.get('email'),
            "name": me.get('first_name') + " " + me.get("last_name")
        }

class GithubSignIn(OAuthSignIn):
    def __init__(self):
        super(GithubSignIn, self).__init__('github')
        self.service = OAuth2Service(
            name='github',
            client_id=self.consumer_id,
            client_secret=self.consumer_secret,
            authorize_url='https://github.com/login/oauth/authorize',
            access_token_url='https://github.com/login/oauth/access_token',
            base_url='https://api.github.com'
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='user',
            #response_type='code',
            redirect_uri=self.get_callback_url()
        ))

    def callback(self):
        if 'code' not in request.args:
            return {
                "social_id": None,
                "email": None, 
                "name": None
            }
        oauth_session = self.service.get_auth_session(
            data={'code': request.args['code'],
                  'grant_type': 'authorization_code',
                  'redirect_uri': self.get_callback_url()

        })
        me = oauth_session.get('/user').json()
        print me
        return {
            "social_id": 'github$' + str(me['id']),
            "email": me.get('email'),
            "name": me.get('name')
        }

# class GoogleSignIn(OAuthSignIn):
#     def __init__(self):
#         super(GoogleSignIn, self).__init__('google')
#         self.service = OAuth2Service(
#             name='google',
#             client_id=self.consumer_id,
#             client_secret=self.consumer_secret,
#             authorize_url='https://accounts.google.com/o/oauth2/auth',
#             access_token_url='https://accounts.google.com/o/oauth2/token',
#             base_url='https://www.googleapis.com/auth/userinfo'
#         )

#     def authorize(self):
#         return redirect(self.service.get_authorize_url(
#             scope='profile',
#             response_type='code',
#             redirect_uri=self.get_callback_url()
#         ))

#     def callback(self):
#         if 'code' not in request.args:
#             return {
#                 "social_id": None,
#                 "email": None, 
#                 "first_name": None,
#                 "last_name": None
#             }
#         oauth_session = self.service.get_auth_session(
#             data={'code': request.args['code'],
#                 'grant_type': 'authorization_code',
#                 'redirect_uri': self.get_callback_url()
#             },
#             decoder = json.loads
#         )
#         me = oauth_session.get('/profile')
#         print me.content
#         print me

#         return {
#             "social_id": 'google$' + str(me['id']),
#             "email": me.get('email'),
#             "first_name": me.get('name'),  # Facebook does not provide
#                                          # username, so the email's user
#                                          # is used instead
#             "last_name": None
#         }

class GoogleSignIn(OAuthSignIn):
    def __init__(self):
        super(GoogleSignIn, self).__init__('google')
        googleinfo = urllib2.urlopen('https://accounts.google.com/.well-known/openid-configuration')
        google_params = json.load(googleinfo)
        self.service = OAuth2Service(
                name='google',
                client_id=self.consumer_id,
                client_secret=self.consumer_secret,
                authorize_url=google_params.get('authorization_endpoint'),
                base_url=google_params.get('userinfo_endpoint'),
                access_token_url=google_params.get('token_endpoint')
        )

    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope='profile email',
            response_type='code',
            redirect_uri=self.get_callback_url())
            )

    def callback(self):
        if 'code' not in request.args:
            return {
                "social_id": None,
                "email": None, 
                "name": None,
            }        
        # oauth_session = self.service.get_auth_session(
        #     data={'code': request.args['code'],
        #           'grant_type': 'authorization_code',
        #           'redirect_uri': self.get_callback_url()
        #          },
        #     decoder = json.loads
        # )
        data={'code': request.args['code'],
            'grant_type': 'authorization_code',
            'redirect_uri': self.get_callback_url()
        }
        
        response = self.service.get_raw_access_token(data=data)
        response = response.json()    
        oauth2_session = self.service.get_session(response['access_token'])
        me = oauth2_session.get('https://www.googleapis.com/oauth2/v1/userinfo').json()
        #me = oauth_session.get('').json()
        return {
            "social_id": 'google$' + str(me.get('id')),
            "email": me.get('email'),
            "name": me.get('given_name') + " " + me.get("family_name")
        }