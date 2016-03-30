"use strict";

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
        return parentView.model instanceof joint.shapes.devs.Coupled;
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



// paper.off('cell:highlight cell:unhighlight').on({

//     'cell:highlight': function(cellView, el, opt) {
//             console.log(el);
//             console.log(cellView.model)

//         if (opt.embedding) {
//             V(el).addClass('highlighted-parent');
//         }
//     },

//     'cell:unhighlight': function(cellView, el, opt) {
//         if (opt.embedding) {
//             V(el).removeClass('highlighted-parent');
//         }
//     }
// });
var dragStartPosition = false;
paper.on('blank:pointerdown',
    function(event, x, y) {
        dragStartPosition = { x: x, y: y};
    }
);
paper.on('blank:pointerup', function(cellView, x, y) {
    dragStartPosition = false;
});
$("#paper").mousemove(function(event) {
    if (dragStartPosition)
        paper.setOrigin(
            event.offsetX - dragStartPosition.x, 
            event.offsetY - dragStartPosition.y);
});
paper.on('cell:pointerdblclick', 
    function(cellView, evt, x, y) { 
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
                    $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input value="'+ reqs[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+reqs[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+reqs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.reqAdd');
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
                    $('<div class="provides"><select><option>||</option><option>&&</option></select><br><input value="'+ provs[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+provs[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+provs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.provAdd');
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
                    $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input value="'+ agents[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+agents[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+agents[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.ageAdd');
                    myModal.find('.agent:last').find('select:first').val(agents[i].relOp);
                    myModal.find('.agent:last').find('select:last').val(agents[i].operator);
                }
            }
            var tools = self.model.get('ToolsIn');
            for(var i=0; i<tools.length; i++){
                if(i===0){
                    var targets = myModal.find('.tools').children();
                    targets[0].value = tools[i].resource;
                    targets[1].value = tools[i].attribute;
                    targets[2].value = tools[i].operator;
                    targets[3].value = tools[i].value;
                }
                else{
                    $('<div class="tools"><select><option>||</option><option>&&</option></select><br><input value="'+ tools[i].resource +'" type="text" placeholder="Resource" /> . <input value="'+tools[i].attribute+'" type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input value="'+tools[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.toolAdd');
                    myModal.find('.tool:last').find('select:first').val(tools[i].relOp);
                    myModal.find('.tool:last').find('select:last').val(tools[i].operator);
                }
            }
            $('#myModal').modal('show');
            break;
        default:
            var colId = self.model.cid; 
            var myModal = $('#non_action_modal');
            myModal.find('.submitElementUpdate').attr("source_id",colId);
            if(self.model.attr('text/text') != self.model.get('elType')){
                myModal.find('.rename').val(self.model.attr('text/text'));
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
        if (elementBelow[i] instanceof joint.shapes.devs.Coupled) {
            var hoveringOn = elementBelow[i];
            hovering = true;
            break;
        }
    }
    if (hovering) {
        if (currentlyHighlighted && hoveringOn.id !== currentlyHighlighted.id) {
            V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
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

paper.on('cell:pointerup', function(cellView, evt, x, y) {
    if (currentlyHighlighted) {
        V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
        currentlyHighlighted = undefined;
    }
    var exParent = cellView.model.getAncestors();
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
        if (elementBelow[i] instanceof joint.shapes.devs.Coupled) {
            elementBelow[i].embed(cellView.model);
            cellView.model.set("z", elementBelow[i].get("z") + 1);
            var embeddedInto = elementBelow[i];
            embedded = true;
            break;
        }
    }

    if (!embedded) {
        if (!exParent.length) {
            outerColumns.move(cellView.model, cellView.model.get('position').x);
        } else {
            exParent[0].unembed(cellView.model);
            var movingColumn = exParent[0].get("column").columns.remove(cellView.model);
            outerColumns.insert(movingColumn, cellView.model.get('position').x);
        }
    } else {
        if (exParent.length) {
            var movingColumn = exParent[0].get("column").columns.remove(cellView.model);
        } else {
            var movingColumn = outerColumns.remove(cellView.model);
            console.log(movingColumn);
        }
        embeddedInto.get("column").columns.insert(movingColumn, cellView.model.get('position').x);
    }
});

//Called by user when clicking menu option
var insert = function(type) {
    type = type || "branch";
    graph.addCell(grid.addElement(type));
}


var nesting = {
    // forcibly (e.g. not top-down) resizes an element, then bubbles up the
    // hierarchy to maintain consistency
    forceResize: function(el, size) {
        var elWidth = el.get("size").width;
        el.set("size", size);
        // if (el.get("column")) {
        //     el.get("column").setSize(size);
        //     el.get("column").changeSize(size.width - elWidth);
        // }
        // now resize the entire hierarchy to adapt to el's new size
        this.resize(el);
    },
    resize: function(el) {
        var ancestors = el.getAncestors();
        var toResize = null;
        if (!ancestors || ancestors.length == 0)
            toResize = el;
        else {
            toResize = ancestors[0];
        }
        var childMinHeight = nesting.minHeight(toResize);
        if (toResize.get("size").height == childMinHeight) {
            this._resizeHeight(toResize);
        }
        else {
            var newSize = {
                width: toResize.get("size").width,
                height: childMinHeight
            };
            nesting.forceResize(toResize, newSize);
        }
    },
    // recursively resize all children inside an element. this is very useful
    // if the parent of a deeply nested structure resizes; it will allow the
    // entire structure to adapt.
    _resizeHeight: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            // no children to resize
            if (el.get("size").width < grid.minWidth) {
                console.log("Width is smaller!");
                this._resizeWidth(el);
            }
            return;
        }

        var childWidth = el.get("size").width - grid.childPadding*2;
        var runningHeight = 0;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var childOldWidth = child.get("size").width;
            var childSize = {
                width: childWidth,
                height: nesting.minHeight(child)
            };
            child.set("size", childSize);
            // if (child.get("column")) {
            //     child.get("column").setSize(childSize);
            //     child.get("column").changeSize(childOldWidth - childSize.width);
            // }
            var childPos = {
                x: el.get("position").x + grid.childPadding,
                y: el.get("position").y + grid.childPadding * 2 + runningHeight
            }
            child.set("position", childPos);
            runningHeight += childSize.height + grid.childPadding;

            // recurse with the current child as the parent
            nesting._resizeHeight(child);
        }
    },
    _resizeWidth: function(el) {
        var elWidth = el.get("size").width;
        var newSize = {
            width: this.minWidth(el),
            height: el.get("size").height
        }
        el.set("size", newSize);

        // if (el.get("column")) {
        //     el.get("column").setSize(newSize);
        //     el.get("column").changeSize(elWidth - newSize.width);
        // }
        var parent = graph.getCell(el.get("parent"));
        if (parent && parent != "") {
            this._resizeWidth(parent);
        }
    },
    // find the minimum possible width of an element
    minWidth: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            return grid.minWidth;
        }
        var maxChildWidth = 0;
        for (var i = 0; i < children.length; i++) {
            if (children[i].get("size").width > maxChildWidth) {
                maxChildWidth = children[i].get("size").width;
            }
        }
        return maxChildWidth + (grid.childPadding*2);
    },
    // finds the minimum possible height of an element
    minHeight: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            return grid.minHeight;
        }

        var minChildHeight = grid.childPadding*2;
        for (var i = 0; i < children.length; i++) {
            minChildHeight += nesting.minHeight(children[i]) + grid.childPadding;
        }
        return minChildHeight;
    }
};

