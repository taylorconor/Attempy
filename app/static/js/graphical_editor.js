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
        case "agent": {
            return new joint.shapes.devs.Atomic({
                position: { x: 50, y: 260 },
                attrs: { text: { text: type } }
            });
        } break;
        case "script": {
            return new joint.shapes.devs.Atomic({
                position: { x: 50, y: 260 },
                attrs: { text: { text: type } }
            });
        } break;
        case "provides": {
            return new joint.shapes.devs.Atomic({
                position: { x: 50, y: 260 },
                attrs: { text: { text: type } }
            });
        } break;
        case "requires": {
            return new joint.shapes.devs.Atomic({
                position: { x: 50, y: 260 },
                attrs: { text: { text: type } }
            });
        } break;
        case "tool": {
            return new joint.shapes.devs.Atomic({
                position: { x: 50, y: 260 },
                attrs: { text: { text: type } }
            });
        } break;
        case "action": {
            return new joint.shapes.devs.Coupled({
                position: { x: 230, y: 150 },
                size: { width: 150, height: 150 },
                inPorts: ['in'],
                outPorts: ['out'],
                attrs: { text: { text: type } }
            });
        }
    }
}

