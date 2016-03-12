# Attempy

This project so far allows you to enter PML code which will be parsed and the results passed out to the user. 

##Pre-Requisites

The project is designed to be run on Ubuntu 14.04

A number of supporting packages are required before installation. These can be installed by running:
<pre>
sudo apt-get update
sudo apt-get install build-essential git tcl-dev flex bison byacc check expect ncurses-dev libreadline-dev libxml2-dev python-pip nodejs libxslt-dev python-dev python-virtualenv
</pre>

##Installation instructions
1. Execute the makefile by running `make` in the project's root directory.
2. Start Attempy by running: `venv/bin/python runserver.py`.
3. The web application can then be accessed at `lvh.me:5000`.

Note: If the application is not accessed on the domain lvh.me on port 5000, social authentication will not function

##Feature List


###File upload
From the editor, file upload can be accessed from the nav bar at the top, under the file menu. The uploaded file must end in the “.pml” extension. When a file is uploaded it is displayed in the editor. 

###Syntax analysis
Interfaces with PEOS to analyse the PML source file. This can be accessed by clicking File > Check Syntax. Results from the syntax analysis can be viewed by clicking on the bell icon in the left of the navigation bar. Ctrl-B or Cmd-B also analyses the current file.

###File save
Files can be saved under the file menu in the navigation bar at the top of the editor. Files can be accessed using the file panel on the left of the screen. New Files can be created by clicking on the icon in the file panel. Ctrl-S or Cmd-S saves the current file.

###Code editor
Includes code folding, line numbers, indentation, bracket matching, and search and replace. All editor features are automatic except for search and replace, which can be invoked by typing Ctrl-F or Cmd-F.

###Syntax highlighting
PML-specific keywords are highlighted.

###Code completion
Suggests PML-specific keywords, as well as resource names. This can be invoked while typing, with the shortcut Ctrl-Space or Cmd-Space.

###Editor keybinding emulation
Allows Vim and Emacs emulation, as well as plain emulation (mouse-click editing). The emulation can be changed by clicking Edit > Editor Settings. A user’s keybinding settings will be saved, and will persist between their login sessions.

###Error highlighting
Displays PML syntax errors inline in the editor.
Error highlighting runs when the syntax is checked with “File->Check Syntax” in the navigation bar at the top of the editor. Error highlighting parses the error returned from peos and uses the line  number / offending word to highlight. 
To clear errors, change the code and re-check the syntax. 

###Authentication
Authentication works with Google, Github, Facebook, or alternatively a local account for the IDE
Authenticating is required to access the editor.
To authenticate, run the server as outlined in the above instructions and navigate to “http://lvh.me:5000/”. This should bring you to the login screen, if not previously authenticated. Either create a local account by clicking “Register”, and then login using the forms, or login using either of the 3 social authentication mechanisms. 

Users should register with only one method, and continue logging in with this method every time they wish to use the system. Information regarding user accounts is held in “test.db” in the root directory. 

###Boxes arrows
The graphical editor can be accessed from the navigation bar view->graphical editor. Actions, Branches, Iterations and Sequences can be added from the insert menu in the navigation bar. Sequences, Iterations and Branches can contain sub modules. The diagram is read from left to right. 

###Scripts
Scripts can be filled in inside all action boxes.

###Resources
Resources can be filled in in all action boxes. Resources are broken down into requires, provides and tools. Each field is filled in separately.

###Agents
Agents can  be filled in in all action boxes.

###Predicates
Predicates can be added in Resources and Agents.


