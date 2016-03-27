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
    embeddingMode: true,
    validateEmbedding: function(childView, parentView) {
        return parentView.model instanceof joint.shapes.devs.Coupled;
    }
});
var svgResize = function() {
    var  svg = $('#v-2');
    try {
        var  bbox = paper.viewport.getBBox();
    }catch(err){
        return;
    }
    var newWidth = bbox.x + bbox.width + 10;
    if(newWidth < $('#paper').width()){
        newWidth = $('#paper').width();
    }
    var newHeight = bbox.y + bbox.height + 10;
    if(newHeight < window.innerHeight - $('#nav-bar').height()){
        newHeight = window.innerHeight - $('#nav-bar').height();
    }
    paper.setDimensions(newWidth, newHeight);
}

var connect = function(source, sourcePort, target, targetPort) {
    var link = new joint.shapes.devs.Link({
        source: { id: source.id, selector: source.getPortSelector(sourcePort) },
        target: { id: target.id, selector: target.getPortSelector(targetPort) }
    });
    link.addTo(graph).reparent();
};

/* custom highlighting */

var highlighter = V('circle', {
    'r': 14,
    'stroke': '#ff7e5d',
    'stroke-width': '6px',
    'fill': 'transparent',
    'pointer-events': 'none'
});



paper.off('cell:highlight cell:unhighlight').on({

    'cell:highlight': function(cellView, el, opt) {
        if (opt.embedding) {
            V(el).addClass('highlighted-parent');
        }
    },

    'cell:unhighlight': function(cellView, el, opt) {
        if (opt.embedding) {
            V(el).removeClass('highlighted-parent');
        }
    }
});

