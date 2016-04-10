"use strict";

var listener = function(e){
    e.preventDefault();
}

var ieListener = function() {
    window.event.returnValue = false;
}

$('#paper').mouseenter(function() {
    if (document.addEventListener) {
        document.addEventListener('contextmenu', listener);
    } else {
        document.attachEvent('oncontextmenu', ieListener);
    }
}).mouseleave(function() {
    if (document.addEventListener) {
        document.removeEventListener('contextmenu', listener);
    } else {
        document.detachEvent('oncontextmenu', ieListener);
    }
});


var graph = new joint.dia.Graph();

var paper = new joint.dia.Paper({
    el: $('#paper'),
    width: $('#paper').width(),
    height: window.innerHeight - $('#nav-bar').height(),
    gridSize: 1,
    model: graph,
    snapLinks: true,
    linkPinning: false,
    embeddingMode: false,
    validateEmbedding: function(childView, parentView) {
        return grid.canEmbedInto(parentView.model);
    }
});
var svgResize = function() {
    var  svg = $('#v-2');
    try {
        var bbox = paper.viewport.getBBox();
    } catch(err) {
        return;
    }
    var newWidth = bbox.x + bbox.width + 10;
    if (newWidth < $('#paper').width()) {
        newWidth = $('#paper').width();
    }
    var newHeight = bbox.y + bbox.height + 10;
    if (newHeight < window.innerHeight - $('#nav-bar').height()) {
        newHeight = window.innerHeight - $('#nav-bar').height();
    }
    paper.setDimensions(newWidth, newHeight);
}

/* custom highlighting */

var highlighter = V('circle', {
    'r': 14,
    'stroke': '#ff7e5d',
    'stroke-width': '6px',
    'fill': 'transparent',
    'pointer-events': 'none'
});




var dragStartPosition = false;
paper.on('blank:pointerdown',
    function(event, x, y) {
        var scale = V(paper.viewport).scale();
        dragStartPosition = { x: x * scale.sx, y: y * scale.sy};
        $('#paper').css('cursor', 'move');
    }
);
paper.on('blank:pointerup', function(cellView, x, y) {
    dragStartPosition = false;
    $('#paper').css('cursor', 'default');
});

$("#paper").mousemove(function(event) {
    if (dragStartPosition) {
          var scale = V(paper.viewport).scale();
          paper.setOrigin(
            Math.min(0, event.offsetX - dragStartPosition.x),
            Math.min(0, event.offsetY - dragStartPosition.y)
          );

    }
});

