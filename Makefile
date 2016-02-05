
build:
	git submodule init
	git submodule update
	cd peos && make && make install
