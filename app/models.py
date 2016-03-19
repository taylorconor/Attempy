from sqlalchemy import Column, Integer, String
from app import login_manager, db
from app.database import Base
from werkzeug.security import generate_password_hash, check_password_hash

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    name = Column(String)
    username = Column(String)
    social_id = Column(String)
    password_hash = Column(String)
    keyboard_handler = Column(String)

    def __init__(self, email, name=None, username=None, social_id=None, password=None, keyboard_handler=None):
        if self.email != None:
            self.email = email.lower()
        else:
            self.email = email
        self.name = name
        self.username = username
        self.social_id = social_id
        if password is not None:
            self.set_password(password)
        else:
            password_hash = None
        self.keyboard_handler = keyboard_handler

    #methods required for flask login
    def is_authenticated(self):
        return True

    def is_active(self):
        """Is the user account active? If we require users to verify their emails then they should remain inactive until verified"""
        return True

    def is_anonymous(self):
        return False

    def get_id(self):
        return unicode(self.id)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        # import pdb; pdb.set_trace()
        return check_password_hash(self.password_hash, password)

    def get_keyboard_handler(self):
        return self.keyboard_handler

    def set_keyboard_handler(self, handler):
        self.keyboard_handler = handler
