from flask import Blueprint, Flask, render_template, request, redirect, send_from_directory
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from werkzeug import secure_filename


home = Blueprint('home', __name__)
FILE_LOCATIONS = '/uploads/'


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
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    file_name = request.form["file_name"]
    tmp_filename = FILE_LOCATIONS+  current_user.get_id() + "/" + file_name
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


@home.route(FILE_LOCATIONS + '<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'],
                               filename)