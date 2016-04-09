# Attempy

This project so far allows you to enter PML code which will be parsed and the results passed out to the user.

##Pre-Requisites

The project is designed to be run on Ubuntu 14.04

A number of supporting packages are required before installation. These can be installed by running:
<pre>
sudo apt-get update
sudo apt-get install build-essential git tcl-dev flex bison byacc check expect ncurses-dev libreadline-dev libxml2-dev python-pip nodejs npm libxslt-dev python-dev python-virtualenv phantomjs 
</pre>

##Installation instructions
1. Execute the makefile by running `make` in the project's root directory.
2. Start Attempy by running: `venv/bin/python2.7 runserver.py`.
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

###Warning Highlighting
Warning icons are displayed beside the line numbers. When hovered over these will display the warnings associated with that line. The warnings are also displayed when the bell icon is clicked on. These warnings can be clicked on to bring you to the line containing the warning.

###Authentication
Authentication works with Google, Github, Facebook, or alternatively a local account for the IDE
Authenticating is required to access the editor.
To authenticate, run the server as outlined in the above instructions and navigate to “http://lvh.me:5000/”. This should bring you to the login screen, if not previously authenticated. Either create a local account by clicking “Register”, and then login using the forms, or login using either of the 3 social authentication mechanisms.

Users should register with only one method, and continue logging in with this method every time they wish to use the system. Information regarding user accounts is held in “test.db” in the root directory.

###Boxes arrows
The graphical editor can be accessed from the navigation bar View -> Graphical Editor. Elements can be added to the Graphical Editor using the 'Insert' menu. The graphical editor should be read from left to right; each vertical 'column' represents one program flow step. That's why elements inside Branches nest vertically, and element inside Iterations nest horizontally.

###Scripts
Scripts can be added to actions in the action modal menu, which is accessed by *right clicking* on an action.

###Resources
Resources can be filled in in all action boxes. Resources are broken down into requires, provides and tools. Each field is filled in separately. These can be accessed in the action modal menu.

###Agents
Agents can be filled in in all action boxes, in the action modal menu.

###Predicates
Predicates can be added in Resources (requires, provides & tools) and Agents. They can be added in the action modal menu.

###Agent Coloured Actions
Actions will be coloured based on the agents associated with them. If multiple agents are associated with an action, multiple colours will be applied.

###Syntax Enforcement
The design of boxes and arrows makes illegal syntax impossible. Syntax is enforced on the input fields in that incorrect names (that do not begin with a letter or '_' are not allowed) and attributes cannot exist without resources. If an incorrect value is entered in a field the data will not be allowed to be submited and an error message will appear.

###Basic PML Display
This generated a JSON representation of the PML source for use with the boxes and arrows component. Unit tests for this are run by running make test. Basic implementation of it currently present.

###PML generator

##Notes
To create a new, empty, file, click the file button next to Your Files on the left hand side of the screen

##Known issues
Deleting a recently "uploaded" file and then reloading the page will resurrect the file.
