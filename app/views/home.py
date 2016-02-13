from __future__ import print_function # In python 2.7
import sys
from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from werkzeug import secure_filename
import os


home = Blueprint('home', __name__)
FILE_LOCATIONS = '/uploads'


#routes for home
@home.route('/')
@login_required
def index():
    return render_template("home/index.html")


@home.route('/pml_source_submit', methods=['POST'])
@login_required
def pml_source_submit():
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    tmp_filename = "/tmp/"+  current_user.get_id() + "/pmlcheck_output"
    source = request.form["ace_text-input"]
    f = open(tmp_filename, "w")
    f.write(source)
    f.close()
    try:
            p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return render_template("home/pml_res_fatal_error.html", error = e)

    prog_out, err = p.communicate()
    if p.returncode > 0:
        return render_template("home/pml_res_error.html", error = err)
    return render_template("home/pml_res.html", output = prog_out)

@home.route('/pml_save_file', methods=['POST'])
@login_required
def pml_save_file():
    file_name = request.form["data"]
    tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
    print('FilePath: ' + tmp_filename, file=sys.stderr)
    f = open(tmp_filename, "w")
    f.write('hello')
    f.close()
    return jsonify(output = 'Success')

@home.route(FILE_LOCATIONS + '<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)

@home.route('/pml_load_file_sidebar', methods=['GET'])
@login_required
def pml_load_file_sidebar():
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
        return 'No Files'
    path = '.' + FILE_LOCATIONS + '/' + current_user.get_id()
    html = ''
    html += '<ul class="nav nav-list">'
    html += '<li><label class="tree-toggle nav-header">Your Files</label>'
    html += '<ul class="nav nav-list tree">'
    html += make_tree(path)
    html += '</ul>'
    html += '</li>'
    html += '</ul>'
    print('Tree: ' + str(html), file=sys.stderr)
    return jsonify(output = html)

def make_tree(path):
    html = ''
    tree = dict(name=path, children=[])
    try: lst = os.listdir(path)
    except OSError:
        pass #ignore errors
    else:
        if len(lst) == 0:
            print('--------------- Empty Directory --------------', file=sys.stderr)
            return ''
        for name in lst:
            fn = os.path.join(path, name)
            if os.path.isdir(fn):
                html += '<li>'
                html += '<label class="tree-toggle nav-header">'+str(name)+'</label>'
                html += '<ul class="nav nav-list tree">'
                html += make_tree(fn)
                html += '</ul>'
                html += '</li>'
            else:
                if(name is not None):
                    html += '<li>'
                    html += '<a href="#">' + str(name) + '</a>'
                    html += '</li>'
    # print('Tree: ' + str(html), file=sys.stderr)
    return html