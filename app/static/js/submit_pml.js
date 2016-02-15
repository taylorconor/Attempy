//Submit the pml and display the results

$('#check_syn').on('click', function() {
    $.ajax({
        url: "/pml_source_submit",
        method: "POST",
        data: {
            data: ace.edit("editor").getSession().getValue()
        },
        success: function(data) {
            if (data.return_code > 0) {
                $("#pml-output").attr("class", "alert alert-danger").attr("style","display: inline;");
                $("#pml-output-glyph").attr("class", "glyphicon glyphicon-exclamation-sign");
            } else {
                $("#pml-output").attr("class", "alert alert-success").attr("style","display: inline;");
                $("#pml-output-glyph").attr("class", "glyphicon glyphicon-exclamation-ok");
            }
            $("#pml-output-text").html(data.output);
        }
    });
});