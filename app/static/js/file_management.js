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
            $('.tree-toggle').click(function () {
                $(this).parent().children('ul.tree').toggle(200);
            });

            var fileName = $('#current_file_name').val();
            if(typeof fileName !== 'undefined'){
                if(fileName.length > 0){
                    $("#folder-sidebar a[relative='"+ fileName +"']").each( function () {
                        $(this).css( "color", "blue" );
                    });
                }
            }


            $('#folder-sidebar a').click(function () {
                var path = $(this).attr('relative');
                load_file(path);
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
                        editor.setValue('');
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
function save_file(path){
    var info = {'path': path, 'text': ace.edit("editor").getSession().getValue()};
    $.ajax({
        url: "/pml_save_file",
        method: "POST",
        data: JSON.stringify(info, null, '\t'),
        contentType: 'application/json;charset=UTF-8',
        success: function(data) {
            var paths = path.split("/");
            window.location.hash = "#" + paths[paths.length - 1];
            loadSideBar();
        }
    });
}

function load_file(path){
    $.ajax({
        url: "/pml_load_file",
        method: "POST",
        data: {
            data: path
        },
        success: function(data) {
            ace.edit("editor").setValue(data.output);
            $('#current_file_name').val(path);
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