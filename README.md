# Attempy

The purpose of this is to have all dependencies set up so that the project can be more easily developed in the upcoming sprints. This README will inform the user of the software that is required to run this project as well as a list of features and test for the project.

##Pre-Requisites

The project is designed to be run on Ubuntu 14.04

A number of supporting packages are required before installation. These can be installed by running:
<pre>
sudo apt-get install build-essential git tcl-dev flex bison byacc check expect ncurses-dev libreadline-dev libxml2-dev python-pip npm nodejs
</pre>

##Installation instructions
1. Execute the makefile by running `sudo make` in the project's root directory.
2. Start Attempy by running: `python runserver.py`.
3. The web application can then be accessed at `localhost:5000`.
