# Attempy

This project so far allows you to enter PML code wich will be parsed and the results passed out to the user. 

##Pre-Requisites

The project is designed to be run on Ubuntu 14.04

A number of supporting packages are required before installation. These can be installed by running:
<pre>
sudo apt-get update
sudo apt-get install build-essential git tcl-dev flex bison byacc check expect ncurses-dev libreadline-dev libxml2-dev python-pip nodejs npm nodejs-legacy
</pre>

##Installation instructions
1. Execute the makefile by running `make` in the project's root directory.
2. Start Attempy by running: `python runserver.py`.
3. The web application can then be accessed at `lvh.me:5000`.

Note: If the application is not accessed on the domain lvh.me on port 5000, social authentication will not function

##Feature List

A text input and code parsing. 
