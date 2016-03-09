var page = require('webpage').create(),
    system = require('system'),
    loadInProgress = false,
    testindex = 0,
    debug = false,
    reg_no = system.args[1],
    pac_no = system.args[2];

page.onConsoleMessage = function (msg) {
    if (debug) {
        console.log(msg);
    }
};

page.onLoadStarted = function() {
    loadInProgress = true;
    if (debug) {
        console.log("load started");
    }
};

page.onLoadFinished = function() {
    loadInProgress = false;
    if (debug) {
        console.log("load finished");
    }
};

function print_update(msg) {
	console.log("[..] "+msg);
}

function print_error(msg) {
	console.log("[!!] "+msg);
}

function print_success(msg) {
	console.log("[OK] "+msg);
}

function test_title(expected, page) {
	if (page.title != expected) {
		print_error("Unexpected page title! (expected = "+expected+", title = "+page.title+")");
	}
	return page.title == expected;
}

var steps = [
    function() {
        page.open("http://lvh.me:5000");
	print_update("Testing initial page load...");
    },
    function() {
	if (!test_title("Login", page)) { return true; }
	var test_elem = page.evaluate(function() {
		return document.querySelector(".form-signin");
	});
	if (!test_elem) {
		print_error("Initial page load broken! (could not find element 'test')");
		return true;
	}
    },
    function() {
	page.open("http://lvh.me:5000/register");
	print_update("Navigating to registration page...");
    },
    function() {
	if (!test_title("Register", page)) { return true; }
	page.evaluate(function() {
		document.querySelector("input[name=email]").setAttribute("value", "test@test.com");
		document.querySelector("input[name=name]").setAttribute("value", "Test User");
		document.querySelector("input[name=password]").setAttribute("value", "test");
		document.querySelector("form[class=form-signin]").submit();
	});
	print_update("Testing user creation...");
    },
    function() {
	if (!test_title("Login", page)) { return true; }
	page.evaluate(function() {
		document.querySelector("input[name=email]").setAttribute("value", "test@test.com");
		document.querySelector("input[name=password]").setAttribute("value", "test");
		document.querySelector("form[class=form-signin]").submit();
	});
    },
    function() {
	if (!test_title("Editor", page)) { return true; }
	var test_elem = page.evaluate(function() {
		return document.getElementById("nav-name");
	});
	if (!test_elem) {
		print_error("Registration process broken! (could not log back in with registered details)");
		return true;
	}
	print_success("Registration & login smoke test successful!");
    }
];

interval = setInterval(function() {
    if (!loadInProgress && typeof steps[testindex] == "function") {
        if (debug) {
            console.log("step " + (testindex + 1));
        }
        var err = steps[testindex]();
	if (err) {
		print_error("Tests failed. Quitting.");
		phantom.exit();
	}
        testindex++;
    }
    if (typeof steps[testindex] != "function") {
        phantom.exit();
    }
}, 1500);