var outerColumns = new Columns();

//for agent coloured actions 
var colourAgent = [];
var currentColour = [20,20,20]

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
    minColumnSize: {width: 350, height: 50},

    //Can be used to add an element dynamically or to get properties and set up  the object for a json input.
    addElement: function(type) {
        getOutput();
        var self = this;
        var blockWidth = blockWidth || 1;
        var innerPos = innerPos === undefined ? -1 : innerPos;
        var parent = parent || null;

        if (type == "action") {
            var el = new joint.shapes.devs.Coupled({
                size: self.minSize,
                label: 'Action',
                attrs: { 
                    text: { text: type }, 
                    rect: { fill: 'rgb(255,255,255)' }
                },
                elType: type,
                nameIn: '',
                scriptIn: [],
                RequiresIn: [],
                ProvidesIn:[],
                AgentsIn:[],
                ToolsIn:[]
            });
            outerColumns.push(el, false);
        } else {
            var el = new joint.shapes.devs.Coupled({
                size: self.minSize,
                attrs: { text: { text: type, class: 'label ' + type }, 
                    rect: { class: 'body ' + type, fill: '#ffffff' }
                },
                class: 'body ' + type,
                elType: type,
                verticalChildCount: 0
            });
            outerColumns.push(el);
            el.on("change:embeds", function(el, children) {
                self.childChanged(el, children, type);
            });
        }
        el.on("change:parent", function(el) {
            self.parentChanged(el, type);
        });
        svgResize();
        return el;
    },
        childChanged: function(parent, children, type) {
        if (type === "branch" || type === "selection") {
            this.verticalChildChanged(parent, children, type);
        }
    },
    verticalChildChanged: function(parent, children, type) {
        if (parent.get("verticalChildCount") < children.length) {
            parent.set("verticalChildCount", parent.get("verticalChildCount")+1);
            this.addChild(parent, children, type);
        } else if (parent.get("verticalChildCount") > children.length) {
            parent.set("verticalChildCount", parent.get("verticalChildCount")-1);
            this.removeChild(parent, children, type);
        }
    },
    parentChanged: function(element, type) {
        this.prevParentChanged = element;
    },
    addChild: function(parent, children, type) {
        switch(type) {
            case "branch":
            case "selection": {
                var size = {
                    width: parent.get("size").width,
                    height: nesting.minHeight(parent)
                }
                nesting.forceResize(parent, size);
            }
        }
    },
    removeChild: function(parent, children, type) {
        var self = this;
        // prevParentChanged is the object that has been removed
        var removed = this.prevParentChanged;
        var removedSize = removed.getBBox();

        var size = {
            width: parent.get("size").width,
            height: parent.get("size").height - removedSize.height - self.childPadding
        };
        if (children.length == 0) {
            size.height = this.minHeight;
        }

        nesting.forceResize(parent, size);
        nesting.resize(parent);
    }
}


