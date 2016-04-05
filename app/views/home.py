from __future__ import print_function # In python 2.7
import sys
from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory, jsonify, helpers, flash
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from app.models import User
from app.database import db_session
from app import app, json_to_pml
from werkzeug import secure_filename
from app.pml_to_json import pml_to_json
import os, io, json


home = Blueprint('home', __name__)

#routes for home
@home.route('/', methods=["GET", "POST"])
@login_required
def index():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            #forbid path traversal attack
            filename = secure_filename(file.filename)
            file_path = os.path.join('.' + app.config['UPLOAD_DIR'], current_user.get_id())
            file_path = os.path.join(file_path, filename)
            file.save(file_path)
            #TODO: Check file is not ridiculously large and can fit in memory. Limit upload size
            with io.open(file_path, 'r', encoding='utf8') as f:
                source = f.read()
                #escape things so that special characters aren't escaped, but quotes are
                source = source.replace("\n","\\n")
                source = source.replace("\"","\\\"")
                source = source.replace("\'","\\\'")
                return render_template("home/index.html", passed_filename=filename, source=source, name = current_user.name, keyboard_handler = current_user.get_keyboard_handler())

        elif not allowed_file(file.filename):
            flash("Uploaded file must have the extension .pml", "warning")
            return render_template("home/index.html", name = current_user.name, keyboard_handler = current_user.get_keyboard_handler())

    return render_template("home/index.html", name = current_user.name, keyboard_handler = current_user.get_keyboard_handler())

@home.route('/graphical_editor')
@login_required
def graphical_editor():
    return render_template("home/graphical_editor.html", name=current_user.name)

#return the graphical file as the joint js array 
@home.route('/get_pml_json', methods=["GET", "POST"])
@login_required
def get_pml_json():
    filename = secure_filename(request.form["data"])
    checkIfUserDirectoryExists()
        
    #run the file through pmlcheck
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"], current_user.get_id())
    tmp_filename = os.path.join(tmp_filename, filename)
    
    try:
        p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return jsonify(output="Error", reason = str(e))
    prog_out, error = p.communicate()
    if p.returncode > 0:
        return jsonify(output="Error", reason = error)
    
    #continue and parse      
    try:
        d = pml_to_json.parse(tmp_filename)
        return jsonify(output = 'Success', source=d)
    except Exception, e:
        # flash("Unable to Parse File", "danger")
        return jsonify(output = 'Error', reason = "PML to JSON parser broke")

#return the graphical file in the intermediate json representation
@home.route('/load_graphical_file', methods = ["POST"])
@login_required
def load_graphical_file():
    filename = secure_filename(request.form["data"])
    checkIfUserDirectoryExists()

    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"], current_user.get_id())
    tmp_filename = os.path.join(tmp_filename, filename)

    try:
        p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return jsonify(output="Error", reason = str(e))
    prog_out, error = p.communicate()
    if p.returncode > 0:
        return jsonify(output="Error", reason = error)
    
    #continue and parse      
    try:
        arr = pml_to_json.parse(tmp_filename)
        arr = pml_to_json.arr_to_json(arr["cells"])

        return jsonify(output = 'Success', source=arr)
    except Exception, e:
        # flash("Unable to Parse File", "danger")
        return jsonify(output = 'Error', reason = str(e) + "PML to JSON parser broke")

@home.route('/handler_changed', methods=['POST'])
@login_required
def handler_changed():
    new_handler = request.form["handler"]
    current_user.set_keyboard_handler(new_handler)
    db_session.commit()
    return jsonify(output = 'Success')
    
@home.route('/pml_source_submit', methods=['POST'])
@login_required
def pml_source_submit():
    file_name = request.form["data"]
    file_name = secure_filename(file_name)
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"], current_user.get_id())
    tmp_filename = os.path.join(tmp_filename, file_name)
    checkIfUserDirectoryExists()
    try:
        p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return render_template("home/pml_res_fatal_error.html", error = e)

    prog_out, error = p.communicate()
    return jsonify({"output": error if p.returncode > 0 else prog_out, "return_code": p.returncode})
    
    
@home.route('/pml_save_file', methods=['POST'])
@login_required
def pml_save_file():
    path = ""
    try:
        path = request.json["path"]
    except:
        path = request.form["path"]
    text = ""
    try:
        text = request.json["text"]
    except:
        text = request.form["text"]
    path = secure_filename(path)
    checkIfUserDirectoryExists()
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), path)
    # print('Saved: ' + tmp_filename, file=sys.stderr)
    try:
        f = open(tmp_filename, "w")
        f.write(text)
        f.close()
    except:
        return jsonify(output = "Failed", reason = "Opening File Failed")
    return jsonify(output = 'Success')

