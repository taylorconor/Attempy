var page = require('webpage').create(),
system = require('system'),
loadInProgress = false,
testindex = 0,
fs = require('fs'),
debug = false;

page.onConsoleMessage = function (msg) {
  if (debug) {
    console.log(msg);
  }
};

page.onError = function(msg, trace) {
  var msgStack = ['ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function + '")' : ''));
    });
  }
  if (debug) {
    console.error(msgStack.join('\n'));
  }
};

page.onFilePicker = function(oldFile) {
  console.log('Listen event. oldFile = '+oldFile);
};

page.onResourceError = function(resourceError) {
  if (debug) {
    console.log("*** resource error! ***");
    console.log("Reason: "+resourceError.errorString+", URL: "+resourceError.url);
    console.log("***********************");
  }
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  if (debug) {
    console.log("*** received console message! sourceId: "+sourceId+", lineNum: "+lineNum);
    console.log(msg);
  }
}

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

function click(el){
  var ev = document.createEvent("MouseEvent");
  ev.initMouseEvent(
    "click",
    true /* bubble */, true /* cancelable */,
    window, null,
    0, 0, 0, 0, /* coordinates */
    false, false, false, false, /* modifier keys */
    0 /*left*/, null
  );
  el.dispatchEvent(ev);
}

var steps = [
  // test 1: landing page
  function() {
    page.open("http://lvh.me:5000");
    print_update("Testing landing page...");
  },
  function() {
    if (!test_title("Login", page)) {
      print_error("Are you sure the flask server is running?");
      return true;
    }
    var test_elem = page.evaluate(function() {
      return document.querySelector(".form-signin");
    });
    if (!test_elem) {
      print_error("Could not find login form on landing page");
      return true;
    }
    print_success("Landing page load OK");
  },
  // end test 1
  // test 2: Google OAuth authentication
  function() {
    print_update("Testing feature: Authentication (Google OAuth)...");
    page.evaluate(function(click) {
      click(document.querySelector("a[class~=btn-google]"));
    }, click);
  },
  function() {
    if (!test_title("Sign in - Google Accounts", page)) { return true; }
    print_success("Authentication (Google OAuth) working!");
  },
  // end test 2
  function() {
    page.open("http://lvh.me:5000");
  },
  // test 3: Facebook OAuth authentication
  function() {
    print_update("Testing feature: Authentication (Facebook OAuth)...");
    page.evaluate(function(click) {
      click(document.querySelector("a[class~=btn-facebook]"));
    }, click);
  },
  function() {
    if (!test_title("Log into Facebook | Facebook", page)) { return true; }
    print_success("Authentication (Facebook OAuth) working!");
  },
  // end test 3
  function() {
    page.open("http://lvh.me:5000");
  },
  // test 4: GitHub OAuth authentication
  function() {
    print_update("Testing feature: Authentication (GitHub OAuth)...");
    page.evaluate(function(click) {
      click(document.querySelector("a[class~=btn-twitter]"));
    }, click);
  },
  function() {
    if (!test_title("Sign in to GitHub · GitHub", page)) { return true; }
    print_success("Authentication (GitHub OAuth) working!");
  },
  // end test 4
  function() {
    page.open("http://lvh.me:5000");
  },
  // test 5: Local authentication
  function() {
    page.open("http://lvh.me:5000/register");
    print_update("Testing feature: Authentication (local)...");
  },
  function() {
    if (!test_title("Register", page)) { return true; }
    page.evaluate(function() {
      document.querySelector("input[name=email]").setAttribute("value", "test@test.com");
      document.querySelector("input[name=name]").setAttribute("value", "Test User");
      document.querySelector("input[name=password]").setAttribute("value", "test");
      document.querySelector("form[class=form-signin]").submit();
    });
  },
  function() {
    if (!test_title("Login", page)) {
      print_error("Are you sure you purged the database before running the tests?");
      return true;
    }
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
    print_success("Authentication (local) working!");
  },
  // end test 5
  // test 6: file upload
  function() {
    var filename = fs.workingDirectory+"/testfile.pml";
    page.uploadFile("input[id=file]", filename);
    page.evaluate(function() {
      document.querySelector("form[id=upload]").submit();
    });
    print_update("Testing feature: File upload");
  },
  function() {
    var text = page.evaluate(function() {
      return ace.edit("editor").getValue();
    });
    if (text) {
      print_error("File upload returned unexpected result!");
      return true;
    }
    print_success("File upload working!");
  },
  // end test 6
  // test 7: file save
  function() {
    page.evaluate(function(click) {
      ace.edit("editor").setValue("process P { broken_token }");
      click(document.querySelector("a[id=submit_save]"));
    }, click);
    print_update("Testing feature: File save");
  },
  function() {
    page.evaluate(function(click) {
      document.querySelector("input[id=newFileName]").setAttribute("value", "test_file");
      click(document.querySelector("button[id=createNewName]"));
    }, click);
  },
  function() {
    var sidebar = page.evaluate(function(click) {
      return document.querySelector("ul[class~=tree]").outerHTML;
    });
    if (sidebar.indexOf("test_file.pml") == -1) {
      print_error("File save didn't work!");
      return true;
    }
    print_success("File save working!");
  },
  // end test 7
  // test 8: check syntax
  function() {
    page.evaluate(function(click) {
      click(document.querySelector("a[id=check_syn]"));
    }, click);
    print_update("Testing feature: Check syntax");
  },
  function() {
    var bell_style = page.evaluate(function() {
      return document.querySelector("i[id=syn_out_bell]").getAttribute("style");
    });
    if (bell_style !== "color: red; ") {
      print_error("Check syntax didn't spot an error in the syntax!");
      return true;
    }
    print_success("Check syntax working!");
  },
  // end test 8
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
    print_success("All tests successful!");
    phantom.exit();
  }
}, 1500);
