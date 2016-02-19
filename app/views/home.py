from flask import Blueprint, Flask, render_template, request, redirect, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user
from app import app
from werkzeug import secure_filename
import os, io

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
            file_path = os.path.join(app.config['UPLOAD_DIR'], filename)
            file.save(file_path)
            #TODO: Check file is not ridiculously large and can fit in memory. Limit upload size
            with io.open(file_path, 'r', encoding='utf8') as f:
                source = f.read()
                #escape things so that special characters aren't escaped, but quotes are
                source = source.replace("\n","\\n")
                source = source.replace("\"","\\\"")
                source = source.replace("\'","\\\'")
                return render_template("home/index.html", source=source)

    return render_template("home/index.html", name = current_user.name)


@home.route('/pml_source_submit', methods=['POST'])
@login_required
def pml_source_submit():
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    tmp_filename = "/tmp/pmlcheck_output"
    source = request.form["data"]
    with io.open(tmp_filename,'w',encoding='utf8') as f:
        f.write(source)
    try:
            p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return render_template("home/pml_res_fatal_error.html", error = e)

    prog_out, error = p.communicate()
    return jsonify( {"output": error if p.returncode > 0 else prog_out, "return_code": p.returncode})


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in app.config["ALLOWED_EXTENSIONS"]
