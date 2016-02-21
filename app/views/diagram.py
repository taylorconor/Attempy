from __future__ import print_function # In python 2.7
import sys
from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from app import app
from werkzeug import secure_filename
import os, io
import simplejson
diagram = Blueprint('diagram', __name__)
FILE_LOCATIONS = '/uploads'

#routes for diagram
@diagram.route('/ui', methods=["GET", "POST"])
@login_required
def ui():
    return render_template("diagram/index.html", name = current_user.name)

@diagram.route('/getJSON', methods=["GET", "POST"])
@login_required
def getJSON():
	file_name = request.form["data"]
	tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name
	f = open(tmp_filename, "r")
	contents = f.read()
	f.close()
	joined = "".join(contents.split())
	# print(joined, file=sys.stderr)
	return jsonify(output = simplejson.loads(joined))