var isDoubleClick = false;
paper.on('cell:contextmenu',
    function(cellView, evt, x, y) {
        isDoubleClick = true;
        var self = cellView;
        switch (self.model.get('elType')) {
        case "action":
            var colId = self.model.cid;
            var myModal = $('#myModal');
            myModal.find('.submitData').attr("source_id",colId);
            myModal.find('.nameAction').val(self.model.get('nameIn'));

            var scripts = self.model.get('scriptIn');
            if(scripts.length>0){
                //TODO will we only ever have one script?
                myModal.find('.scriptInput').val(scripts[0]);
            }
            var reqs = self.model.get('RequiresIn');
            for(var i=0; i<reqs.length; i++){
                if(i===0){
                    var targets = myModal.find('.requires').children();
                    targets[0].value = reqs[i].resource;
                    targets[1].value = reqs[i].attribute;
                    targets[2].value = reqs[i].operator;
                    targets[3].value = reqs[i].value;
                }
                else{
                    $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input value="'+ reqs[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+reqs[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+reqs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.reqAdd');
                    myModal.find('.requires:last').find('select:first').val(reqs[i].relOp);
                    myModal.find('.requires:last').find('select:last').val(reqs[i].operator);
                }
            }
            var provs = self.model.get('ProvidesIn');
            for(var i=0; i<provs.length; i++){
                if(i===0){
                    var targets = myModal.find('.provides').children();
                    targets[0].value = provs[i].resource;
                    targets[1].value = provs[i].attribute;
                    targets[2].value = provs[i].operator;
                    targets[3].value = provs[i].value;
                }
                else{
                    $('<div class="provides"><select><option>||</option><option>&&</option></select><br><input value="'+ provs[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+provs[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+provs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.provAdd');
                    myModal.find('.provides:last').find('select:first').val(provs[i].relOp);
                    myModal.find('.provides:last').find('select:last').val(provs[i].operator);
                }
            }
            var agents = self.model.get('AgentsIn');
            for(var i=0; i<agents.length; i++){
                if(i===0){
                    var targets = myModal.find('.agent').children();
                    targets[0].value = agents[i].resource;
                    targets[1].value = agents[i].attribute;
                    targets[2].value = agents[i].operator;
                    targets[3].value = agents[i].value;
                }
                else{
                    $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input value="'+ agents[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+agents[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+agents[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.ageAdd');
                    myModal.find('.agent:last').find('select:first').val(agents[i].relOp);
                    myModal.find('.agent:last').find('select:last').val(agents[i].operator);
                }
            }
            // var tools = self.model.get('ToolsIn');
            // for(var i=0; i<tools.length; i++){
            //     if(i===0){
            //         var targets = myModal.find('.tools').children();
            //         targets[0].value = tools[i].resource;
            //         targets[1].value = tools[i].attribute;
            //         targets[2].value = tools[i].operator;
            //         targets[3].value = tools[i].value;
            //     }
            //     else{
            //         $('<div class="tools"><select><option>||</option><option>&&</option></select><br><input value="'+ tools[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+tools[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+tools[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.toolAdd');
            //         myModal.find('.tool:last').find('select:first').val(tools[i].relOp);
            //         myModal.find('.tool:last').find('select:last').val(tools[i].operator);
            //     }
            // }
            $('#myModal').modal('show');
            break;
        default:
            var colId = self.model.cid;
            var myModal = $('#non_action_modal');
            myModal.find('.submitElementUpdate').attr("source_id",colId);
            if(self.model.get('nameIn') != self.model.get('elType')){
                myModal.find('.rename').val(self.model.get('nameIn'));
            }
            myModal.modal('show');
        }
    }
);


var currentlyHighlighted = undefined;

paper.on('cell:pointermove', function(cellView, evt, x, y) {

    var elementBelow = graph.getCells().filter( function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });
    elementBelow.sort(
        function(a, b){
            return b.get("z") - a.get("z");
        }
    );

    var hovering = false;
    for (var i = 0; i < elementBelow.length; i++) {
        if (grid.canEmbedInto(elementBelow[i])) {
            var hoveringOn = elementBelow[i];
            hovering = true;
            break;
        }
    }
    if (hovering) {
        if (currentlyHighlighted && hoveringOn.id !== currentlyHighlighted.id) {
            V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
            V(paper.findViewByModel(hoveringOn).el).addClass('highlighted-parent');
            currentlyHighlighted = hoveringOn;
        } else if (!currentlyHighlighted) {
            V(paper.findViewByModel(hoveringOn).el).addClass('highlighted-parent');
            currentlyHighlighted = hoveringOn;
        }
    } else {
        if (currentlyHighlighted) {
            V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
            currentlyHighlighted = undefined;
        }
    }
});

var movingColumn = undefined;

paper.on('cell:pointerdown',
    function(cellView, evt, x, y) {
        window.setTimeout(function(){
            if (!isDoubleClick) {
                setZ(cellView.model, 900);
                movingColumn = cellView.model.get("column").parentColumns.remove(cellView.model);
                addElementClass(cellView.model, "dragging", true);
            }
        },
        10);
    }
);

//Recursively sets an element and it's children to have top Z values
var setZ = function(element, value) {
    element.set("z", value);
    element.getEmbeddedCells().map(
        function(cell) {
            setZ(cell, value + 1);
        }
    );
}

//Will add an svg css class to an element and will recur if option is set
var addElementClass = function(element, cssClass, shouldRecur) {
    V(paper.findViewByModel(element).el).addClass(cssClass);
    if (shouldRecur) {
        element.getEmbeddedCells().map(
            function(cell) {
                addElementClass(cell, cssClass, shouldRecur);
            }
        );
    }
}

//Will remove an svg css class to an element and will recur if option is set
var removeElementClass = function(element, cssClass, shouldRecur) {
    V(paper.findViewByModel(element).el).removeClass(cssClass);
    if (shouldRecur) {
        element.getEmbeddedCells().map(
            function(cell) {
                removeElementClass(cell, cssClass, shouldRecur);
            }
        );
    }
}

paper.on('cell:pointerup', function(cellView, evt, x, y) {
    if (currentlyHighlighted) {
        V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
        currentlyHighlighted = undefined;
    }

    window.setTimeout(function(){
        if (isDoubleClick) {
            isDoubleClick = false;
        } else {
            pointerup(cellView, evt, x, y);
        }
    },
    11);

});

var pointerup = function(cellView, evt, x, y) {
    removeElementClass(cellView.model, "dragging", true);

    var elementBelow = graph.getCells().filter( function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });

    var embedded = false;
    elementBelow.sort(
        function(a, b){
            return b.get("z") - a.get("z");
        }
    );

    for (var i = 0; i < elementBelow.length; i++) {
        if (grid.canEmbedInto(elementBelow[i])) {
            var embeddedInto = elementBelow[i];
            embedded = true;
            break;
        }
    }

    if (!embedded) {
        outerColumns.insert(movingColumn, cellView.model.get('position').x);
        setZ(cellView.model, 1);
    } else {
        setZ(cellView.model, embeddedInto.get("z") + 1);
        embeddedInto.get("column").columns.insert(movingColumn, cellView.model.get('position').x);
    }

    movingColumn = undefined;
}

//Called by user when clicking menu option
var insert = function(type) {
    type = type || "branch";
    $("#overlay").css("display","none");
    var column = grid.addElement(type);
    graph.addCell(column.element);
    return column;
}

var outerColumns = new Columns();

//for agent coloured actions
var colourAgent = [];
var currentColour = [20,20,20];
var element_counts = [];

var grid = {

    //Block size contants
    outerPadding: 50,
    childPadding: 20,
    actionCorrection: 50,
    fullBlockWidth: 350,

    // keep a copy of the last element whos parent has changed
    prevParentChanged: null,

    actionHeight: 600,

    columnsFilled: 0,

    // minimum element size
    minHeight: 50,
    minWidth: 150,
    colWidth: 400,

    // this is the size of a container with no contents
    minSize: {width: 300, height: 50},
    minColumnSize: {width: 350, height: 70},

    canEmbedInto: function(element) {
        return element.get("elType") !== "action";
    },

    //Can be used to add an element dynamically or to get properties and set up  the object for a json input.
    addElement: function(type) {
        var self = this;
        var blockWidth = blockWidth || 1;
        var innerPos = innerPos === undefined ? -1 : innerPos;
        var parent = parent || null;
        if(typeof element_counts[type] === 'undefined'){
            element_counts[type] = 0;
        }
        var new_name = type + "_" + element_counts[type]++;
        if (type == "action") {
            var el = new joint.shapes.devs.Coupled({
                size: self.minSize,
                label: 'Action',
                attrs: {
                    text: { text: type + ": " + new_name },
                    rect: { fill: 'rgb(255,255,255)' }
                },
                elType: type,
                nameIn: new_name,
                scriptIn: [],
                RequiresIn: [],
                ProvidesIn:[],
                AgentsIn:[],
                ToolsIn:[]
            });
            var newCol = outerColumns.push(el, false);
        } else {
            var el = new joint.shapes.devs.Coupled({
                size: self.minSize,
                attrs: { text: { text: type + ": " + new_name, class: 'label ' + type },
                    rect: { class: 'body ' + type, fill: '#ffffff' }
                },
                class: 'body ' + type,
                nameIn: new_name,
                elType: type,
                verticalChildCount: 0
            });
            var newCol = outerColumns.push(el);
        }
        svgResize();
        return newCol;
    }
}


//Columns deals with the movement of columns, and setting of poition NOT translations
function Columns(element) {
    this.columns = [];
    this.parent = element;
    if (this.parent) {
        this.isVertical = element.get("elType") === "branch" || element.get("elType") === "selection";
    }
}

//This function is only for sequence and iteration
Columns.prototype.getHorizontalYCoord = function() {
    if (this.isVertical) return undefined;
    return (this.parent ? this.parent.get("position").y + 2 * grid.childPadding : grid.outerPadding + 2 * grid.childPadding);
}

Columns.prototype.getVerticalXCoord = function() {
    if (!this.isVertical) return undefined;
    return this.parent.get("position").x + grid.childPadding;
}

Columns.prototype.getYCoordByColumnPos = function(pos) {
    var yAccumulator = this.parent.get("position").y + grid.childPadding * 2;
    for (var i = 0; i < pos; i++) {
        yAccumulator += this.columns[i].height;
    }
    return yAccumulator;
}

//This function is only for sequence and iteration
Columns.prototype.getColumnByXCoord = function(xCoord, oldCol) {
    if (this.isVertical) return undefined;
    var widthAcc = 0;
    if (this.parent) {
        xCoord -= this.parent.position().x;
    }
    if (xCoord < 0) {
        return 0;
    }
    for (var i = 0; i < this.columns.length; i++) {
        widthAcc += this.columns[i].width;
        if (widthAcc > xCoord) {
            if (i === oldCol) {
                return i;
            } else if (i > oldCol) {
                return (widthAcc - xCoord > this.columns.width - grid.outerPadding) ? i - 1 : i;
            } else {
                return (widthAcc - xCoord > this.columns.width - grid.outerPadding) ? i : i + 1;
            }
        }
    }
    return this.columns.length - (oldCol < this.columns.length ? 1 : 0);
}

Columns.prototype.getColumnPosByElementId = function(id) {
    if (typeof id === "object") {
        id = id.id;
    }
    for (var i = 0; i < this.columns.length; i++) {
        if (id === this.columns[i].element.id) {
            return i;
        }
    }
    return undefined;
}

//This function is only for sequence and iteration
Columns.prototype.getXCoordByColumn = function(columnNum) {
    if (this.isVertical) return undefined;

    if (this.parent) {
        var xPos = this.parent.get("position").x + grid.childPadding;
    } else {
        var xPos = grid.outerPadding;
    }
    for(var i = 0; i < columnNum; i++) {
        xPos += this.columns[i].width;
    }

    return xPos;
}

//Can only push onto outer columns
Columns.prototype.push = function(element) {
    if (this.parent) {
        return undefined;
    }
    var newCol = new Column(element, this);
    //Update Data structure
    var length = this.columns.push(newCol);
    //Set position of new element
    newCol.changePos(this.getXCoordByColumn(length - 1), this.getHorizontalYCoord(), true);  
    return newCol;  
}

//This function is only for sequence and iteration
Columns.prototype.getMaxHeight = function() {
    if (this.isVertical) return undefined;

    var maxHeight = 0;
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].height > maxHeight) {
            maxHeight = this.columns[i].height;
        }
    }
    return maxHeight;
}

