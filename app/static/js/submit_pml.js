//Submit the pml and display the results

$('#check_syn').on('click', function() {
    $.ajax({
        url: "/pml_source_submit",
        method: "POST",
        data: {
            data: ace.edit("editor").getSession().getValue()
        },
        success: function(data) {
            var editor = ace.edit("editor");
            var markers = editor.session.$backMarkers;
            for(var key in markers){
                if (markers.hasOwnProperty(key)) {
                    if (markers[key].clazz == "error_highlight"){
                        editor.session.removeMarker(markers[key].id);
                    }
                }
            }
            var rows = editor.session.getLength();
            for (var i = 0; i < rows; i++){
                editor.session.removeGutterDecoration(i, 'ace_error');
            }

            editor.session.clearAnnotations();

            if (data.return_code > 0) {
                $("#pml-output").attr("class", "alert alert-danger").attr("style","display: inline;");
                $("#pml-output-glyph").attr("class", "glyphicon glyphicon-exclamation-sign");

                
                var err = data.output;
                //error of the form: tmp/pmlcheck_output:1: syntax error at dsaff 
                //match the integer value between two colons to get the line number of the error:
                var line_number = err.match(":(.*):")[1];
                line_number -= 1;

                var word_arr = err.split(" ");
                var word = $.trim(word_arr[word_arr.length - 1]);

                //Register error with ace and give tooltip description
                editor.session.setAnnotations([{
                    row: line_number,
                    type: "error",
                    text: err
                }]);

                //draw line in the gutter 
                editor.session.addGutterDecoration(line_number, 'ace_error');

                //highlight the offending word
                var Range = ace.require("ace/range").Range

                //get line that error is on
                var error_line = editor.session.getLine(line_number);

                var start_index = error_line.indexOf(word);

                if (start_index > 0) {
                    var end_index = start_index + word.length;
                    erroneousLine = editor.session.addMarker(new Range(line_number, start_index, line_number, end_index), "error_highlight", "text");
                }

            } else {
                $("#pml-output").attr("class", "alert alert-success").attr("style","display: inline;");
                $("#pml-output-glyph").attr("class", "glyphicon glyphicon-exclamation-ok");
            }
            $("#pml-output-text").html(data.output);

        }
    });
});