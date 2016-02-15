
function loadSideBar(){
    $.ajax({
        url: "/pml_load_file_sidebar",
        method: "GET",
        success: function(data) {
            $('#folder-sidebar').html(data.output);

            $('.tree-toggle').click(function () {
                $(this).parent().children('ul.tree').toggle(200);
            });

            var fileName = $('#current_file_name').val();
            if(typeof fileName !== 'undefined'){
                if(fileName.length > 0){
                    var currentFile = $("#folder-sidebar a:contains('"+ fileName +"')");
                    currentFile.css( "color", "blue" );
                }
            }


            $('#folder-sidebar a').click(function () {
                var filename = $(this).text();
                $.ajax({
                    url: "/pml_load_file",
                    method: "POST",
                    data: {
                        data: filename
                    },
                    success: function(data) {
                        ace.edit("editor").setValue(data.output);
                        $('#current_file_name').val(filename);
                        loadSideBar();
                    }
                });
            });

            $('#folder-sidebar .fa-plus-circle').click(function () {
                var path = '';
                var current_folder = $(this).prev();
                var parents = current_folder.parents('#folder-sidebar ul');
                parents.splice(-1,1);
                if(parents.length > 0){
                    parents.splice(-1,1);
                    path += current_folder.text();
                    parents.each(function() {
                        path = $(this).prev().prev().text() + '/' + path;
                    });
                }
                $('#createNewFile').attr( 'folderPath', path );
            });

            $('#createNewFile').click(function () {
                path = $(this).attr('folderPath');
                if (typeof path === typeof undefined || path === false) {
                    path = '';
                }
                path += '/' + $('#newFileName').val();
                $.ajax({
                    url: "/createFile",
                    method: "POST",
                    data: {
                        data: path
                    },
                    success: function(data) {
                        $('#newFileName').val('');
                        editor.setValue('');
                        loadSideBar();
                    }
                });
            });
        }
    });
}

$('#current_file_name').val($('#folder-sidebar a:first').first().text());
loadSideBar();
$('#submit_save').on('click', function() {
    path = $('#current_file_name').attr('folderPath');
    if (typeof path === typeof undefined || path === false) {
        path = '';
    }
    path += '/' + $('#current_file_name').val();
    var info = {'path': path, 'text': ace.edit("editor").getSession().getValue()};
    $.ajax({
        url: "{{ url_for('/pml_save_file') }}",
        method: "POST",
        data: JSON.stringify(info, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(data) {
            
        }
    });
});

