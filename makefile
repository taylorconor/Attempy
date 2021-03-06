build:
	@echo "Fetching pmlcheck"
	git submodule init
	git submodule update

	@echo "Compiling pmlcheck"
	cd peos && make

	@echo "Creating virtualenv"
	export PYTHONPATH=
	virtualenv --no-site-packages --python=/usr/bin/python2.7 venv
	. venv/bin/activate

	@echo "installing additional python requirements"
	venv/bin/pip2.7 install -r requirements

	@echo "building ace"
	sudo ln -fs /usr/bin/nodejs /usr/bin/node
	cd app/static/ace && sudo npm install && node ./Makefile.dryice.js

	mkdir -p uploads
	mkdir -p tests/uploads
test:
	$(shell bash -c 'read -s -p "Tests will only work if you first delete test.db (if it exists), *then* start the flask server. If you have done this, hit enter to begin the tests"')
	@echo "\n\n\n"
	@echo "*************************"
	@echo "Running Python unit tests"
	@echo "*************************"
	cd tests && ../venv/bin/python tests_unit.py && cd ..
	@echo "\n\n\n"
	@echo "*************************"
	@echo "Running API tests"
	@echo "*************************"
	cd tests && ../venv/bin/python tests_functional.py && cd ..
	@echo "\n\n\n"
	@echo "*************************"
	@echo "** Running Smoke tests **"
	@echo "*************************"
	cd tests && phantomjs --ssl-protocol=any --ignore-ssl-errors=true smoke_test.js

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
	cd peos && make clean && cd ..
	cd app/pml_to_json/parser && make clean
	venv/bin/pip uninstall -y -r requirements

distclean:
	make clean
	rm -rf venv
	git submodule deinit -f .