//This function is only for branch and selection
Columns.prototype.getMaxWidth = function() {
    if (!this.isVertical) return undefined;

    var maxWidth = 0;
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].width > maxWidth) {
            maxWidth = this.columns[i].width;
        }
    }
    return maxWidth;
}

Columns.prototype.insert = function(column, destinationXCoord) {
    if (!this.isVertical) {
        //Get Column to insert into
        var insertionColumn = this.getColumnByXCoord(destinationXCoord);

        //Move element      
        column.changePos(this.getXCoordByColumn(insertionColumn), this.getHorizontalYCoord());

        //Rearrange data-structure
        this.columns.splice(insertionColumn, 0, column);
    } else {
        //Update Data structure
        var length = this.columns.push(column);
        //Set position of new element
        this.columns[length - 1].changePos(this.getVerticalXCoord(), this.getYCoordByColumnPos(length - 1));
    }

    //Embed element
    if (this.parent) {
        this.parent.embed(column.element);
    }

    //Update parent columns
    column.parentColumns = this;

    //Resize and reposition
    this.redraw();
}

Columns.prototype.remove = function(element) {
    //get column to remove from
    var removalColumnIndex = this.getColumnPosByElementId(element.id);
    var removedColumn;
    //Rearrange Data Structure
    if (this.columns.length === 1) {
        removedColumn = this.columns[0];
        this.columns = [];
    } else {
        removedColumn = this.columns.splice(removalColumnIndex, 1)[0];
    }

    //unembed element
    if (this.parent) {
        this.parent.unembed(element);
    }

    //Update parent columns
    removedColumn.parentColumns = undefined;

    //Resize and reposition
    this.redraw();

    return removedColumn;
}

