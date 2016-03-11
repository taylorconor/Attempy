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
    },
    validateConnection: function(sourceView, sourceMagnet, targetView, targetMagnet) {
        return sourceMagnet != targetMagnet;
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

// First, unembed the cell that has just been grabbed by the user.
paper.on('cell:pointerdown', function(cellView, evt, x, y) {
    
    var cell = cellView.model;

    if (!cell.get('embeds') || cell.get('embeds').length === 0) {
        // Show the dragged element above all the other cells (except when the
        // element is a parent).
        cell.toFront();
    }
    
    if (cell.get('parent')) {
        graph.getCell(cell.get('parent')).unembed(cell);
    }
});

// When the dragged cell is dropped over another cell, let it become a child of the
// element below.
paper.on('cell:pointerup', function(cellView, evt, x, y) {

    var cell = cellView.model;
    var cellViewsBelow = paper.findViewsFromPoint(cell.getBBox().center());
    if (cellViewsBelow.length) {
        // Note that the findViewsFromPoint() returns the view for the `cell` itself.
        var cellViewBelow = _.find(cellViewsBelow, function(c) { return c.model.id !== cell.id });
    
        // Prevent recursive embedding.
        if (cellViewBelow && cellViewBelow.model.get('parent') !== cell.id) {
            cellViewBelow.model.embed(cell);
        }
    }
});


// paper.off('cell:highlight cell:unhighlight').on({
    
//     'cell:highlight': function(cellView, el, opt) {
//         console.log(arguments);
//         if (opt.embedding) {
//             V(el).addClass('highlighted-parent');
//         }

//         if (opt.connecting) {
//             var bbox = V(el).bbox(false, paper.viewport);
//             highlighter.translate(bbox.x + 10, bbox.y + 10, { absolute: true });
//             V(paper.viewport).append(highlighter);
//         }
//     },
    
//     'cell:unhighlight': function(cellView, el, opt) {

//         if (opt.embedding) {
//             V(el).removeClass('highlighted-parent');
//         }

//         if (opt.connecting) {
//             highlighter.remove();
//         }
//     }
// });

var elements = [];

var insert = function(type) {
    type = type || "branch";
    var el = getElement(type);
    elements.push(el);
    graph.addCell(el);  
}

var getElement = function(type) {
    type = type || "branch";
    switch(type) {
        case "branch": {
            return new joint.shapes.devs.Coupled({
                position: { x: 230, y: 150 },
                size: { width: 300, height: 300 },
                inPorts: ['in'],
                outPorts: ['out'],
                attrs: { text: { text: type } }
            });
        } break;
        case "sequence": {
            return new joint.shapes.devs.Coupled({
                position: { x: 230, y: 150 },
                size: { width: 300, height: 300 },
                inPorts: ['in'],
                outPorts: ['out'],
                attrs: { text: { text: type } }
            });
        } break;
        case "iteration": {
            return new joint.shapes.devs.Coupled({
                position: { x: 230, y: 150 },
                size: { width: 300, height: 300 },
                inPorts: ['in'],
                outPorts: ['out'],
                attrs: { text: { text: type } }
            });
        } break;
        case "action": {
            return new joint.shapes.html.Element({ 
                position: { x: 80, y: 80 }, 
                size: { width: 170, height: 100 }, 
                label: 'Action', 
                select: 'one' 
            });
        }
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
        '<label></label>',
        '<span></span>', '<br/>',
        '<select><option>--</option><option>one</option><option>two</option></select>',
        '<input type="text" value="I\'m HTML input" />',
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
        this.$box.find('span').text(this.model.get('select'));
        this.$box.css({ width: bbox.width, height: bbox.height, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        this.$box.remove();
    }
});


