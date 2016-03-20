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
    var elementBelow = graph.get('cells').find(function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });

    //Find if it used to be a child.
    var exParent = graph.get('cells').find(function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(grid.currentlyMoving.position.x, grid.currentlyMoving.position.y))) {
            return true;
        }
        return false;
    });

    // Get elements "dropped" position
    var elementPos = cellView.model.get('position');

    if (!elementBelow) {
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

        //translate element to correct grid place
        cellView.model.translate(elementPos.x - cellView.model.get('position').x, elementPos.y - cellView.model.get('position').y);

        //If it moving from onw root to another
        if (!exParent) {
            graph.get('cells').map(
                function(cell) {
                    //Don't move the element again
                    if (cellView.model.id === cell.id) {
                        return;
                    } else if (cellView.model.get("embeds") && cellView.model.get("embeds").indexOf(cell.id) > -1) {
                        //If this element has children move them the same translation.
                        cell.translate(elementPos.x - grid.currentlyMoving.position.x, 0);
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
                }
            );  
        } else {
            //If it used to have a parent
            graph.get('cells').map(function(cell) {
                //Don't move it again
                if (cell.id === cellView.model.id) {
                    return;
                }else if (cellView.model.get("embeds") && cellView.model.get("embeds").indexOf(cell.id) > -1) {
                    //If this element has children move them the same translation.
                    cell.translate(elementPos.x - grid.currentlyMoving.position.x, 0);
                } else if (cell.get("position").x >= elementPos.x) {
                    //If higer than new pos move up
                    cell.translate(grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
                }
            }); 
        }
    } else if (!exParent){
        //Moving from root into an element
        graph.get('cells').map(function(cell) {
            //If cell higher than old position move down
            if (cell.get("position").x > grid.currentlyMoving.position.x) {
                cell.translate(-1 * grid.fullBlockWidth * grid.currentlyMoving.columnWidth, 0);
            }
        }); 
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
            this._resize(toResize);
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
    _resize: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            // no children to resize
            return;
        }

        var childWidth = el.get("size").width - grid.innerPadding*2;
        var runningHeight = 0;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var childSize = {
                width: childWidth,
                height: nesting.minHeight(child)
            };
            child.set("size", childSize);
            var childPos = {
                x: el.get("position").x + grid.innerPadding,
                y: el.get("position").y + grid.innerPadding*2 + runningHeight
            }
            child.set("position", childPos);
            runningHeight += childSize.height + grid.innerPadding;

            // recurse with the current child as the parent
            nesting._resize(child);
        }
    },
    // finds the minimum possible height of an element
    minHeight: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            return grid.minHeight;
        }

        var minChildHeight = grid.innerPadding*2;
        for (var i = 0; i < children.length; i++) {
            minChildHeight += nesting.minHeight(children[i]) + grid.innerPadding;
        }
        return minChildHeight;
    }
};

var grid = {

    //Block size contants
    outerPadding: 50,
    childPadding: 20,
    actionCorrection: 50,
    complexBlockSize: {width: 300, height: 300},
    actionSize: {width: 260, height: 260},
    fullBlockWidth: 400,

    // keep a copy of the last element whos parent has changed
    prevParentChanged: null,

    actionHeight: 600,

    columnsFilled: 0,
    currentlyMoving: {},

    // minimum element height
    minHeight: 50,
    colWidth: 400,
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
                startColumn: self.columnsFilled
            });
        } else {
            var el = new joint.shapes.devs.Coupled({
                position: self.getPos(type, 1), 
                size: self.complexBlockSize,
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
        nesting.resize(parent);
    },
    removeChild: function(parent, children, type) {
        var self = this;
        // prevParentChanged is the object that has been removed
        var removed = this.prevParentChanged;
        var removedSize = removed.getBBox();

        var size = {
            width: parent.get("size").width,
            height: parent.get("size").height - removedSize.height - self.innerPadding
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

        '<label></label><span></span><br>', 
        '<input class="full " id="name1" type="text" placeholder="Enter Action Name" /><br>',         
        '<input class="full " id = "script" type="text" placeholder="Enter Script" /> ',
        //requires
        '<br>Requires:<br>',
        '<div class="requires"><input type="text" placeholder="Resoure" />',
        '.<input type="text" class = "" placeholder="attribute" />',
        '<select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option>',
        '<input type="text" placeholder="Value" /></div>',
        '<button class=" reqAdd">add</button>',
        //provides
        '<br>Provides:<br>',
        '<div class="provides"><input type="text" placeholder="Resource" />.',
        '<input type="text" class = ""  placeholder="attribute" />',
        '<select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option>',
        '<input type="text" class = ""  placeholder="Value" /></div>',
        '<button class=" provAdd">add</button>',
        //agents
        '<br>Agents:<br>',
        '<div class="agent"><input type="text" placeholder="Resource" />.',
        '<input type="text" placeholder="attribute" />',
        '<select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option>',
        '<input type="text" class = ""  placeholder="Value" /></div>',
        '<button class=" ageAdd ">add</button>',
        // '<div class="tool"><input type="text" placeholder="Tool" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" /></div>',
        // '<button class="toolAdd">add</button>',
        '</div>'
        // drop down for oporators 
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

        this.$box = $(_.template(this.template)());
        // Prevent paper from handling pointerdown.
        this.$box.find('input,select').on('mousedown click', function(evt) { evt.stopPropagation(); });
        // This is an example of reacting on the input change and storing the input data in the cell model.
        this.$box.find('input').on('change', _.bind(function(evt) {
            this.model.set('input', $(evt.target).val());
        }, this));
        this.$box.find('select').on('change', _.bind(function(evt) {
            this.model.set('select', $(evt.target).val());
        }, this));
        this.$box.find('select').val(this.model.get('select'));
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
        this.$box.find('.reqAdd').on('click', this.addreq);
        this.$box.find('.provAdd').on('click', this.addpro);
        this.$box.find('.ageAdd').on('click', this.addact);
        this.$box.find('.toolAdd').on('click', this.addtool);
        // Update the box position whenever the underlying model changes.
        this.model.on('change', this.updateBox, this);
        // Remove the box when the model gets removed from the graph.
        this.model.on('remove', this.removeBox, this);

        this.updateBox();
    },
    render: function() {
        joint.dia.ElementView.prototype.render.apply(this, arguments);
        this.paper.$el.prepend(this.$box);
        this.updateBox();
        return this;
    },
    updateBox: function() {
        // Set the position and dimension of the box so that it covers the JointJS element.
        var bbox = this.model.getBBox();
        // Example of updating the HTML with a data stored in the cell model.
        this.$box.find('label').text(this.model.get('label'));
        this.$box.find('span').text(this.model.get('#name1'));
        // removed height: bbox.height to allow the div to resize to fit when things added
        this.$box.css({ width: bbox.width, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        grid.removeElement(evt, this);
        this.$box.remove();
    },
    addreq: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    },
    addpro: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.provides').append('<select><option>||</option><option>&&</option><input type="text" value="Provides" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    },
    addact: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.agent').append('<select><option>||</option><option>&&</option><input type="text" value="Agent" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    },
    // addtool: function(){
    //     jqueryEle = $(this);
    //     jqueryEle.siblings('.tool').append('<select><option>||</option><option>&&</option><input type="text" value="Tool" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    //     // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    // }

});

var getOutput = function() {
    $("#output").html(JSON.stringify(graph));
}
