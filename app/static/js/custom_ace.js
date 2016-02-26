// define the editor
var editor = ace.edit("editor");
var langTools = ace.require("ace/ext/language_tools");

// dark theme
editor.setTheme("ace/theme/monokai");

// use our custom highlighting mode
editor.getSession().setMode('ace/mode/pml');

// keybindings for search and replace (win == linux)
editor.commands.addCommand({
	name: 'replace',
	bindKey: { win: 'Ctrl-R', mac: 'Command-alt-F' },
	exec: function(editor) {
		ace.config.loadModule("ace/ext/searchbox", function(e) { e.Search(editor, true); });
	},
	readOnly: true
});

editor.commands.addCommand({
	name: 'save',
	bindKey: { win: 'Ctrl-S', mac: 'Command-alt-S' },
	exec: function(editor) {
		get_path_save_file();
	},
	readOnly: true
});

editor.commands.addCommand({
	name: 'syntaxcheck',
	bindKey: { win: 'Ctrl-B', mac: 'Command-alt-B' },
	exec: function(editor) {
		$('#check_syn').trigger("click");
	},
	readOnly: true
});

editor.commands.addCommand({
	name: 'new',
	bindKey: { win: 'Ctrl-N', mac: 'Command-alt-N' },
	exec: function(editor) {
		new_file();
	},
	readOnly: true
});


editor.getSession().on('keyboardHandlerChanged', function(data) {
	var newKeyboardHandler = editor.getKeyboardHandler();
	$.ajax({
		type: 'POST',
		url: 'handler_changed',
		data: {'handler': newKeyboardHandler},
		dataType: 'text',
		crossDomain: 'true'
	});
});

// Enable Options
editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true
});

// define keywords
var pml_keywords = ["action", "agent", "branch", "executable", "iteration", "manual", "process",
	"provides", "requires", "script", "selection", "select", "sequence", "task", "tool"];

// Add keywords to autocomplete
langTools.addCompleter(
	pml_keywords.map(
		function(keyword) {
			return { name: keyword, value: keyword, score: 1, meta: "keyword" };
		}
	)
);

$('#editor').data('editor', editor);

$(window).load(function(){
    // ace.edit("editor").setValue(""); //clears text in editor on load
    if(window.location.hash.length > 1){
		load_file(window.location.hash.substring(1));
    }
});