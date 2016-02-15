from __future__ import print_function # In python 2.7
import sys
from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from app import app
from werkzeug import secure_filename
import os


home = Blueprint('home', __name__)
FILE_LOCATIONS = '/uploads'


#routes for home
@home.route('/', methods=["GET", "POST"])
@login_required
def index():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            #forbid path traversal attack
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_DIR'], filename)
            file.save(file_path)
            #TODO: Check file is not ridiculously large and can fit in memory. Limit upload size
            with open(file_path, 'r') as f:
                source = f.read()
                source = source.replace("\n","\\n")
                # print source
                return render_template("home/index.html", source=source)

    return render_template("home/index.html")


@home.route('/pml_source_submit', methods=['POST'])
@login_required
def pml_source_submit():
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/pmlcheck_output"
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
    source = request.form["data"]
    f = open(tmp_filename, "w")
    f.write(source)
    f.close()
    try: 
        p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return render_template("home/pml_res_fatal_error.html", error = e)

    prog_out, error = p.communicate()
    return jsonify( {"output": error if p.returncode > 0 else prog_out, "return_code": p.returncode})

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in app.config["ALLOWED_EXTENSIONS"]



@home.route('/pml_save_file', methods=['POST'])
@login_required
def pml_save_file():
    file_name = request.json["path"]
    print('Data: ' + file_name, file=sys.stderr)
    tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name
    
    print('FilePath: ' + tmp_filename, file=sys.stderr)
    f = open(tmp_filename, "w")
    f.write(request.json["text"])
    f.close()
    return jsonify(output = 'Success')

@home.route('/pml_load_file', methods=['POST'])
@login_required
def pml_load_file():
    file_name = request.form["data"]
    print('Data: ' + file_name, file=sys.stderr)
    tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
    print('FilePath: ' + tmp_filename, file=sys.stderr)
    f = open(tmp_filename, "r")
    contents = f.read()
    f.close()
    return jsonify(output = contents)

@home.route('/createFile', methods=['POST'])
@login_required
def createFile():
    file_name = request.form["data"]
    pieces = file_name.split("/");
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
    if("." not in pieces[len(pieces) - 1]):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name);
    else:
        tmp_filename = '.' + FILE_LOCATIONS + '/' + current_user.get_id() + "/" + file_name

        print('FilePath: ' + tmp_filename, file=sys.stderr)
        f = open(tmp_filename, "w")
        f.close()
    return jsonify(output = 'Success')

@home.route('/pml_load_file_sidebar', methods=['GET'])
@login_required
def pml_load_file_sidebar():
    if (not os.path.exists('.' + FILE_LOCATIONS)):
        os.mkdir('.' + FILE_LOCATIONS)
    if (not os.path.exists('.' + FILE_LOCATIONS + '/' + current_user.get_id())):
        os.mkdir('.' + FILE_LOCATIONS + '/' + current_user.get_id())
        return 'No Files'
    print('Hello?', file=sys.stderr)

    path = '.' + FILE_LOCATIONS + '/' + current_user.get_id()
    html = ''
    html += '<ul class="nav nav-list">'
    html += '<li><label class="tree-toggle nav-header" style="display: inline-block">Your Files</label><i class="fa fa-plus-circle" data-toggle="modal" data-target="#getNewFileName" style="display: inline-block; margin-left: 5px"></i>'
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
            return ''
        for name in lst:
            fn = os.path.join(path, name)
            html += '<li>'
            if os.path.isdir(fn):
                html += '<label class="tree-toggle nav-header" style="display: inline-block">'+str(name)+'</label><i class="fa fa-plus-circle" data-toggle="modal" data-target="#getNewFileName" style="display: inline-block; margin-left: 5px"></i>'
                html += '<ul class="nav nav-list tree">'
                html += make_tree(fn)
                html += '</ul>'
            else:    
                html += '<a href="#">' + str(name) + '</a>'
            html += '</li>'
    return html
