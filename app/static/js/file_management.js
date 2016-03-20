function sortSideBar(){
    $('#folder-sidebar ul').each(function() {
      var ul = $(this);
      if (ul.children('li').length > 1) { //if looking for direct descendants then do .children('div').length
          sortList(ul);
      }
    });
}
function sortList(ul){
    items = ul.children('li');
    items.sort(function(a,b){
      var keyA = $(a).html();
      var keyB = $(b).html();

      if (keyA > keyB) return -1;
      if (keyA < keyB) return 1;
      return 0;
    });
    $.each(items, function(i, li){
      ul.append(li);
    });
}
function loadSideBar(){
    $.ajax({
        url: "/pml_load_file_sidebar",
        method: "GET",
        success: function(data) {
            $('#folder-sidebar').html("<br>"+data.output);
            sortSideBar();
            // $('.tree-toggle').click(function () {
            //     $(this).parent().children('ul.tree').toggle(200);
            // });

            var fileName = $('#current_file_name').val();
            if(typeof fileName !== 'undefined'){
                if(fileName.length > 0){
                    $("#folder-sidebar a[relative='"+ fileName +"']").each( function () {
                        $(this).css( "color", "#F92672" );
                    });
                }
            }


            $('#folder-sidebar a').click(function () {
                var filename = $(this).text();
                var path = $(this).attr('relative');

                if ($('#editor').length){
                    load_file(path);
                }
                else if($('#paper').length){
                    load_graphic_file(path);
                }
            });
            
            $('#folder-sidebar label~.fa').click(function () {
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
                if(!checkIfInputFilled($(this))){
                    return;
                }
                path = $(this).attr('folderPath');
                if (typeof path === typeof undefined || path === false) {
                    path = '';
                }
                var name = $('#newFileDirectoryName').val();

                if(!name.match(/\.pml$/)){
                    name += ".pml";
                }
                path += '/' + name;
                $.ajax({
                    url: "/createFile",
                    method: "POST",
                    data: {
                        data: path
                    },
                    success: function(data) {
                        $('#newFileDirectoryName').val('');
                        loadSideBar();
                    }
                });                
            });
            $('#createNewFolder').click(function () {
                if(!checkIfInputFilled($(this))){
                        return;
                    }
                var path = $(this).attr('folderPath');
                if (typeof path === typeof undefined) {
                    path = '';
                }
                var name = $('#newFileDirectoryName').val();
                path += '/' + name;
                $.ajax({
                    url: "/createFolder",
                    method: "POST",
                    data: {
                        data: path
                    },
                    success: function(data) {
                        $('#newFileDirectoryName').val('');
                        loadSideBar();
                    }
                });
            });
            $('#folder-sidebar .delete_icon').click(function() {
                var path = $(this).parent().children('a').attr('relative')
                show_delete_confirmation(path);
            });
        }
    });
}

loadSideBar();
$('#submit_save').on('click', function() {
    get_path_save_file();
});

$('#createNewName').on('click', function() {
    if(!checkIfInputFilled($(this))){
        return;
    }

    var name = $('#newFileName').val();
    if(!name.match(/\.pml$/)){
        name += ".pml";
    }
    $('#current_file_name').val(name);
    save_file('/' + name);
});


