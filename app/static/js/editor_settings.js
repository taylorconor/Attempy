$('#editor_settings').on('click', function() {
  $('#editor_settings_pane').modal('show');
});

$('#settings_done').on('click', function() {
  var newKeyboardHandler = this.value;
  $.ajax({
		type: 'POST',
		url: 'handler_changed',
		data: {'handler': newKeyboardHandler},
		dataType: 'text',
		crossDomain: 'true'
	});
  editor.setKeyboardHandler(newKeyboardHandler);
});
