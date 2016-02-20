from __future__ import print_function # In python 2.7
import sys
from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from app import app
from werkzeug import secure_filename
import os, io

diagram = Blueprint('diagram', __name__)

#routes for diagram
@diagram.route('/ui', methods=["GET", "POST"])
@login_required
def ui():
    print('Make Diagram', file=sys.stderr)
    return render_template("diagram/index.html", name = current_user.name)