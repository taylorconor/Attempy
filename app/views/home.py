from flask import Blueprint, Flask, render_template, request, redirect
from app import app

home = Blueprint('home', __name__)

#routes for home
@home.route('/')
def index():
    return render_template("home/index.html")

@home.route('/pml_source_submit', methods=['POST'])
def pml_source_submit():
    source = request.form["pml_source"]

    return render_template("home/pml_res.html", data = source)
