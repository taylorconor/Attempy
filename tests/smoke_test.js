var page = require('webpage').create(),
system = require('system'),
loadInProgress = false,
testindex = 0,
feature = 1,
numFeatures = 13,
fs = require('fs'),
debug = false;

page.onConsoleMessage = function (msg) {
  if (debug) {
    console.log(msg);
  }
};

page.settings.resourceTimeout = 5000; // 5 seconds
page.onResourceTimeout = function(e) {
  // retry on timetout
  page.open(e.url);
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

function print_update(msg, num, max) {
  var snum = (num < 10 && max >= 10)? "0"+num : ""+num;
  console.log("["+snum+"/"+max+"] "+msg);
}

function print_error(msg) {
  console.log("[ !!! ] "+msg);
}

function print_success(msg) {
  console.log("[ OK! ] "+msg);
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
    print_update("Testing landing page...", feature, numFeatures);
  },
  function() {
    if (!test_title("Login", page)) {
      print_error("Are you sure the flask server is running?");
      return true;
    }
    // check that the signin form is displayed (to prove that the page rendered properly)
    var test_elem = page.evaluate(function() {
      return document.querySelector(".form-signin");
    });
    if (!test_elem) {
      print_error("Could not find login form on landing page");
      return true;
    }
    print_success("Landing page load OK");
    feature++;
  },
  // end test 1
  // test 2: Google OAuth authentication
  function() {
    print_update("Testing feature: Authentication (Google OAuth)...", feature, numFeatures);
    page.evaluate(function(click) {
      // click the "sign in with Google" button
      click(document.querySelector("a[class~=btn-google]"));
    }, click);
  },
  function() {
    // we should be redirected to Google's signin site
    if (!test_title("Sign in - Google Accounts", page)) { return true; }
    print_success("Authentication (Google OAuth) working!");
  },
  // end test 2
  function() {
    page.open("http://lvh.me:5000");
    feature++;
  },
  // test 3: Facebook OAuth authentication
  function() {
    print_update("Testing feature: Authentication (Facebook OAuth)...", feature, numFeatures);
    page.evaluate(function(click) {
      // click the "sign in with Facebook" button
      click(document.querySelector("a[class~=btn-facebook]"));
    }, click);
  },
  function() {
    // we should be redirected to Facebook's signin site
    if (!test_title("Log into Facebook | Facebook", page)) { return true; }
    print_success("Authentication (Facebook OAuth) working!");
  },
  // end test 3
  function() {
    page.open("http://lvh.me:5000");
    feature++;
  },
  // test 4: GitHub OAuth authentication
  function() {
    print_update("Testing feature: Authentication (GitHub OAuth)...", feature, numFeatures);
    page.evaluate(function(click) {
      // click the "sign in with Github" button
      click(document.querySelector("a[class~=btn-twitter]"));
    }, click);
  },
  function() {
    // we should be redirected to Github's signin site
    if (!test_title("Sign in to GitHub · GitHub", page)) { return true; }
    print_success("Authentication (GitHub OAuth) working!");
  },
  // end test 4
  function() {
    page.open("http://lvh.me:5000");
    feature++;
  },
  // test 5: Local authentication
  function() {
    print_update("Testing feature: Authentication (local)...", feature, numFeatures);
    page.open("http://lvh.me:5000/register");
  },
  function() {
    if (!test_title("Register", page)) { return true; }
    // add our test details to the "register" page
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
    // log in with the details we just registered with
    page.evaluate(function() {
      document.querySelector("input[name=email]").setAttribute("value", "test@test.com");
      document.querySelector("input[name=password]").setAttribute("value", "test");
      document.querySelector("form[class=form-signin]").submit();
    });
  },
  function() {
    // we should now reach the editor page, which can only be reached after a successful sign in
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.getElementById("nav-name");
    });
    if (!test_elem) {
      print_error("Registration process broken! (could not log back in with registered details)");
      return true;
    }
    print_success("Authentication (local) working!");
    feature++;
  },
  // end test 5
  // test 6: file upload
  function() {
    print_update("Testing feature: File upload", feature, numFeatures);
    var filename = fs.workingDirectory+"/testfile.pml";
    page.uploadFile("input[id=file]", filename);
    page.evaluate(function() {
      document.querySelector("form[id=upload]").submit();
    });
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
    feature++;
  },
  // end test 6
  // test 7: file save
  function() {
    print_update("Testing feature: File save", feature, numFeatures);
    page.evaluate(function(click) {
      // add some code to the editor
      ace.edit("editor").setValue("process P { broken_token }");
      click(document.querySelector("a[id=submit_save]"));
    }, click);
  },
  function() {
    page.evaluate(function(click) {
      // save the file as "test_file.pml"
      document.querySelector("input[id=newFileName]").setAttribute("value", "test_file");
      click(document.querySelector("button[id=createNewName]"));
    }, click);
  },
  function() {
    var sidebar = page.evaluate(function(click) {
      return document.querySelector("ul[class~=tree]").outerHTML;
    });
    // verify that "test_file.pml" is now shown in the sidebar
    if (sidebar.indexOf("test_file.pml") == -1) {
      print_error("File save didn't work!");
      return true;
    }
    print_success("File save working!");
    feature++;
  },
  // end test 7
  // test 8: check syntax
  function() {
    print_update("Testing feature: Check syntax", feature, numFeatures);
    page.evaluate(function(click) {
      // run "check syntax" on our broken code
      click(document.querySelector("a[id=check_syn]"));
    }, click);
  },
  function() {
    // the code is broken so the bell should go red
    var bell_style = page.evaluate(function() {
      return document.querySelector("i[id=syn_out_bell]").getAttribute("style");
    });
    if (bell_style !== "color: red; ") {
      print_error("Check syntax didn't spot an error in the syntax!");
      return true;
    }
    print_success("Check syntax working!");
    feature++;
  },
  // end test 8
  // test 9: error highlighting
  function() {
    print_update("Testing feature: Error highlighting", feature, numFeatures);
    var annotations = page.evaluate(function() {
      return editor.getSession().getAnnotations();
    });
    // the code is broken, so there should be at least one error annotation
    if (annotations.length != 1 || annotations[0].type !== "error") {
      print_error("Error highlighting not working!");
      return true;
    }
    print_success("Error highlighting working!");
  },
  //end test 9
  function() {
    page.open("http://lvh.me:5000");
    feature++;
  },
  // test 10: Keybinding emulation
  function() {
    print_update("Testing feature: Keybinding emulation", feature, numFeatures);
    page.evaluate(function(click) {
      click(document.querySelector("a[id=editor_settings]"));
    }, click);
  },
  function() {
    var style = page.evaluate(function() {
      return document.querySelector("div[id=editor_settings_pane]").getAttribute("style");
    });
    if (style != "display: block; ") {
      print_error("Editor settings pane did not appear!");
      return true;
    }
    page.evaluate(function() {
      document.querySelector("select[id=keybinding_select]").selectedIndex = 1;
    });
  },
  function() {
    page.evaluate(function(click) {
      click(document.querySelector("button[id=settings_done]"));
    }, click);
  },
  function() {
    var keybinding = page.evaluate(function() {
      return ace.edit("editor").getKeyboardHandler();
    });
    if (keybinding === "") {
      print_error("Keybinding not working!");
      return true;
    }
    print_success("Keybinding emulation ok!");
  },
  // end test 10
  function() {
    page.evaluate(function(click) {
      click(document.querySelector("a[id=editor_settings]"));
    }, click);
  },
  function() {
    var style = page.evaluate(function() {
      return document.querySelector("div[id=editor_settings_pane]").getAttribute("style");
    });
    page.evaluate(function() {
      document.querySelector("select[id=keybinding_select]").selectedIndex = 0;
    });
  },
  function() {
    page.evaluate(function(click) {
      click(document.querySelector("button[id=settings_done]"));
    }, click);
  },
  function()  {
    page.open("http://lvh.me:5000");
    feature++;
  },
  // test 11: code completion
  function() {
    print_update("Testing feature: Code completion", feature, numFeatures);
    page.evaluate(function() {
      // half-type the keyword "process"; the code completion should expand it
      ace.edit("editor").setValue("proce");
    });
  },
  function() {
    var rect = page.evaluate(function() {
      return document.querySelector("div[id=editor]").getBoundingClientRect();
    });
    // click inside the editor to give it focus
    page.sendEvent('click', rect.left + rect.width / 2, rect.top + rect.height / 2);
  },
  function() {
    // simulate Ctrl-Space, the shortcut to run the code completion
    page.sendEvent('keypress', page.event.key.Space, null, null, 0x04000000);
  },
  function() {
    // simulate Enter key to choose the first code completion suggestion
    page.sendEvent('keypress', page.event.key.Return, null, null, 0x0);
  },
  function() {
    var text = page.evaluate(function() {
      return ace.edit("editor").getValue();
    });
    // code completion should have expanded "proce" to "process"
    if (text != "process") {
      print_error("Process: " + text);
      print_error("Code completion didn't work!");
      return true;
    }
    print_success("Code completion ok!");
    feature++;
  },
  // end test 11
  // test 12: graphical editor
  function() {
    print_update("Testing feature: Graphical Editor", feature, numFeatures);
    page.open("http://lvh.me:5000/graphical_editor");
  },
  function() {
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.getElementById("paper");
    });
    if (!test_elem) {
      print_error("Unable to load graphical editor!");
      return true;
    }
    print_success("Graphical editor working!");
  },
  // end test 12
  // test 13:
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
}, 2000);