paper.on('cell:pointerup', function(cellView, evt, x, y) {

    //Find the first element below that is not a link nor the dragged element itself.
    var elementBelow = graph.getCells().filter( function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });

    //Find if it used to be a child.
    var exParent = graph.getCells().filter( function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(grid.currentlyMoving.position.x, grid.currentlyMoving.position.y))) {
            return true;
        }
        return false;
    });

    // Get elements "dropped" position
    var elementPos = cellView.model.get('position');

    var topLevelElements = graph.getCells().filter( function(cell) {
        return (cell.getAncestors().length === 0 && cell.id !== cellView.model.id)
    });


    console.log(topLevelElements.length)

    if (Object.prototype.toString.call(topLevelElements) !== "[object Array]") {
        topLevelElements = [topLevelElements];
    }


    if (!elementBelow.length) {
        var distanceFromNearestLowerGrid = elementPos.x % grid.fullBlockWidth;
        var movingUp = elementPos.x > grid.currentlyMoving.position.x;

        if (movingUp && distanceFromNearestLowerGrid < grid.outerPadding) {
            //goes before the element in this grid
            var offSet = -1 * (grid.fullBlockWidth - distanceFromNearestLowerGrid);
        } else if (movingUp || distanceFromNearestLowerGrid < grid.outerPadding) {
            //goes on element in this grid and this one moves
            var offSet = -1 * distanceFromNearestLowerGrid;
        } else {
            //goes after this element
            var offSet = grid.fullBlockWidth - distanceFromNearestLowerGrid;
        }

        //set x pos
        elementPos.x += offSet + grid.outerPadding;

        //If beyond beginning or end, adjust
        if (elementPos.x > (grid.columnsFilled - 1) * grid.fullBlockWidth) {
            elementPos.x = (grid.columnsFilled - 1) * grid.fullBlockWidth + grid.outerPadding;
        } else if (elementPos.x < 0) {
            elementPos.x = grid.outerPadding;
        }

        //set y pos
        elementPos.y = grid.outerPadding;
        if (cellView.model instanceof joint.shapes.html.Element) {
            elementPos.y += grid.outerPadding;
        }



        //If it moving from onw root to another
        if (!exParent.length) {
            topLevelElements.map(function(cell) {
                //Don't move the element again
                if (cellView.model.id === cell.id) {
                    return;
                } else if (movingUp) {
                    if (cell.get("position").x <= elementPos.x && cell.get("position").x >= grid.currentlyMoving.position.x) {
                        //If between the start and finish move down
                        cell.translate(-1 * grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
                    }
                } else { //moving down
                    if (cell.get("position").x >= elementPos.x && cell.get("position").x <= grid.currentlyMoving.position.x) {
                        //if between start and finish move up
                        cell.translate(grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
                    }
                }
            });
        } else {
            //If it used to have a parent
            topLevelElements.map(function(cell) {
                //Don't move it again
                if (cell.get("position").x >= elementPos.x) {
                    //If higer than new pos move up
                    cell.translate(grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
                }
            });
            grid.columnsFilled += cellView.model.get("columnWidth");
        }
        //translate element to correct grid place
        cellView.model.translate(elementPos.x - cellView.model.get('position').x, elementPos.y - cellView.model.get('position').y);
    } else if (!exParent.length){
        //Moving from root into an element
        topLevelElements.map(function(cell) {
            //If cell higher than old position move down
            console.log(cell.get("position").x, grid.currentlyMoving.position.x)
            if (cell.get("position").x > grid.currentlyMoving.position.x) {
                cell.translate(-1 * grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
            }
        });
        console.log(cellView.model.get("columnWidth"));
        grid.columnsFilled -= cellView.model.get("columnWidth");
    } //Nothing to do if moving from element to element

});


paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    grid.currentlyMoving.position = cellView.model.get('position');
    grid.currentlyMoving.columnWidth = cellView.model.get('columnWidth');
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
            var childSize = {
                width: childWidth,
                height: nesting.minHeight(child)
            };
            child.set("size", childSize);
            var childPos = {
                x: el.get("position").x + grid.childPadding,
                y: el.get("position").y + grid.childPadding*2 + runningHeight
            }
            child.set("position", childPos);
            runningHeight += childSize.height + grid.childPadding;

            // recurse with the current child as the parent
            nesting._resizeHeight(child);
        }
    },
    _resizeWidth: function(el) {
        var newSize = {
            width: this.minWidth(el),
            height: el.get("size").height
        }
        el.set("size", newSize);
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

var grid = {

    //Block size contants
    outerPadding: 50,
    childPadding: 20,
    actionCorrection: 50,
    actionSize: {width: 200, height: 75},
    fullBlockWidth: 400,

    // keep a copy of the last element whos parent has changed
    prevParentChanged: null,

    actionHeight: 600,

    columnsFilled: 0,
    currentlyMoving: {},

    // minimum element size
    minHeight: 50,
    minWidth: 150,
    colWidth: 400,

    // this is the size of a container with no contents
    minSize: {width: 300, height: 50},

    //Can be used to add an element dynamically or to get properties and set up  the object for a json input.
    addElement: function(type) {
        var self = this;
        var blockWidth = blockWidth || 1;
        var innerPos = innerPos === undefined ? -1 : innerPos;
        var parent = parent || null;

        if (type == "action") {
            var el = new joint.shapes.html.Element({
                position: self.getPos(type, 1),
                size: self.actionSize,
                label: 'Action',
                columnWidth: 1,
                startColumn: self.columnsFilled,
                nameIn: '',
                scriptIn: [],
                RequiresIn: [],
                ProvidesIn:[],
                AgentsIn:[]
            });
        } else {
            var el = new joint.shapes.devs.Coupled({
                position: self.getPos(type, 1),
                size: self.minSize,
                attrs: { text: { text: type } },
                columnWidth: 1,
                childCount: 0,
                startColumn: self.columnsFilled
            });
            el.on("change:embeds", function(el, children) {
                self.childChanged(el, children, type);
            });
            el.on("change:parent", function(el) {
                self.parentChanged(el, type);
            });
        }
        svgResize();
        return el;
    },
    getPos: function(type, blockWidth, innerPos, parent) {
        var self = this;
        var innerPos = innerPos || -1;


        if (innerPos < 0) {
            var pos = { x: this.fullBlockWidth * this.columnsFilled + this.outerPadding, y: this.outerPadding };
            if (type == "action") {
                pos.y += this.actionCorrection;
            }
            this.columnsFilled += blockWidth;
        }
        //THis bit needs rewriting/refactoring
        // else {
        //     var pos = parent.position();
        //     pos.y += this.actionCorrection;
        //     switch (parent) {
        //         case "branch":
        //         case "selection": {
        //             pos.x += self.childPadding;
        //             pos.y += self.childPadding  + (self.childPadding + self.actionHeight) * innerPos;
        //         } break;

        //         case "sequence":
        //         case "iteration": {
        //             pos.x += self.childPadding + self.outerPadding + innerPos * self.fullBlockWidth;
        //             pos.y += self.childPadding;
        //         } break;

        //         default: return undefined;
        //     }
        // }
        return pos;
    },
    removeOuterElement: function(elPos, size) {
        this.columnsFilled -= size;
    },
    childChanged: function(parent, children, type) {
        console.log("childChanged");
        console.log(parent.get("childCount"), children.length);
        if (parent.get("childCount") < children.length) {
            parent.set("childCount", parent.get("childCount")+1);
            this.addChild(parent, children, type);
        } else {
            parent.set("childCount", parent.get("childCount")-1);
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
    },
    removeElement: function(event, element){
        console.log(arguments);
    }
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
        'Action Name: <span class ="name1"></span> <br>',
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
            var scriptVal = $(this).parents('#myModal').find('.scriptInput').val();
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
        // removed height: bbox.height to allow the div to resize to fit when things added
        this.$box.css({ width: bbox.width,height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        grid.removeElement(evt, this);
        this.$box.remove();
    }

});

var getOutput = function() {
    $("#output").html(JSON.stringify(graph));
}

var setInput = function(jsonString) {
    // graph.clear();
    graph.fromJSON(jsonString);
}
