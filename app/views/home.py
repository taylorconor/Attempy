from flask import Blueprint, Flask, render_template, request, redirect, jsonify
from subprocess import Popen, PIPE
from flask.ext.login import login_required, current_user

home = Blueprint('home', __name__)

#routes for home
@home.route('/')
@login_required
def index():
    return render_template("home/index.html")


@home.route('/pml_source_submit', methods=['POST'])
@login_required
def pml_source_submit():
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    tmp_filename = "/tmp/pmlcheck_output"
    source = request.form["data"]
    f = open(tmp_filename, "w")
    f.write(source)
    f.close()
    try:
            p = Popen(["peos/pml/check/pmlcheck", tmp_filename], stdin=PIPE, stdout=PIPE, stderr=PIPE)
    except OSError as e:
        return render_template("home/pml_res_fatal_error.html", error = e)

    prog_out, err = p.communicate()
    if p.returncode > 0:
        return jsonify(output = err)
        # return render_template("home/index.html", error = err)
        # return render_template("home/pml_res_error.html", error = err)
    return jsonify(output = prog_out)
    # return render_template("home/index.html", output = prog_out)
    # return render_template("home/pml_res.html", output = prog_out)