//Column must be already removed/added to data structure
//Changed parent size and repositions it's children
Columns.prototype.redraw = function() {
    if (!this.isVertical) {
        var start = this.parent ? this.parent.position().x + grid.childPadding : grid.outerPadding;
        var xAccumulator = start;
        var y = this.getHorizontalYCoord();

        
        for (var i = 0; i < this.columns.length; i++) {
            this.columns[i].changePos(xAccumulator, y);
            xAccumulator += this.columns[i].width;
        }

        if (!this.parent) {
            return;
        }

        if (!this.columns.length) {
            xAccumulator += grid.minSize.width;
        }

        if (this.parent.get("column").columns.columns.length) {
            this.parent.get("column").setSize({width: xAccumulator - start + (2 * grid.childPadding), height: this.getMaxHeight() + 3 * grid.childPadding});
        } else {
            this.parent.get("column").setSize(grid.minColumnSize);
        }
        this.parent.get("column").parentColumns.redraw();
    } else {
        var yAccumulator = this.parent.position().y + 2 * grid.childPadding;
        var x = this.getVerticalXCoord();

        for (var i = 0; i < this.columns.length; i++) {
            this.columns[i].changePos(x, yAccumulator);
            yAccumulator += this.columns[i].height;
        }

        if (!this.columns.length) {
            yAccumulator += grid.minSize.height;
        }
        if (this.parent.get("column").columns.columns.length) {
            this.parent.get("column").setSize({width: this.getMaxWidth() + 2 * grid.childPadding, height: yAccumulator - this.parent.position().y + grid.childPadding});
        } else {
            this.parent.get("column").setSize(grid.minColumnSize);
        }
        this.parent.get("column").parentColumns.redraw();
    }

}

