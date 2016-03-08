build:  
	@echo "Fetching pmlcheck"
	git submodule init
	git submodule update

	@echo "Compiling pmlcheck"
	cd peos && make

	@echo "Creating virtualenv"
	virtualenv venv
	. venv/bin/activate

	@echo "installing additional python requirements"
	venv/bin/pip install -r requirements

	@echo "building ace"
	cd app/static/ace && sudo npm install && node ./Makefile.dryice.js

	mkdir -p uploads
test:
	@echo "Running Python unit tests"
	python ./tests/tests_unit.py
	python runserver.py > /dev/null &\
	cd ./tests && ../venv/bin/python tests_phantomJS.py && cd .. &&\
	curl --data "" lvh.me:5000/shutdown

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
	venv/bin/pip uninstall -y -r requirements 
	cd peos && make clean && cd ..

distclean:
	make clean
	rm -rf venv
	git submodule deinit -f .
