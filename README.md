# Attempy

This project so far allows you to enter PML code wich will be parsed and the results passed out to the user. 

##Pre-Requisites

The project is designed to be run on Ubuntu 14.04

A number of supporting packages are required before installation. These can be installed by running:
<pre>
sudo apt-get update
sudo apt-get install build-essential git tcl-dev flex bison byacc check expect ncurses-dev libreadline-dev libxml2-dev python-pip nodejs npm nodejs-legacy
sudo pip install virtualenv
</pre>

##Installation instructions
1. Execute the makefile by running `make` in the project's root directory.
2. Start Attempy by running: `venv/bin/python runserver.py`.
3. The web application can then be accessed at `lvh.me:5000`.

Note: If the application is not accessed on the domain lvh.me on port 5000, social authentication will not function

##Feature List

A text input and code parsing. 

###Authentication
Authentication works with Google, Github, Facebook, or alternatively a local account for the IDE
Authenticating is required to access the editor

###File upload
From the editor, file upload can be accessed from the nav bar at the top, under the edit menu. The user can upload a .pml file which is then loaded into the editor

###Error highlighting
When a programs syntax is checked, the errors given from pmlcheck will be parsed, and the offending portion of the code will be highlighted

###File Panel
Allows creation and movement between files and directories.

###Code Completion
Keyword and variable name completion using "ctrl space"

###Keybinding Emulation
Accessable via settigns in navigation bar