//Column deals with the element within the column position
function Column(element, columns) {
    this.element = element;
    this.width = grid.minColumnSize.width;
    this.height = grid.minColumnSize.height;
    this.columns = new Columns(element);
    this.parentColumns = columns;
    //Add the columns object of child to the jointjs object of child
    element.set("column", this);
    this.transition = {
        duration: 50,
        timingFunction: function(t) { return t*t; },
        valueFunction: function(a, b) { return function(t) { return a + (b - a) * t }}
    };
};

//Used only for a dragged element.
Column.prototype.changePos = function(x, y, noTransition) {
    
    var oldPos = this.element.position();
    var translation = {
        x: Math.round(x) - Math.round(oldPos.x),
        y: Math.round(y) - Math.round(oldPos.y)
    }

    this.element.translate(translation.x,  translation.y, noTransition ? {} : {transition: this.transition});

    if (this.columns) {
        this.moveChildren(translation);
    }
}

//Used only for a dragged element.
Column.prototype.moveChildren = function(translation) {
    translation = {x: Math.round(translation.x), y: Math.round(translation.y)};
    for (var i = 0; i < this.columns.columns.length; i++) {
        if (this.columns.columns[i]) {
            this.columns.columns[i].element.translate(translation.x, translation.y, {transition: this.transition});
            this.columns.columns[i].moveChildren(translation);
        }
    }
}

Column.prototype.pushUp = function(width) {
    this.element.translate(width, 0);
}

Column.prototype.pushDown = function(width) {
    this.element.translate(-1 * width, 0);
}

Column.prototype.setSize = function(size) {
    this.width = size.width;
    this.height = size.height;
    this.element.set("size", {width: size.width - grid.outerPadding, height: size.height - grid.childPadding});
}



var checkName = function(str){
    if(!str.match(/([A-Z]|[a-z]|_)/)){
        addErr('All names must begin with either a letter or _');
        return false;
    }
    if(str.search(/^[_a-zA-Z][_a-zA-Z\d]*$/)){
        addErr('All names must only contain letters, numbers or _');
        return false;
    }
    return true;
}

var addErr = function (str){
    $('#myModal').find('#errorMsg').append('<div class="alert alert-danger">'+str+'</div>')
}

var checkPred = function (targets){
    var offset = 0;
    if(targets.length>4){
        offset = 2;
    }
    var existsR = false;
    var existsA = false;
    var toCheck = targets[0 + offset].value;
    if(toCheck.length > 0){
        existsR=true;
        if(!checkName(toCheck)){
            return false;
        }
    }
    toCheck = targets[1+offset].value;
    if(toCheck.length>0){
        if(!existsR ){
            addErr("Attributes cannot exist without resource");
            return false;
        }
        existsA=true;
        if(!checkName(toCheck)){
            return false;
        }
    }
    toCheck = targets[3+offset].value;
    if(toCheck.length>0){
        if((!existsR || !existsA) ){
            addErr("Values cannot exist without resources and attributes");
            return false;
        }
        if(targets[2+offset].value.length === 0 ){
            addErr("Values cannot exist without an operator");
            return false;
        }
        if(!checkName(toCheck)){
            return false;
        }
    }
    return true;
}

var checkFilled = function(targets){
    if(targets[2].value.length===0 && targets[3].value.length===0 && targets[5].value.length===0){
        return false;
    }
    return true;
}


var getOutput = function() {
    var columns = [];
    graph.attributes.cells.models.forEach(
        function(cell, index, cells) {
            columns.push(cells[index].get("column"));
            cells[index].set("column", "");
        }
    );
    graph.attributes.cells.models.forEach(
        function(cell, index, cells) {
            cells[index].set("column", columns[index]);
        }
    );
}


var getJSON = function() {
    var json = {};
	var columns = [];
    
    graph.attributes.cells.models.forEach(
        function(cell, index, cells) {
            columns.push(cells[index].get("column"));
            cells[index].set("column", "");
        }
    );
    json = JSON.stringify(graph);
    graph.attributes.cells.models.forEach(
        function(cell, index, cells) {
            cells[index].set("column", columns[index]);
        }
    );
	return json;
}

