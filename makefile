build:  
	@echo "Fetching pmlcheck"
	git submodule init
	git submodule update

	@echo "Compiling pmlcheck"
	cd peos && make && sudo make install
	
	@echo "installing additional python requirements"
	pip install -r requirements

	@echo "building ace"
	cd app/static/ace && npm install && node ./Makefile.dryice.js 
	cd ../../..

	npm install qunit

test:
	@echo "Running Python unit tests"
	python ./tests.py

	@echo "Running Javascript unit tests"
	./node_modules/.bin/qunit -c app/static/js/tests/tests.js -t app/static/js/tests/tests.js

install:

verify:
	@echo "testing pmlcheck"
ifeq ($(wildcard peos/pml/check/pmlcheck),)
	@echo "pmlcheck has not been built!"
	exit 1; 
else
	@echo "pmlcheck OK"
endif
	@echo "verification passed"

clean:
	@echo "Cleaning"
	find . -name "*.pyc" -type f -delete
	@echo "Finished cleaning"
	pip uninstall -y -r requirements 
	cd peos && make clean && cd ..

distclean:
	make clean
	git submodule deinit -f .
