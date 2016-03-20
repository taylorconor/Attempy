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


var grid = {

    //Block size contants
    outerPadding: 50,
    childPadding: 20,
    actionCorrection: 50,
    actionSize: {width: 260, height: 300},
    complexBlockSize: {width: 300, height: 300},
    fullBlockWidth: 400,
    actionHeight: 600,

    columnsFilled: 0,
    currentlyMoving: {},

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
                nameIn: 'Action Name',
                scriptIn: '',
                RequiresIn: '',
                ProvidesIn:'',
                AgentsIn:''
            });
        } else {
            var el = new joint.shapes.devs.Coupled({
                position: self.getPos(type, 1), 
                size: self.complexBlockSize,
                attrs: { text: { text: type } },
                columnWidth: 1,
                startColumn: self.columnsFilled
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
        } else {
            var pos = parent.get
            pos.y += this.actionCorrection;
            switch (parent) {
                case "branch":
                case "selection": {
                    pos.x += self.childPadding;
                    pos.y += self.childPadding  + (self.childPadding + self.actionHeight) * innerPos;
                } break;

                case "sequence":
                case "iteration": {
                    pos.x += self.childPadding + self.outerPadding + innerPos * self.fullBlockWidth;
                    pos.y += self.childPadding;
                } break;
                
                default: return undefined;
            }
        }

        return pos;
    },
    removeOuterElement: function(elPos, size) {
        this.columnsFilled -= size;
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
                parent.set('columnWidth', children.length);
                var pos = parentPos;
                pos.y += self.childPadding + innerPos * self.fullBlockWidth;
                pos.x += self.childPadding;
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
                pos.x += self.childPadding + innerPos * self.fullBlockWidth;
                pos.y += self.childPadding;
                child.model.set("position", pos);
            }

        }
    },
    removeChild: function(child, children, type, parent){},
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
        '<label id="lab1" class = "lab1"></label><br><span class ="name1"></span><br>', 
        '<input class="full nameAction" type="text" placeholder="Enter Action Name" ></input><br>',         
        '<input class="full scriptInput" id = "script" type="text" placeholder="Enter Script" /> ',
        //requires
        '<br>Requires:<br>',
        '<div class="fullReq">',
        '<div class="requires"><input class = "reqResIn" type="text" placeholder="Resource" />',
        '.<input type="text" class = "reqAttIn" placeholder="attribute" />',
        '<select class = "reqOpIn"><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select>',
        '<input type="text" class = "reqValIn" placeholder="Value" /></div>',
        '<button class=" reqAdd">add</button>',
        '<button class=" reqSub">Submit</button>',
        '</div>',
        // uncomment to see how data is sent to graph object
        // '<br><span class ="test"> </span><br>',
        //provides
        '<br>Provides:<br>',
        '<div class="provides"><input type="text" placeholder="Resource" />.',
        '<input type="text" class = "provResIn"  placeholder="attribute" />',
        '<select class="provOpIn"><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select>',
        '<input type="text" class = "provValIn"  placeholder="Value" /></div>',
        '<button class=" provAdd">add</button>',
        '<button class=" provSub">Submit</button>',
        //agents
        '<br>Agents:<br>',
        '<div class="agent"><input type="text" placeholder="Resource" />.',
        '<input type="text" placeholder="attribute" />',
        '<select><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option></select>',
        '<input type="text" class = ""  placeholder="Value" /></div>',
        '<button class=" ageAdd ">add</button>',
        '<button class=" ageSub">Submit</button>',
        // '<div class="tool"><input type="text" placeholder="Tool" />.<input type="text" placeholder="attribute" />=<input type="text" placeholder="Value" /></div>',
        // '<button class="toolAdd">add</button>',
        '</div>'
        // drop down for oporators 
    ].join(''),

    initialize: function() {
        _.bindAll(this, 'updateBox');
        // _.bindAll(this, 'addreq');
        joint.dia.ElementView.prototype.initialize.apply(this, arguments);

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
        // this.$box.find('.reqResIn,.reqAttIn,.reqOpIn,.reqValIn,.reqRelOp').on('change', _.bind(function(evt) {
        //     var values = "";
        //     $(evt.target).parent().children().each(function (){
        //         values += $(this).val() + ",";
        //     });
        //     this.model.set('RequiresIn', values); 
        // }, this));
        this.$box.find('select1').val(this.model.get('select'));
        this.$box.find('.delete').on('click', _.bind(this.model.remove, this.model));
        this.$box.find('.reqAdd').on('click', this.addreq);
        this.$box.find('.reqSub').on('click', _.bind(function(evt) {
            var values = "";
            $(evt.target).siblings('.requires').children().each(function (){
                values += $(this).val() + ",";
            });
            this.model.set('RequiresIn', values); 
        }, this));
        this.$box.find('.provSub').on('click', _.bind(function(evt) {
            var values = "";
            $(evt.target).siblings('.provides').children().each(function (){
                values += $(this).val() + ",";
            });
            this.model.set('ProvidesIn', values); 
        }, this));
        this.$box.find('.ageSub').on('click', _.bind(function(evt) {
            var values = "";
            $(evt.target).siblings('.agent').children().each(function (){
                values += $(this).val() + ",";
            });
            this.model.set('AgentsIn', values); 
        }, this));
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
        this.$box.find('label').text(this.model.get('label'));
        this.$box.find('.name1').text(this.model.get('nameIn'));
        // removed height: bbox.height to allow the div to resize to fit when things added
        this.$box.css({ width: bbox.width, left: bbox.x, top: bbox.y, transform: 'rotate(' + (this.model.get('angle') || 0) + 'deg)' });
    },
    removeBox: function(evt) {
        grid.removeElement(evt, this);
        this.$box.remove();
    }, 
    addreq: function(){
        jqueryEle = $(this);
        jqueryEle.siblings('.requires').append('<br><select class = "reqRelOp"><option>||</option><option>&&</option></select><br><input class = "reqResIn" type="text" placeholder="Resource" />.<input type="text" class = "reqAttIn" placeholder="attribute" /><select class = "reqOpIn"><option>=</option><option>!=</option><option><</option><option><=</option><option>></option><option>>=</option><input type="text" class = "reqValIn" placeholder="Value" />');
        
        // joint.dia.ElementView.prototype.addreq.apply(this, arguments);
        // var temp = this.previousElementSibling.$box;
        // this.previousElementSibling.$box.find('.reqResIn,.reqAttIn,.reqOpIn,.reqValIn,.reqRelOp').on('change', _.bind(function(evt) {
        //     var values = "";
        //     $(evt.target).parent().children().each(function (){
        //         values += $(this).val() + ",";
        //     });
        //     this.model.set('RequiresIn', values); 
        // }, this));
        
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

