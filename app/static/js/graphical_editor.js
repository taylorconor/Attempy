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
                size: position.complexBlockSize,
                attrs: { text: { text: type } },
                blockSize: 1
            });
            el.on("change:embeds", function(el, children) { position.addChild(el, children, type); console.log(arguments); });
            return el;
        } break;
        case "action": {
            var el = new joint.shapes.html.Element({ 
                position: position.addOuterElement(1, true), 
                size: position.actionSize,
                label: 'Action',
                blockSize: 1
            });
            el.on("change:parent", function() { console.log(arguments)});
            return el;
        }
    }
}

var position = {

    //Block size contants
    outerPadding: 50,
    innerPadding: 20,
    actionCorrection: 50,
    actionSize: {width: 260, height: 300},
    complexBlockSize: {width: 300, height: 300},
    fullBlockWidth: 400,

    numOuterGridsFilled: 0,
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
    addChild: function(parent, children, type) {
        var self = this;
        var innerPos = children.length - 1;
        var parentPos = parent.get("position");
        
        switch(type) {
            case "branch":
            case "selection": {
                var size = self.complexBlockSize;
                size.height *= children.length;
                parent.resize(size.width, size.height);
                parent.set('blockSize', children.length);
                var pos = parentPos;
                pos.y += self.innerPadding + innerPos * self.fullBlockWidth;
                pos.x += self.innerPadding;
                var child = graph.get('cells').find(function(cell) {
                    return cell.id == children[children.length - 1];
                });
                child.set("position", pos);
            } break;
            case "iteration": 
            case "sequence":{
                var size = self.complexBlockSize;
                size.width *= children.length;
                parent.resize(size.width, size.height);
                var pos = parentPos;
                pos.x += self.innerPadding + innerPos * self.fullBlockWidth;
                pos.y += self.innerPadding;
                child.model.set("position", pos);
            }

        }
    },
    removeChild: function(child, children, type, parent){}
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
        this.$box.remove();
    }, 
    addreq: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.requires').append('<br><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Require" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option></select><input type="text" placeholder="Require" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" />');
    }, 
    addpro: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.provides').append('<br><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option></select><input type="text" placeholder="Require" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" />');
    }, 
    addact: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.agent').append('<br><select><option>||</option><option>&&</option></select><br><input type="text" placeholder="Resource" />.<input type="text" placeholder="attribute" /><select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select><input type="text" placeholder="Value" />');
        // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option></select><input type="text" placeholder="Require" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" />');
    }, 
    // addtool: function(){
    //     jqueryEle = $(this);
    //     jqueryEle.siblings('.tool').append('<select><option>||</option><option>&&</option></select><input type="text" placeholder="Tool" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" />');
    //     // this.$box.siblings('.requires').append('<select><option>||</option><option>&&</option></select><input type="text" placeholder="Require" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" />');
    // }
});

var getOutput = function() {
    $("#output").html(JSON.stringify(graph));
}



var addChild = function(patent, child) {

}

