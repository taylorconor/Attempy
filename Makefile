
uild:
	git submodule init
	git submodule update
	cd peos && make && sudo make install