var setInput = function(input) {
    graph.clear();
    outerColumns = new Columns();

    for (var object in input.process.contains) {
        if (input.process.contains.hasOwnProperty(object)) {
            timeoutHelper(input.process.contains[object], undefined, 100);
        } 
    }
}

var setInputHelper = function(object, parent, timeout) {
    var inserted_column = insert(object.type);
    if (object.type === "action") {
        inserted_column.element.set("scriptIn", object.script);
        inserted_column.element.set("RequiresIn", object.requires);
        inserted_column.element.set("ProvidesIn", object.provides);
        inserted_column.element.set("AgentsIn", object.agents);
        inserted_column.element.set("ToolsIn", object.tools);

    } 
    inserted_column.element.set("nameIn", object.name || "");
    inserted_column.element.set("elType", object.type);

    if (object.name) {
        inserted_column.element.attr('text/text', object.type + ": " + shortenLongNames(object.name));
    }
    
    
    if (parent) {
        inserted_column = outerColumns.remove(inserted_column.element);
        parent.insert(inserted_column, Number.MAX_VALUE);
    }

    for (var obj in object.contains) {
        if (object.contains.hasOwnProperty(obj)) {
            timeoutHelper(object.contains[obj], inserted_column.columns, timeout);
        }
    }

}

var timeoutHelper = function(object, parent, timeout) {
    window.setTimeout(function(){
        setInputHelper(object, parent, timeout + 100);
    }, timeout);
}

var newColour = function() {
    //DON'T DELETE!!! I might want it later.... Théa
    // var sumColour = 0;
    // for(var i=0; i<currentColour.length; i++){
    //     sumColour+=currentColour[i];
    // }`
    // if(sumColour>600){
    //     currentColour[0] = Math.floor((Math.random() * 50) + 25);
    //     currentColour[1] = Math.floor((Math.random() * 50) + 25);
    //     currentColour[2] = Math.floor((Math.random() * 50) + 25);
    // }
    var index = Math.floor((Math.random() * 2) );
    var add = Math.floor((Math.random() * 240) + 20);
    // var index2 = Math.floor((Math.random() * 2) );
    // var add2 = Math.floor((Math.random() * 240) + 20);
    currentColour[index]=add;
    // currentColour[index2]=add2;
    return 'rgb('+currentColour[0]+','+currentColour[1]+','+currentColour[2]+')';
}