function checkIfInputFilled(but){
    var close = true;
    var mod = but.parents('div.modal');
    var textInputs = mod.find('input[type=text]').each(function (){
        var text = $(this);
        if(text.val() === ''){
            text.fadeTo(1000, 0.5, function() { text.fadeTo(800, 1); });
            text.attr("placeholder","Name must be entered");
            mod.on('hidden.bs.modal', function () {
                text.attr("placeholder","");
            })
            close = false;
            return;
        }
    });
    if(close){
        mod.modal('hide');
        return true;
    }
    return false;
}
function show_delete_confirmation(path){
    $('#delete_warning_filename').text(path);
    $('#delete_warning_button').val(path);
    $('#delete_confirmation_modal').modal('show');
}
function delete_file(path){
    $.ajax({
        url: "/deleteFile",
        method: "POST",
        data: {
            data: path
        },
        success: function(data) {
            var temp = $('#current_file_name').val();
            if(path === $('#current_file_name').val()){
                $('#current_file_name').val('')
                ace.edit("editor").setValue("");
                //clear syntax check 
                var editor = ace.edit("editor");
                var markers = editor.session.$backMarkers;
                for(var key in markers){
                    if (markers.hasOwnProperty(key)) {
                        if (markers[key].clazz == "error_highlight"){
                            editor.session.removeMarker(markers[key].id);
                        }
                    }
                }
                editor.getSession().setUndoManager(new ace.UndoManager())
                $('#syn_out_bell').css("color", "gray");
                $("#syn_out_text").html("<li> Run syntax check to see output! </li>");
                var rows = editor.session.getLength();
                for (var i = 0; i < rows; i++){
                    editor.session.removeGutterDecoration(i, 'ace_error');
                }
                ace.edit("editor").session.clearAnnotations();
                window.location.hash = '#';
            }
            
            loadSideBar();
        }
    });
}
var file_saved = true;
function save_file(path){
    var info = {'path': path, 'text': ace.edit("editor").getSession().getValue()};
    $.ajax({
        url: "/pml_save_file",
        method: "POST",
        data: JSON.stringify(info),
        contentType: 'application/json;charset=UTF-8',
        success: function(data) {
            file_saved = true;
            var paths = path.split("/");
            window.location.hash = "#" + paths[paths.length - 1];
            loadSideBar();
        }
    });
}
function load_file(path){
    if(path.length < 1){
        return;
    }
    var storedPath = path;
    $.ajax({
        url: "/pml_load_file",
        method: "POST",
        data: {
            data: path
        },
        success: function(data) {
            ace.edit("editor").setValue(data.output);
			//clear syntax check 
            var editor = ace.edit("editor");
            var markers = editor.session.$backMarkers;
            for(var key in markers){
                if (markers.hasOwnProperty(key)) {
                    if (markers[key].clazz == "error_highlight"){
                        editor.session.removeMarker(markers[key].id);
                    }
                }
            }
            editor.getSession().setUndoManager(new ace.UndoManager())
            $('#syn_out_bell').css("color", "gray");
            $("#syn_out_text").html("<li> Run syntax check to see output! </li>");
            var rows = editor.session.getLength();
            for (var i = 0; i < rows; i++){
                editor.session.removeGutterDecoration(i, 'ace_error');
            }
            ace.edit("editor").session.clearAnnotations();
            $('#current_file_name').val(path);
            window.location.hash = "#" + storedPath;
            loadSideBar();
        }
    });
}

function get_path_save_file(){
    var path = '/' + $('#current_file_name').val();
    if(path === '/'){
        $('#getNewFileName').modal('show');
        return;
    }
    save_file(path);
}

function new_file(){
    $('#createNewFile').attr( 'folderPath', "" );
    $('#newFileOrDirectory').modal('show');
}

function load_graphic_file(path){
    if(path.length < 1){
        return;
    }
    var storedPath = path;
    $.ajax({
        url: "/get_pml_json",
        method: "POST",
        data: {
            data: path
        },
        success: function(data) {
            //TODO make this do something
            if(data.output === "Success"){
                setInput(data.source);
            }
            $('#current_file_name').val(path);
            window.location.hash = "#" + storedPath;
            loadSideBar();
        }
    });
}

window.addEventListener("beforeunload", function (e) {
    $('#current_file_name').val('');
    if(!file_saved){
        var confirmationMessage = 'It looks like you have been editing something. '
                            + 'If you leave before saving, your changes will be lost.';

        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
    }
    
});

$(document).ready(function (){
    $('#dropdown_new_file').on('click', function(){
        $('#folder-sidebar .fa:first').trigger("click");
    });
    $('.modal input[type=text]').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $(this).parents('.modal').find("button:contains('Submit')").focus().click();
        }
    });
    $('#submit_save_as').on('click', function(){
        $('#current_file_name').val('');
        get_path_save_file();
    });
    $('#delete_warning_button').on('click', function(){
        delete_file($(this).val());
    });
})