//Columns deals with the movement of columns, and setting of poition NOT translations
function Columns(element) {
    this.columns = [];
    this.parent = element; 
}

Columns.prototype.getYCoord = function() {
    return (this.parent ? this.parent.get("position").y + 2 * grid.childPadding : grid.outerPadding + 2 * grid.childPadding);  
}

Columns.prototype.getColumnByXCoord = function(xCoord, oldCol) {
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

Columns.prototype.getXCoordByColumn = function(columnNum) {
    if (this.parent) {
        var xPos = this.parent.position().x + grid.childPadding;
    } else {
        var xPos = grid.outerPadding;
    }
    console.log(this.columns)
    for(var i = 0; i < columnNum; i++) {
        xPos += this.columns[i].width;
    }

    return xPos;
}

//Can only push onto outer columns
Columns.prototype.push = function(element) {
    //Update Data structure
    var length = this.columns.push(new Column(element, this));
    //Set position of new element
    this.columns[length - 1].changePos(this.getXCoordByColumn(length - 1), this.getYCoord());    
}

Columns.prototype.getMaxHeight = function() {
    var maxHeight = 0;
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].height > maxHeight) {
            maxHeight = this.columns[i].height;
        }  
    }
    return maxHeight;
}  

//https://jsperf.com/array-prototype-move/8
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

