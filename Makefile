
build:
	git submodule init
	git submodule update
	cd peos && make && sudo make install
	# pmlcheck is now built in peos/pml/check/pmlcheck