@home.route('/save_graphical_file', methods=["POST"])
@login_required
def save_graphical_file():
    path = secure_filename(request.json["path"])
    filename = path.split("/")[-1]
    filename = path.split(".")[0]
    joint_json = json.loads(request.json["json"])
    joint_json = joint_json["cells"]
    
    (res, output) = json_to_pml.parse(joint_json, filename)
    if res == False:
        return jsonify(output="Failed", reason=output)
        
    checkIfUserDirectoryExists()
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), path)
    try:
        with open(tmp_filename, 'w') as f:
            f.write(output)
            f.close()
    except: 
        return jsonify(output = "Failed", reason = "Opening file failed")
    return jsonify(output = "Success")


@home.route('/pml_load_file', methods=['POST'])
@login_required
def pml_load_file():
    file_name = request.form["data"]
    file_name = secure_filename(file_name)
    # print('Data: ' + file_name, file=sys.stderr)
    checkIfUserDirectoryExists()
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), file_name)
    # print('FilePath: ' + tmp_filename, file=sys.stderr)

    f = open(tmp_filename, "r")
    contents = f.read()
    f.close()
    return jsonify(output = contents)


@home.route('/createFile', methods=['POST'])
@login_required
def createFile():
    checkIfUserDirectoryExists()
    file_name = request.form["data"]
    file_name = secure_filename(file_name)
    if(len(file_name) < 1):
        return jsonify(output = "Failed", reason = "Invalid Filename")
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), file_name)
    # print('FilePath: ' + tmp_filename, file=sys.stderr)
    try:
        f = open(tmp_filename, "w")
        f.close()
    except:
        return jsonify(output = "Failed", reason = "Invalid Filename")
    return jsonify(output = 'Success')

@home.route('/createFolder', methods=['POST'])
@login_required
def createFolder():
    checkIfUserDirectoryExists()
    file_name = request.form["data"]
    file_name = secure_filename(file_name)

    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), file_name)
    os.mkdir(tmp_filename);
    return jsonify(output = 'Success')

@home.route('/deleteFile', methods=['POST'])
@login_required
def deleteFile():
    checkIfUserDirectoryExists()
    file_name = request.form["data"]
    file_name = secure_filename(file_name)
    if(len(file_name) < 1):
        return jsonify(output = "Failed", reason = "Invalid Filename")
    tmp_filename = os.path.join('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id(), file_name)
    try:
        os.remove(tmp_filename);
    except:
        return jsonify(output = "Failed", reason = "Invalid Filename")
    return jsonify(output = 'Success')

@home.route('/pml_load_file_sidebar', methods=['GET'])
@login_required
def pml_load_file_sidebar():
    checkIfUserDirectoryExists()
    path = '.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id()
    html = ''
    html += '<ul class="nav nav-list">'
    html += '<li><label class="tree-toggle nav-header" tree="relative" style="display: inline-block">Your Files</label><i class="fa fa-file-text-o" data-toggle="modal" data-target="#newFileOrDirectory" style="display: inline-block; margin-left: 5px"></i>'
    html += '<ul class="nav nav-list tree">'
    html += make_tree(path)
    html += '</ul>'
    html += '</li>'
    html += '</ul>'
    # print('Tree: ' + str(html), file=sys.stderr)
    return jsonify(output = html)

def make_tree(path):
    relativePaths = path.split('/')
    nth = 3
    relativePaths = '/'.join(relativePaths[:nth]), '/'.join(relativePaths[nth:])
    relativePath = relativePaths[1]
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
            # print("name: " + name, file=sys.stderr)
            html += '<li>'
            if os.path.isdir(fn):
                html += '<label class="tree-toggle nav-header">'+str(name)+'</label><i class="fa fa-plus-circle" data-toggle="modal" data-target="#newFileOrDirectory"></i>'
                html += '<ul class="nav nav-list tree">'
                html += make_tree(fn)
                html += '</ul>'
            else:
                max_length = 14
                if(len(str(name)) > max_length):
                    shorterName = str(name)[0:max_length-3] + "..."
                    html += '<i class="fa fa-trash-o delete_icon" data-toggle="modal" data-target="#delete_file"></i><a href="#' + name + '" title="' + name + '" relative=' + os.path.join(relativePath, name) + '>' + str(shorterName) + '</a>'
                else:
                    html += '<i class="fa fa-trash-o delete_icon" data-toggle="modal" data-target="#delete_file"></i><a href="#' + name + '" relative=' + os.path.join(relativePath, name) + '>' + name + '</a>'
                # print('relativePath: ' + str(os.path.join(relativePath, name)), file=sys.stderr)
            html += '</li>'
    return html


def checkIfUserDirectoryExists():
    if (not os.path.exists('.' + app.config["UPLOAD_DIR"])):
        os.mkdir('.' + app.config["UPLOAD_DIR"])
    if (not os.path.exists('.' + app.config["UPLOAD_DIR"] + '/' + current_user.get_id())):
        os.mkdir(os.path.join('.' + app.config["UPLOAD_DIR"], current_user.get_id()))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in app.config["ALLOWED_EXTENSIONS"]

