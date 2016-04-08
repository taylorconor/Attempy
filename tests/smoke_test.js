var page = require('webpage').create(),
system = require('system'),
loadInProgress = false,
testindex = 0,
feature = 1,
numFeatures = 18,
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

function print_update(msg) {
  var snum = (feature < 10 && numFeatures >= 10)? "0"+feature : ""+feature;
  console.log("["+snum+"/"+numFeatures+"] "+msg);
  feature++;
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

function rclick(el){
  var ev = document.createEvent("MouseEvent");
  ev.initMouseEvent(
    "click",
    true /* bubble */, true /* cancelable */,
    window, null,
    0, 0, 0, 0, /* coordinates */
    false, false, false, false, /* modifier keys */
    2 /*left*/, null
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
    // check that the signin form is displayed (to prove that the page rendered properly)
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
  },
  // test 3: Facebook OAuth authentication
  function() {
    print_update("Testing feature: Authentication (Facebook OAuth)...");
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
  },
  // test 4: GitHub OAuth authentication
  function() {
    print_update("Testing feature: Authentication (GitHub OAuth)...");
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
  },
  // test 5: Local authentication
  function() {
    print_update("Testing feature: Authentication (local)...");
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
  },
  // end test 5
  // test 6: file upload
  function() {
    print_update("Testing feature: File upload");
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
  },
  // end test 6
  // test 7: file save
  function() {
    print_update("Testing feature: File save");
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
  },
  // end test 7
  // test 8: check syntax
  function() {
    print_update("Testing feature: Check syntax");
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
  },
  // end test 8
  // test 9: error highlighting
  function() {
    print_update("Testing feature: Error highlighting");
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
  },
  // test 10: Keybinding emulation
  function() {
    print_update("Testing feature: Keybinding emulation");
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
  },
  // test 11: code completion
  function() {
    print_update("Testing feature: Code completion");
    var completers = page.evaluate(function() {
      return ace.edit("editor").completers;
    });
    if (completers == null) {
      print_error("Code completion not working!");
      return true;
    }
    print_success("Code completion ok!");
  },
  // end test 11
  // test 12: graphical editor
  function() {
    print_update("Testing feature: Graphical Editor");
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
  function() {
    page.evaluate(function() {
      insert('action');
    });
  },
  function() {
    page.evaluate(function(rclick) {
      rclick(document.getElementById('j_1'));
    }, rclick);
  },
  // test 13: Scripts
  function() {
    print_update("Testing feature: Scripts");
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.getElementById("script");
    });
    if (!test_elem) {
      print_error("Scripts not found!");
      return true;
    }
    print_success("Scripts working!");
  },
  //end test 13
  // test 14: Resources
  function() {
    print_update("Testing feature: Resources");
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.querySelector("div[class=requires]");
    });
    if (!test_elem) {
      print_error("Reources not found!");
      return true;
    }
    print_success("Resources working!");
  },
  //end test 14
  // test 15: Agents
  function() {
    print_update("Testing feature: Agents");
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.querySelector("div[class=agent]");
    });
    if (!test_elem) {
      print_error("Agents not found!");
      return true;
    }
    print_success("Agents working!");
  },
  //end test 15
  // test 16: Predicates
  function() {
    print_update("Testing feature: Predicates");
    if (!test_title("Editor", page)) { return true; }
    var test_elem = page.evaluate(function() {
      return document.querySelector("div[class=provides]");
    });
    if (!test_elem) {
      print_error("Predicates not found!");
      return true;
    }
    print_success("Predicates working!");
  },
  //end test 16
  // test 17: Syntax enforcement
  function() {
    print_update("Testing feature: Syntax enforcement");
    if (!test_title("Editor", page)) { return true; }
    page.evaluate(function(click) {
      document.querySelector("input[class=provResIn]").setAttribute("value", "random_val");
      click(document.querySelector("button[id=submitAttrs]"));
    }, click);
  },
  function() {
    var test_elem = page.evaluate(function() {
      return document.querySelector("div[id=errorMsg]").innerHTML;
    });
    if (test_elem.indexOf("Attributes cannot exist without resource") == -1) {
      print_error("Syntax enforcement did not spot an error!");
      return true;
    }
    print_success("Syntax enforcement working!");
  },
  //end test 17
  // test 18: Agent coloured actions
  function() {
    print_update("Testing feature: Agent coloured actions");
    if (!test_title("Editor", page)) { return true; }
    page.evaluate(function(click) {
      document.querySelector("input[class=provResIn]").setAttribute("value", "");
      document.querySelector("input[id=agent_res]").setAttribute("value", "Fred");
      click(document.querySelector("button[id=submitAttrs]"));
    }, click);
  },
  function() {
    var test_elem = page.evaluate(function() {
      return document.getElementById("paper").outerHTML;
    });
    if (!test_elem || test_elem.indexOf("v-4") == -1) {
      print_error("Agent coloured actions did not work!");
      return true;
    }
    print_success("Agent coloured actions working!");
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
    console.log("[DONE!] All tests successful!");
    phantom.exit();
  }
}, 2000);
