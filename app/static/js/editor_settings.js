$('#editor_settings').on('click', function() {
  $('#editor_settings_pane').modal('show');
});

$('#settings_done').on('click', function() {
  var newKeyboardHandler = $('#keybinding_select').val();
  $.ajax({
		type: 'POST',
		url: 'handler_changed',
		data: {'handler': newKeyboardHandler},
		dataType: 'text',
		crossDomain: 'true'
	});
  console.log("new keyboard handler = "+newKeyboardHandler);
  editor.setKeyboardHandler(newKeyboardHandler);
});