Columns.prototype.move = function(element, destinationXCoord) {
    if (!this.parent || this.parent.get("elType") === "sequence" || this.parent.get("elType") === "iteration") {
        //Get Columns
        var oldCol = this.getColumnPosByElementId(element.id);
        var newCol = this.getColumnByXCoord(destinationXCoord, oldCol);

        //If no column movement return
        if (typeof newCol === "undefined") {
            this.columns[oldCol].changePos(this.getXCoordByColumn(oldCol), this.getYCoord());
            this.redraw();
            return;
        }

        //Snap Element to Correct Poition
        this.columns[oldCol].changePos(this.getXCoordByColumn(newCol), this.getYCoord());

        //move elements in between two columns
        if (oldCol < newCol) {
            for (var i = oldCol + 1; i <= newCol; i++) {
                this.columns[i].pushDown(element.get("size").width + grid.outerPadding);
            }
        } else {
            for (var i = newCol; i <= oldCol - 1; i++) {
                this.columns[i].pushUp(element.get("size").width + grid.outerPadding);
            }
        }

        //rearrange datastructure
        this.columns.move(oldCol, newCol);    
    }
}

Columns.prototype.insert = function(column, destinationXCoord) {
    if (!this.parent || this.parent.get("elType") === "sequence" || this.parent.get("elType") === "iteration") {
        //Get Column to insert into
        var insertionColumn = this.getColumnByXCoord(destinationXCoord);

        //Move element
        console.log(this.getXCoordByColumn(insertionColumn), this.getYCoord());
        column.changePos(this.getXCoordByColumn(insertionColumn), this.getYCoord());

        //Rearrange data-structure
        this.columns.splice(insertionColumn, 0, column);

        //Update parent columns
        column.parentColumns = this;

        //Resize and reposition
        this.redraw();

    } else {
        this.columns.push(column);
    }
}

Columns.prototype.remove = function(element) {
    if (!this.parent || this.parent.get("elType") === "sequence" || this.parent.get("elType") === "iteration") {
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

        removedColumn.parentColumns = undefined;

        //Resize and reposition
        this.redraw();

        return removedColumn;
    } else {
        return this.columns.splice(this.getColumnPosByElementId(element.id), 1)[0];
    }
}

//Column must be already removed/added to data structure
//Changed parent size and repositions it's children
Columns.prototype.redraw = function() {
    var start = this.parent ? this.parent.position().x + grid.childPadding : grid.outerPadding;
    var xAccumulator = start;
    var y = this.getYCoord();
    if (this.parent) console.log("parent x: " + this.parent.position().x);
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
};

//Used only for a dragged element.
Column.prototype.changePos = function(x, y) {
    var oldPos = this.element.position();
    var translation = {
        x: x - oldPos.x,
        y: y - oldPos.y
    }

    this.element.translate(translation.x, translation.y);

    if (this.columns) {
        this.moveChildren(translation);
    }
}

