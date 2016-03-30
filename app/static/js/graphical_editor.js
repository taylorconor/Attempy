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

var horizontalNesting = ["sequence", "iteration", undefined];

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
var movingColumn = undefined;

paper.on('cell:pointerdown', function(cellView, evt, x, y) {    
    var exParent = cellView.model.getAncestors();

    if (exParent.length) {
        exParent[0].unembed(cellView.model);
        movingColumn = exParent[0].get("column").columns.remove(cellView.model);
    } else {
        movingColumn = outerColumns.remove(cellView.model);
    }
    cellView.model.set("z", 999);
});

paper.on('cell:pointerup', function(cellView, evt, x, y) {
    if (currentlyHighlighted) {
        V(paper.findViewByModel(currentlyHighlighted).el).removeClass('highlighted-parent');
        currentlyHighlighted = undefined;
    }

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
            cellView.model.set("z", elementBelow[i].get("z") + 1);
            var embeddedInto = elementBelow[i];
            embedded = true;
            break;
        }
    }
    if (typeof embeddedInto === "undefined") {
        cellView.model.set("z", 1);
    }

    if (embedded) {
        embeddedInto.get("column").columns.insert(movingColumn, cellView.model.get('position').x);
        embeddedInto.embed(cellView.model);
    } else {
        outerColumns.insert(movingColumn, cellView.model.get('position').x);
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

            if (horizontalNesting.indexOf(child.attr("text/text")) !== -1) {
                child.get("column").columns.updateSize()
            } else {
                child.set("size", childSize);
            }
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
            var el = new joint.shapes.html.Element({
                size: self.minSize,
                label: 'Action',
                nameIn: '',
                scriptIn: [],
                RequiresIn: [],
                ProvidesIn:[],
                AgentsIn:[]
            });
            outerColumns.push(el, false);
        } else {
            var el = new joint.shapes.devs.Coupled({
                size: self.minSize,
                attrs: { text: { text: type } },
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
    if (!this.parent || this.parent.attr("text/text") === "sequence" || this.parent.attr("text/text") === "iteration") {
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
    if (!this.parent || this.parent.attr("text/text") === "sequence" || this.parent.attr("text/text") === "iteration") {
        //Get Column to insert into
        var insertionColumn = this.getColumnByXCoord(destinationXCoord);

        //Move element
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
    if (!this.parent || this.parent.attr("text/text") === "sequence" || this.parent.attr("text/text") === "iteration") {
        //get column to remove from
        var removalColumnIndex = this.getColumnPosByElementId(element.id);

        //Rearrange Data Structure
        if (this.columns.length === 1) {
            var removedColumn = this.columns[0];
            this.columns = [];
        } else {
            var removedColumn = this.columns.splice(removalColumnIndex, 1)[0];
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

joint.shapes.html = {};
joint.shapes.html.Element = joint.shapes.basic.Rect.extend({
    defaults: joint.util.deepSupplement({
        type: 'html.Element',
        attrs: {
            rect: { stroke: 'none', 'fill-opacity': 0 }
        }
    }, joint.shapes.basic.Rect.prototype.defaults)
});

// Create a custom view for that element that displays an HTML div above it.
// -------------------------------------------------------------------------

joint.shapes.html.ElementView = joint.dia.ElementView.extend({

    template: [
        '<div class="html-element">',
        '<button class="delete">x</button>',
        '<span class="action-title">Action Name: </span><span class ="name1"></span>',
        '<button type="button" class="btn btn-primary openMod ">View Details</button>',
        '</div>'


    ].join(''),

    initialize: function() {
        var self = this;
        _.bindAll(this, 'updateBox');
        // _.bindAll(this, 'addreq');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);
        self = this;
        this.$box = $(_.template(this.template)());
        // Prevent paper from handling pointerdown.
        this.$box.find('input,select').on('mousedown click', function(evt) { evt.stopPropagation(); });
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.$box.find('input').on('change', _.bind(function(evt) {
            this.model.set('input', $(evt.target).val());
        }, this));
        this.$box.find('select').on('change', _.bind(function(evt) {
            this.model.set('select1', $(evt.target).val());
        }, this));
        this.$box.find('.nameAction').on('change', _.bind(function(evt) {
            this.model.set('nameIn', $(evt.target).val());
        }, this));
        this.$box.find('.scriptInput').on('change', _.bind(function(evt) {
            this.model.set('scriptIn', $(evt.target).val());
        }, this));
        this.$box.find('.openMod').on('click', _.bind(function(evt) {
            var colId = this.model.cid; 
            var myModal = $('#myModal');
            myModal.find('.submitData').attr("source_id",colId);
            myModal.find('.nameAction').val(this.model.get('nameIn'));

            var scripts = this.model.get('scriptIn');
            if(scripts.length>0){
                //TODO will we only ever have one script?
                myModal.find('.scriptInput').val(scripts[0]);
            }
            var reqs = this.model.get('RequiresIn');
            for(var i=0; i<reqs.length; i++){
                if(i===0){
                    var targets = myModal.find('.requires').children();
                    targets[0].value = reqs[i].resource;
                    targets[1].value = reqs[i].attribute;
                    targets[2].value = reqs[i].operator;
                    targets[3].value = reqs[i].value;
                }
                else{
                    $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input value="'+ reqs[i].resource +'" type="text" placeholder="Resource" />.<input value="'+reqs[i].attribute+'" type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input value="'+reqs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.reqAdd');
                    myModal.find('.requires:last').find('select:first').val(reqs[i].relOp);
                    myModal.find('.requires:last').find('select:last').val(reqs[i].operator);
                }
            }
            var provs = this.model.get('ProvidesIn');
            for(var i=0; i<provs.length; i++){
                if(i===0){
                    var targets = myModal.find('.provides').children();
                    targets[0].value = provs[i].resource;
                    targets[1].value = provs[i].attribute;
                    targets[2].value = provs[i].operator;
                    targets[3].value = provs[i].value;
                }
                else{
                    $('<div class="provides"><select><option>||</option><option>&&</option></select><br><input value="'+ provs[i].resource +'" type="text" placeholder="Resource" />.<input value="'+provs[i].attribute+'" type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input value="'+provs[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.provAdd');
                    myModal.find('.provides:last').find('select:first').val(provs[i].relOp);
                    myModal.find('.provides:last').find('select:last').val(provs[i].operator);
                }
            }
            var agents = this.model.get('AgentsIn');
            for(var i=0; i<agents.length; i++){
                if(i===0){
                    var targets = myModal.find('.agent').children();
                    targets[0].value = agents[i].resource;
                    targets[1].value = agents[i].attribute;
                    targets[2].value = agents[i].operator;
                    targets[3].value = agents[i].value;
                }
                else{
                    $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input value="'+ agents[i].resource +'" type="text" placeholder="Resource" />.<input value="'+agents[i].attribute+'" type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input value="'+agents[i].value+'"type="text" placeholder="Value" /></div>').insertBefore('.ageAdd');
                    myModal.find('.agent:last').find('select:first').val(agents[i].relOp);
                    myModal.find('.agent:last').find('select:last').val(agents[i].operator);
                }
            }
            
            $('#myModal').modal('show');            
        }, this));
        this.$box.find('select1').val(this.model.get('select'));
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
        $('.reqAdd').unbind('click');
        $('.provAdd').unbind('click');
        $('.ageAdd').unbind('click');
        $('.submitData').unbind('click');
        $('.reqAdd').on('click' , function(){
            $('<div class="requires"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" /></div>').insertBefore(this);
        });
        $('.provAdd').on('click', function(){
            $('<div class="provides"> <select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" /></div>').insertBefore(this);
        });
        $('.ageAdd').on('click', function(){
            $('<div class="agent"><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" /></div>').insertBefore(this);
        });
        $('.submitData').on('click', function(){
            var collectioon = self.model.collection;
            var cid = $(this).attr("source_id");
            var index = -1;
            for(var i = 0; i<collectioon.length; i++){
                if(collectioon.models[i].cid == cid){
                    index = i;
                    break;
                }
            }
            var nameVal = $(this).parents('#myModal').find('.nameAction').val();
            var scriptVal = [];
            scriptVal.push($(this).parents('#myModal').find('.scriptInput').val());

            var requireVals = [];
            $(this).parents('#myModal').find('.requires').each(function(){
                var currentRequiresVal = {};
                var targets = $(this).children();
                var offset = 0;
                if(targets.length > 4){
                    currentRequiresVal.relOp = targets[0].value;
                    offset = 2; //includes op_1 and <br>
                }
                currentRequiresVal.resource = targets[0 + offset].value;
                currentRequiresVal.attribute = targets[1 + offset].value;
                currentRequiresVal.operator = targets[2 + offset].value;
                currentRequiresVal.value = targets[3 + offset].value;
                requireVals.push(currentRequiresVal);
            });
            var providesVals = [];
            $(this).parents('#myModal').find('.provides').each(function (){
                var currentProvidesVal = {};
                var targets = $(this).children();
                var offset = 0;
                if(targets.length > 4){
                    currentProvidesVal.relOp = targets[0].value;
                    offset = 2; //includes op_1 and <br>
                }
                currentProvidesVal.resource = targets[0 + offset].value;
                currentProvidesVal.attribute = targets[1 + offset].value;
                currentProvidesVal.operator = targets[2 + offset].value;
                currentProvidesVal.value = targets[3 + offset].value;
                providesVals.push(currentProvidesVal);
            });
            var agentsVals = [];
            $(this).parents('#myModal').find('.agent').each(function (){
                var currentAgentsVal = {};
                var targets = $(this).children();
                var offset = 0;
                if(targets.length > 4){
                    currentAgentsVal.relOp = targets[0].value;
                    offset = 2; //includes op_1 and <br>
                }
                currentAgentsVal.resource = targets[0 + offset].value;
                currentAgentsVal.attribute = targets[1 + offset].value;
                currentAgentsVal.operator = targets[2 + offset].value;
                currentAgentsVal.value = targets[3 + offset].value;
                agentsVals.push(currentAgentsVal);        
            });
            self.model.collection.models[index].set('RequiresIn', requireVals); 
            self.model.collection.models[index].set('ProvidesIn', providesVals);
            self.model.collection.models[index].set('AgentsIn', agentsVals); 
            self.model.collection.models[index].set('nameIn', nameVal); 
            self.model.collection.models[index].set('scriptIn', scriptVal); 
        })

        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
        $('#myModal').on('hidden.bs.modal', function () {
            $(this).find("input,textarea,select").val('').end();
            $(this).find('.requires').not(':first').remove();
            $(this).find('.provides').not(':first').remove();
            $(this).find('.agent').not(':first').remove();
        });
    },
    modalDataUpdate: function(reqVal, provVal, ageVal){
        this.model.set('RequiresIn', reqVal);
        this.model.set('ProvidesIn', provVal);
        this.model.set('AgentsIn', ageVal);
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        svgResize();
        return this;
    },
    updateBox: function() {
        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        var acName = this.model.get('nameIn');
        if(acName.length>12){
            acName = acName.substring(0,12)+"...";
        }
        this.$box.find('.name1').text(acName);
        if (acName.length) {
            this.$box.find('.action-title').text("");
        }  else {
            this.$box.find('.action-title').text("Action Name: ");
        }
        
        // removed height: bbox.height to allow the div to resize to fit when things added
        this.$box.css({ width: bbox.width,height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        //grid.removeElement(evt, this);
        //eden commented this out on 29th march because the function doesn't exist 
        //could not load file due to error
        this.$box.remove();
    }

});

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
