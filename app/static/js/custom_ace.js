// create AceGrammar partial JSON grammar for PML
var xml_grammar = {
		
	"RegExpID"                          : "RE::",
	
	"Extra"                             : {

	    "fold"                          : "brace"

	},
	    
	// Style model
	"Style"                             : {
	    
	     "comment"                      : "comment"
	    ,"keyword"                      : "keyword"
	    ,"operator"                     : "operator"
	    ,"identifier"                   : "identifier"
	    ,"property"                     : "constant.support"
	    ,"number"                       : "constant.numeric"
	    ,"string"                       : "string"
	    
	},

	// Lexical model
	"Lex"                               : {
	    
	     "comment"                      : {"type":"comment","tokens":[
					    [  "/*",   "*/" ]
					    ]}
	    ,"identifier"                   : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/"
	    ,"property"                     : "RE::/[_A-Za-z$][_A-Za-z0-9$]*/"
	    ,"number"                       : [
					    // floats
					    "RE::/\\d*\\.\\d+(e[\\+\\-]?\\d+)?/",
					    "RE::/\\d+\\.\\d*/",
					    "RE::/\\.\\d+/",
					    // integers
					    "RE::/[1-9]\\d*(e[\\+\\-]?\\d+)?L?/",
					    // just zero
					    "RE::/0(?![\\dx])/"
					    ]
	    ,"string"                       : {"type":"escaped-block","escape":"\\","tokens":
					    // start, end of string (can be the matched regex group ie. 1 )
					    [ "RE::/(['\"])/",   1 ]
					    }
	    ,"operator"                     : {"tokens":[
					    "&&", "||", "<=", ">=", "==", "!=", "<", ">", "!", "."
					    ]}
	    ,"delimiter"                    : {"tokens": [
					    "(", ")", "[", "]", "{", "}", ",", "=", ";", "?", ":",
					    "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "++", "--",
					    ">>=", "<<="
					    ]}
	    ,"keyword"                      : {"autocomplete":true, "tokens":[ 
					    "action", "agent", "branch", "executable", "iteration", "manual", "process",
					    "provides", "requires", "script", "selection", "select", "sequence", "task", "tool"
					    ]}
	},

	// Syntax model
	"Syntax"                            : {
	    
	    "dot_property"                  : {"sequence":[".", "property"]}
	    ,"pml"                           : "comment | number | string | keyword | operator | (('}' | ')' | identifier | dot_property) dot_property*)"

	},

	// what to parse and in what order
	"Parser"                            : [ ["pml"] ]

};

// parse the grammar into an ACE syntax-highlight mode
var xml_mode = AceGrammar.getMode( xml_grammar );

// enable code-folding
xml_mode.supportCodeFolding = true;

// enable syntax lint-like validation in the grammar
xml_mode.supportGrammarAnnotations = true;

// enable user-defined autocompletion (TODO)
xml_mode.supportAutoCompletion = true;
xml_mode.autocompleter.options = { prefixMatch:true, caseInsensitiveMatch:false };

// define the editor
var editor = ace.edit("editor");
var langTools = ace.require("ace/ext/language_tools");

// dark theme
editor.setTheme("ace/theme/monokai");

// use our custom highlighting mode
editor.getSession().setMode(xml_mode);

// keybindings for search and replace (win == linux)
editor.commands.addCommand({
	name: 'replace',
	bindKey: { win: 'Ctrl-R', mac: 'Command-alt-F' },
	exec: function(editor) {
		ace.config.loadModule("ace/ext/searchbox", function(e) { e.Search(editor, true); });
	},
	readOnly: true
});

var prev = "";
editor.getSession().on('change', function(data) {
	if (data.lines[0] == "" && data.lines[1] == "" && prev == "{") {
		var session = editor.session;
		session.insert({
			row: data.end.row,
			column: data.end.column
		}, "\n}");
	} else {
		prev = data.lines[0];
	}
});

editor.getSession().on('keyboardHandlerChanged', function(data) {
	var newKeyboardHandler = editor.getKeyboardHandler();
	console.log("newKeyboardHander = "+newKeyboardHandler);
});

// Enable Options
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true
});

// Add keywords to autocomplete
langTools.addCompleter(
	xml_grammar.Lex.keyword.tokens.map(
		function(keyword) {
			return { name: keyword, value: keyword, score: 1, meta: "keyword" };
		}
	)
);

$('#editor').data('editor', editor);