// $('.reqAdd').unbind('click');
// $('.provAdd').unbind('click');
// $('.ageAdd').unbind('click');
// $('.submitData').unbind('click');
$('.reqAdd').on('click' , function(){
    $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.provAdd').on('click', function(){
    $('<div class="provides"> <select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.ageAdd').on('click', function(){
    $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.toolAdd').on('click', function(){
    $('<div class="tools"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>==</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.submitData').on('click', function(){
    $('#myModal').find('#errorMsg').children().remove(); //TODO not working properly
    var submitOk = true;
    var collectioon = graph.getCells();
    var cid = $(this).attr("source_id");
    var index = -1;
    for(var i = 0; i<collectioon.length; i++){
        if(collectioon[i].cid == cid){
            index = i;
            break;
        }
    }
    var nameVal = $(this).parents('#myModal').find('.nameAction').val();
    if(nameVal.length>0){
        submitOk = checkName(nameVal);
    }

    var scriptVal = [];
    $(this).parents('#myModal').find('.scriptInput').each(function(){
        scriptVal.push($(this).val());
    });
    var requireVals = [];
    $(this).parents('#myModal').find('.requires').each(function(){
        var currentRequiresVal = {};
        var targets = $(this).children();
        if(!checkPred(targets)){
            submitOk=false;
        }
        var offset = 0;
        var blank = false;
        if(targets.length > 4){
            if(!checkFilled(targets)){
                blank = true;
            }
            currentRequiresVal.relOp = targets[0].value;
            offset = 2; //includes op_1 and <br>
        }
        currentRequiresVal.resource = targets[0 + offset].value;
        currentRequiresVal.attribute = targets[1 + offset].value;
        var temp = targets[3 + offset].value.length;
        if(targets[3 + offset].value.length === 0 && targets[0 + offset].value.length>0){
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentRequiresVal.value = "";
                currentRequiresVal.operator = "";
            }
            else{
                currentRequiresVal.value = "true";
                currentRequiresVal.operator = "==";
            }
        }
        else{
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentRequiresVal.value = "";
                currentRequiresVal.operator = "";
            }
            else{
                currentRequiresVal.value = targets[3 + offset].value;
                currentRequiresVal.operator = targets[2 + offset].value;
            }
        }
        if(!blank){
            requireVals.push(currentRequiresVal);
        }
    });
    var providesVals = [];
    $(this).parents('#myModal').find('.provides').each(function (){
        var currentProvidesVal = {};
        var targets = $(this).children();
        if(!checkPred(targets)){
            submitOk=false;
        }
        var offset = 0;
        var blank = false;
        if(targets.length > 4){
            if(!checkFilled(targets)){
                blank = true;
            }
            currentProvidesVal.relOp = targets[0].value;
            offset = 2; //includes op_1 and <br>
        }
        currentProvidesVal.resource = targets[0 + offset].value;
        currentProvidesVal.attribute = targets[1 + offset].value;
        if(targets[3 + offset].value.length === 0 && targets[0 + offset].value.length>0){
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentProvidesVal.value = "";
                currentProvidesVal.operator = "";
            }
            else{
                currentProvidesVal.value = "true";
                currentProvidesVal.operator = "==";
            }
        }
        else{
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentProvidesVal.value = "";
                currentProvidesVal.operator = "";
            }
            else{
                currentProvidesVal.value = targets[3 + offset].value;
                currentProvidesVal.operator = targets[2 + offset].value;
            }
        }
        if(!blank){
            providesVals.push(currentProvidesVal);
        }
    });
    var agentsVals = [];
    var agentNames = [];
    $(this).parents('#myModal').find('.agent').each(function (){
        var currentAgentsVal = {};
        var targets = $(this).children();
        if(!checkPred(targets)){
            submitOk=false;
        }
        var offset = 0;
        var blank = false;
        if(targets.length > 4){
            if(!checkFilled(targets)){
                blank = true;
            }
            currentAgentsVal.relOp = targets[0].value;
            offset = 2; //includes op_1 and <br>
        }
        currentAgentsVal.resource = targets[0 + offset].value;
        currentAgentsVal.attribute = targets[1 + offset].value;
        if(targets[3 + offset].value.length === 0  && targets[0 + offset].value.length>0){
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentAgentsVal.value = "";
                currentAgentsVal.operator = "";
            }
            else{
                currentAgentsVal.value = "true";
                currentAgentsVal.operator = "==";
            }
        }
        else{
            if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
                currentAgentsVal.value = "";
                currentAgentsVal.operator = "";
            }
            else{
                currentAgentsVal.value = targets[3 + offset].value;
                currentAgentsVal.operator = targets[2 + offset].value;
            }
        }
        if(!blank){
        // push agent with new colour to array
            if(currentAgentsVal.resource.length>0){
                if(colourAgent[targets[0 + offset].value] === undefined){
                    colourAgent[targets[0 + offset].value] = newColour();
                }
                agentNames.push(currentAgentsVal.resource);
            }
            agentsVals.push(currentAgentsVal);
        }
    });
    // var toolsVals = [];
    // $(this).parents('#myModal').find('.tools').each(function (){
    //     var currentToolssVal = {};
    //     var targets = $(this).children();
    //     if(!checkPred(targets)){
    //         submitOk=false;
    //     }
    //     var offset = 0;
    //     var blank = false;
    //     if(targets.length > 4){
    //         if(!checkFilled(targets)){
    //             blank = true;
    //         }
    //         currentToolssVal.relOp = targets[0].value;
    //         offset = 2; //includes op_1 and <br>
    //     }
    //     currentToolssVal.resource = targets[0 + offset].value;
    //     currentToolssVal.attribute = targets[1 + offset].value;
    //     if(targets[3 + offset].value.length === 0 && targets[0 + offset].value.length>0){
    //         if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
    //             currentToolssVal.value = "";
    //             currentToolssVal.operator = "";
    //         }
    //         else{
    //             currentToolssVal.value = "true";
    //             currentToolssVal.operator = "==";
    //         }
    //     }
    //     else{
    //         if(targets[0 + offset].value.length===0 || targets[1 + offset].value.length===0){
    //             currentToolssVal.value = "";
    //             currentToolssVal.operator = "";
    //         }
    //         else{
    //             currentToolssVal.value = targets[3 + offset].value;
    //             currentToolssVal.operator = targets[2 + offset].value;
    //         }
    //     }
    //     if(!blank){
    //         toolsVals.push(currentToolssVal);
    //     }
    // });
    if(submitOk){
        if(nameVal.length > 0){
            collectioon[index].attr('text/text', collectioon[index].get('elType') + ": " + shortenLongNames(nameVal));
        }
        else{
             collectioon[index].attr('text/text', collectioon[index].get('elType'));
        }
        if(agentNames.length>0){
            collectioon[index].attr('rect/fill', colourAgent[agentNames[0]]);
            var stops = [];
            var gap = 100/agentNames.length;
            for(var j=0; j<agentNames.length; j++){
                var percent = j*gap;
                var percentEnd = (j+1)*gap;
                stops.push({offset:''+percent+'%',color:''+colourAgent[agentNames[j]]+''})
                stops.push({offset:''+percentEnd+'%',color:''+colourAgent[agentNames[j]]+''})
            }
            collectioon[index].attr('rect/fill', {
                                                type: 'linearGradient',
                                                stops: stops
                                            });
        }
        collectioon[index].set('RequiresIn', requireVals);
        collectioon[index].set('ProvidesIn', providesVals);
        collectioon[index].set('AgentsIn', agentsVals);
        // collectioon[index].set('ToolsIn', toolsVals);
        collectioon[index].set('nameIn', nameVal);
        collectioon[index].set('scriptIn', scriptVal);
        $('#myModal').modal('hide');
    }
});

