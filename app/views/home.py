from flask import Blueprint, Flask, render_template
from app import app

home = Blueprint('home', __name__)

#routes for home
@home.route('/')
def index():
    return render_template("home/index.html")
