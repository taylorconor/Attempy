from flask import Blueprint, Flask, render_template, request, redirect
from subprocess import Popen, PIPE

home = Blueprint('home', __name__)

#routes for home
@home.route('/')
def index():
    return render_template("home/index.html")

@home.route('/pml_source_submit', methods=['POST'])
def pml_source_submit():
    #TODO: make this temp file user-unique, so users don't overwrite each others tmp files
    tmp_filename = "/tmp/pmlcheck_output"
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