function shortenLongNames(name){
  var maxNameLength = 15;
  if(name.length > maxNameLength){
    return name.substr(0,maxNameLength-3)+'...'
  }
  else{
    return name;
  }
}
$('#myModal').on('hidden.bs.modal', function () {
    $(this).find("input,textarea,select").val('');
    $(this).find('.requires').not(':first').remove();
    $(this).find('.provides').not(':first').remove();
    $(this).find('.agent').not(':first').remove();
    // $(this).find('.tools').not(':first').remove();
});


$('#non_action_modal').on('hidden.bs.modal', function () {
    $(this).find("input,textarea,select").val('').end();
});


$('.submitElementUpdate').on('click', function(){
    var collectioon = graph.getCells();
    var cid = $(this).attr("source_id");
    var index = -1;
    for(var i = 0; i<collectioon.length; i++){
        if(collectioon[i].cid == cid){
            index = i;
            break;
        }
    }
    var modal = $(this).parents('#non_action_modal')
    var new_name = modal.find('.rename').val();
    if(new_name.length > 0){

        collectioon[index].attr('text/text', collectioon[index].get('elType') + ": " + shortenLongNames(new_name));
        collectioon[index].set('nameIn', new_name);
    }
    else{
        collectioon[index].attr('text/text', collectioon[index].get('elType'));
    }
});

$('.delete_element').on('click', function(){
    $('#myModal').find('#errorMsg').children().remove(); //TODO not working properly
    var cid = $(this).parents('.modal').find('.submitData,.submitElementUpdate').attr("source_id");
    var elementToRemove = graph.getCell(cid);
    elementToRemove.get("column").parentColumns.remove(elementToRemove);
    elementToRemove.remove();
});

paper.$el.on('mousewheel DOMMouseScroll', function onMouseWheel(e) {
  e.preventDefault();
  e = e.originalEvent;

  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) / 50;
  var offsetX = (e.offsetX || e.clientX - $(this).offset().left);

  var offsetY = (e.offsetY || e.clientY - $(this).offset().top);
  var p = offsetToLocalPoint(offsetX, offsetY);
  var newScale = V(paper.viewport).scale().sx + delta;
  if (newScale > 0.4 && newScale < 1) {
    // paper.setOrigin(0, 0);
    paper.scale(newScale, newScale, 0, 0);
  }
});


function offsetToLocalPoint(x, y) {
  var svgPoint = paper.svg.createSVGPoint();
  svgPoint.x = x;
  svgPoint.y = y;

  var pointTransformed = svgPoint.matrixTransform(paper.viewport.getCTM().inverse());
  return pointTransformed;
}


//keybindings
$( document ).keypress(function( e ) {
  if ($(e.target).is('input, textarea, select')) { return; }
  var a = 97, b = 98, i = 105, q = 113, s = 115;
  switch(e.which){
    case 97: //a
    case 65: //A
      insert('action');
      break;
    case 98: //b
    case 66: //B
      insert('branch');
      break;
    case 105: //i
    case 73: //I
      insert('iteration');
      break;
    case 113: //q
    case 81: //Q
      insert('sequence');
      break;
    case 115: //s
    case 83: //S
      insert('selection');
      break;
  }
});