//Used only for a dragged element.
Column.prototype.moveChildren = function(translation) {
    for (var i = 0; i < this.columns.length; i++) {
        if (this.columns[i].columns) {
            this.columns[i].element.translate(translation.x, translation.y);
            this.columns[i].columns.moveChildren(translation);
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
    this.element.set("size", {width: size.width - grid.outerPadding, height: size.height});
}



var checkName = function(str){
    var fstChar = str.charAt(0);
    if(!str.match(/([A-Z]|[a-z]|_)/)){
        addErr('All names must begin with either a letter or _');
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
    var exists = [];
    var toCheck = targets[0 + offset].value;
    if(toCheck.length > 0){
        exists.push(true);
        if(!checkName(toCheck)){
            return false;
        }
    }
    toCheck = targets[1+offset].value;
    if(!exists[0] && toCheck.length>0){
        addErr("Attributes cannot exist without resource");
        return false;
    }
    if(toCheck.length>0){
        if(!checkName(toCheck)){
            return false;
        }
    }
    toCheck = targets[3+offset].value;
    if(!exists[0] && toCheck.length>0){
        addErr("Attributes cannot exist without resource");
        return false;
    }
    if(toCheck.length>0){
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
    console.log(JSON.stringify(graph));
    graph.attributes.cells.models.forEach(
        function(cell, index, cells) {
            cells[index].set("column", columns[index]);
        }
    );
}

var setInput = function(jsonString) {
    graph.clear();
    console.log(jsonString)
    graph.fromJSON(jsonString);
}

var newColour = function() {
    //DON'T DELETE!!! I might want it later.... Théa 
    // var sumColour = 0;
    // for(var i=0; i<currentColour.length; i++){
    //     sumColour+=currentColour[i];
    // }
    // if(sumColour>600){
    //     currentColour[0] = Math.floor((Math.random() * 50) + 25);
    //     currentColour[1] = Math.floor((Math.random() * 50) + 25);
    //     currentColour[2] = Math.floor((Math.random() * 50) + 25);
    // }
    var index = Math.floor((Math.random() * 2) );
    var add = Math.floor((Math.random() * 240) + 20);
    currentColour[index]=add;
    return 'rgb('+currentColour[0]+','+currentColour[1]+','+currentColour[2]+')';
}


// $('.reqAdd').unbind('click');
// $('.provAdd').unbind('click');
// $('.ageAdd').unbind('click');
// $('.submitData').unbind('click');
$('.reqAdd').on('click' , function(){
    $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.provAdd').on('click', function(){
    $('<div class="provides"> <select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.ageAdd').on('click', function(){
    $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
});
$('.toolAdd').on('click', function(){
    $('<div class="tools"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" /> . <input type="text" placeholder="Attribute" /> <select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select> <input type="text" placeholder="Value" /></div>').insertBefore(this);
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
        currentRequiresVal.operator = targets[2 + offset].value;
        currentRequiresVal.value = targets[3 + offset].value;
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
        currentProvidesVal.operator = targets[2 + offset].value;
        currentProvidesVal.value = targets[3 + offset].value;
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
        currentAgentsVal.operator = targets[2 + offset].value;
        currentAgentsVal.value = targets[3 + offset].value;
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
    var toolsVals = [];
    $(this).parents('#myModal').find('.tools').each(function (){
        var currentToolssVal = {};
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
            currentToolssVal.relOp = targets[0].value;
            offset = 2; //includes op_1 and <br>
        }
        currentToolssVal.resource = targets[0 + offset].value;
        currentToolssVal.attribute = targets[1 + offset].value;
        currentToolssVal.operator = targets[2 + offset].value;
        currentToolssVal.value = targets[3 + offset].value;
        if(!blank){
            toolsVals.push(currentToolssVal); 
        }       
    });
    if(submitOk){
        if(nameVal.length > 0){
            collectioon[index].attr('text/text', nameVal);
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
                stops.push({offset:''+percent+'%',color:''+colourAgent[agentNames[j]]+''})
            }
            collectioon[index].attr('rect/fill', {
                                                type: 'linearGradient',
                                                stops: stops
                                            });
        }
        collectioon[index].set('RequiresIn', requireVals); 
        collectioon[index].set('ProvidesIn', providesVals);
        collectioon[index].set('AgentsIn', agentsVals); 
        collectioon[index].set('ToolsIn', toolsVals); 
        collectioon[index].set('nameIn', nameVal); 
        collectioon[index].set('scriptIn', scriptVal); 
        $('#myModal').modal('hide'); 
    }
});

$('#myModal').on('hidden.bs.modal', function () {
    $(this).find("input,textarea,select").val('');
    $(this).find('.requires').not(':first').remove();
    $(this).find('.provides').not(':first').remove();
    $(this).find('.agent').not(':first').remove();
    $(this).find('.tools').not(':first').remove();
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
        collectioon[index].attr('text/text', new_name);
    }
    else{
        collectioon[index].attr('text/text', collectioon[index].get('elType'));
    }
});

$('.delete_element').on('click', function(){
    $('#myModal').find('#errorMsg').children().remove(); //TODO not working properly
    var submitOk = true;
    var collectioon = graph.getCells();
    var cid = $(this).parents('.modal').find('.submitData,.submitElementUpdate').attr("source_id");
    var index = -1;
    for(var i = 0; i<collectioon.length; i++){
        if(collectioon[i].cid == cid){
            collectioon[i].get("column").columns.remove(collectioon[i]);
            collectioon[i].remove();
            break;
        }
    }
});