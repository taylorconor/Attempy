
build:
	# build pmlcheck in peos/pml/check/pmlcheck	
	git submodule init
	git submodule update
	cd peos && make && sudo make install
	
	# install python modules from requirements file
	sudo pip install -r requirements
