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
    // Find the first element below that is not a link nor the dragged element itself.
    var elementBelow = graph.get('cells').find(function(cell) {
        if (cell instanceof joint.dia.Link) return false; // Not interested in links.
        if (cell.id === cellView.model.id) return false; // The same element as the dropped one.
        if (cell.getBBox().containsPoint(g.point(x, y))) {
            return true;
        }
        return false;
    });

    if (!elementBelow) {
        var xPos = cellView.model.get('position').x;
        var offSet = (xPos % position.fullBlockWidth > position.fullBlockWidth / 2)
                                ? position.fullBlockWidth - xPos % position.fullBlockWidth
                                : -1 * (xPos % position.fullBlockWidth);
        xPos += offSet + position.outerPadding;
        graph.get('cells').map(function(cell) {
            if (xPos > cellMoving.position.x) {
                if (cell.get("position").x < xPos && cellMoving.position.x > cellMoving.position.x) {
                    cell.translate(-1 * position.fullBlockWidth * cellMoving.blockSize, 0);
                }
            } else {
                if (cell.get("position").x > xPos && cellMoving.position.x < cellMoving.position.x) {
                    cell.translate(position.fullBlockWidth * cellMoving.blockSize, 0);
                }
            }
        });
        cellView.model.set("position", {x: xPos + 50, y: position.outerPadding + position.actionCorrection});
    } else {
        graph.get('cells').map(function(cell) {
            //if (elementBelow.id !== cell.id) {
                if (xPos > cellMoving.position.x) {
                    if (cell.get("position").x < cellView.position.x) {
                        cell.translate(-1 * position.fullBlockWidth * cellMoving.blockSize, 0);
                    }
                }
            //}
        });
    }

});

var cellMoving = {};
paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    cellMoving.position = cellView.model.get('position');
    cellMoving.blockSize = cellView.model.get('blockSize');
});

var insert = function(type) {
    type = type || "branch";
    graph.addCell(getElement(type));
}

var getElement = function(type) {
    type = type || "branch";
    switch(type) {
        case "branch":
        case "sequence":
        case "iteration":
        case "selection": {
            var el = new joint.shapes.devs.Coupled({
                position: position.addOuterElement(1),
                size: position.minSize,
                attrs: { text: { text: type } },
                childCount: 0,
                blockSize: 1
            });
            el.on("change:embeds", function(el, children) {
                position.childChanged(el, children, type);
            });
            el.on("change:parent", function(el) {
                position.parentChanged(el, type);
            });
            return el;
        } break;
        case "action": {
            var el = new joint.shapes.html.Element({
                position: position.addOuterElement(1, true),
                size: position.actionSize,
                label: 'Action',
                blockSize: 1
            });
            return el;
        }
    }
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

        var childWidth = el.get("size").width - position.innerPadding*2;
        var runningHeight = 0;
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var childSize = {
                width: childWidth,
                height: nesting.minHeight(child)
            };
            child.set("size", childSize);
            var childPos = {
                x: el.get("position").x + position.innerPadding,
                y: el.get("position").y + position.innerPadding*2 + runningHeight
            }
            child.set("position", childPos);
            runningHeight += childSize.height + position.innerPadding;

            // recurse with the current child as the parent
            nesting._resize(child);
        }
    },
    // finds the minimum possible height of an element
    minHeight: function(el) {
        var children = el.getEmbeddedCells();
        if (children == "") {
            return position.minHeight;
        }

        var minChildHeight = position.innerPadding*2;
        for (var i = 0; i < children.length; i++) {
            minChildHeight += nesting.minHeight(children[i]) + position.innerPadding;
        }
        return minChildHeight;
    }
};

var position = {

    //Block size contants
    outerPadding: 50,
    innerPadding: 20,
    actionCorrection: 50,
    actionSize: {width: 260, height: 260},
    fullBlockWidth: 400,
    numOuterGridsFilled: 0,

    // keep a copy of the last element whos parent has changed
    prevParentChanged: null,

    // minimum element height
    minHeight: 50,

    colWidth: 400,
    minSize: {width: 300, height: 50},

    addOuterElement: function(size, isAction) {
        var blockPos = this.fullBlockWidth * this.numOuterGridsFilled;
        this.numOuterGridsFilled += size;
        var pos = { x: blockPos + this.outerPadding, y: this.outerPadding };
        if (isAction) {
            pos.y += this.actionCorrection;
        }
        return pos;
    },
    removeOuterElement: function(elPos, size) {
        this.numOuterGridsFilled -= size;
    },
    childChanged: function(parent, children, type) {
        if (parent.get("childCount") < children.length) {
            parent.set("childCount", parent.get("childCount")+1);
            position.addChild(parent, children, type);
        } else {
            parent.set("childCount", parent.get("childCount")-1);
            position.removeChild(parent, children, type);
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
        // prevParentChanged is the object that has been removed
        var removed = this.prevParentChanged;
        var removedSize = removed.getBBox();

        var size = {
            width: parent.get("size").width,
            height: parent.get("size").height - removedSize.height - position.innerPadding
        };
        if (children.length == 0) {
            size.height = position.minHeight;
        }

        nesting.forceResize(parent, size);
        nesting.resize(parent);
    },
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
        '<label></label><span></span>',
        '<input id="name1" type="text" value="Enter Action Name" />',
        '<input id = "script" type="text" value="Enter Script" /> ',
        '<div class="requires"><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" /></div>',
        '<button class="reqAdd">add</button>',
        '<div class="provides"><input type="text" value="Provides" />.<input type="text" value="attribute" />=<input type="text" value="Value" /></div>',
        '<button class="provAdd">add</button>',
        '<div class="agent"><input type="text" value="Agent" />.<input type="text" value="attribute" />=<input type="text" value="Value" /></div>',
        '<button class="ageAdd">add</button>',
        '<div class="tool"><input type="text" value="Tool" />.<input type="text" value="attribute" />=<input type="text" value="Value" /></div>',
        '<button class="toolAdd">add</button>',
        '</div>'
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
        this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
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
    addtool: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.tool').append('<select><option>||</option><option>&&</option><input type="text" value="Tool" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option><input type="text" value="Require" />.<input type="text" value="attribute" />=<input type="text" value="Value" />');
    }
});

var getOutput = function() {
    $("#output").html(JSON.stringify(graph));
}
