var width = $("#diagram").width(),
    height = $("#diagram").height();

var color = d3.scale.category20();

var cola = cola.d3adaptor()
    .linkDistance(120)
    .avoidOverlaps(true)
    .size([width, height]);

var svg = d3.select("#diagram").append("svg")
    .attr("width", width)
    .attr("height", height);



svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 6 + 3) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 60)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .style("fill", "white")
    .append("path")
        .attr("d", "M 0,0 V 4 L2,2 Z"); //this is actual shape for arrowhead

//
function isEqualGraphs(gr1, gr2){
    if(!gr1.nodes ||
        !gr1.links ||
        !gr2.nodes ||
        !gr2.links) return false;
    if(gr1.nodes.length !== gr2.nodes.length) return false;
    if(gr1.links.length !== gr2.links.length) return false;

    for (var i = gr1.nodes.length - 1; i >= 0; i--) {
        if ((gr1.nodes[i].name !== gr2.nodes[i].name) ||
             (gr1.nodes[i].type !== gr2.nodes[i].type) ||
             (gr1.nodes[i].width !== gr2.nodes[i].width) ||
             (gr1.nodes[i].height !== gr2.nodes[i].height) ||
             (gr1.nodes[i].rotate !== gr2.nodes[i].rotate) ||
             (gr1.nodes[i].color !== gr2.nodes[i].color)) return false;
    }

    for (var i = gr1.links.length - 1; i >= 0; i--) {
        if ((gr1.links[i].source.index !== gr2.links[i].source) ||
             (gr1.links[i].target.index !== gr2.links[i].target) ||
             (gr1.links[i].linkNum !== gr2.links[i].linkNum) ||
             (gr1.links[i].dotted !== gr2.links[i].dotted)) return false;
    }
    
    return true;
}

var oldGraph = [];
var link;
var node;
var label;
function updateData(error, graph){
    if(isEqualGraphs(oldGraph, graph)){
        return;
    }
    oldGraph = graph;
    cola.stop();
    init(error, graph);


}
function init(error, graph) {
    if(isEqualGraphs(oldGraph, graph)){
        return;
    }
    oldGraph = graph;


    svg.selectAll("line").remove();
    svg.selectAll("rect").remove();
    svg.selectAll("text").remove();
    link = svg.selectAll(".link")
        .data(graph.links); 

    link.enter().append("line")
        .attr("class", "link")
        .style("stroke-dasharray", function(d) {
            return d.dotted ? ("3,3"):("0,0");
        })
        .attr("marker-end", "url(#arrowhead)");
    link.exit().remove();

    node = svg.selectAll(".node")
        .data(graph.nodes);
      

    node.enter().append("rect")
        .attr("class", function(d) {return d.type; })
        .attr("width", function (d) { return d.width; })
        .attr("height", function (d) { return d.height; })
        .attr("rx", 5).attr("ry", 5)
        .style("fill", function (d) { return d.color; })
        .call(cola.drag);
    label = svg.selectAll(".label")
        .data(graph.nodes);

   label.enter().append("text")
        .attr("class", "label")
        .text(function (d) { return d.name; })
        .call(cola.drag);

    label.exit().remove();

    node.append("title")
        .text(function (d) { return d.name; });

    node.exit().remove();

    cola.on("tick", function () {
        link.attr("x1", function (d) { 
                switch(d.linkNum){
                    case 0:
                        return d.source.x;
                    case 1:
                        return d.source.x + d.source.width;
                    case 2:
                        return d.source.x + d.source.width/2;
                    case 3  :
                        return d.source.x + d.source.width/2;

                }
                return d.source.x; 
            })
            .attr("y1", function (d) { 
                switch(d.linkNum){
                    case 2:
                        return d.source.y - d.source.height/2;
                    case 3  :
                        return d.source.y + d.source.height/2;

                }
                return d.source.y; 
            })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; });

        node.attr("x", function (d) { return d.x - d.width / 2; })
            .attr("y", function (d) { return d.y - d.height / 2; })
            .attr("transform", function (d) { 
                if(d.rotate > 0){
                    return 'rotate('+d.rotate+', '+ (d.x + d.height/(90/d.rotate)) + ','+ (d.y + d.width/(90/d.rotate))+')'; 
                }
                else{
                    return "rotate(0)";
                }
            })
            .attr("id", function (d, i) {
                return i;
            });

        label.attr("x", function (d) { return d.x; })
             .attr("y", function (d) {
                 var h = this.getBBox().height;
                 return d.y + h/4;
             })
             .attr("transform", function (d) { 
                if(d.rotate > 0){
                    return 'translate('+(d.width/(90/d.rotate)) + ','+ (-d.height/(90*2/d.rotate))+')'; 
                }
                else{
                    return "rotate(0)";
                }
            });
    });


    cola
        .linkDistance(120)
        .avoidOverlaps(true)
        .size([width, height])
        .nodes(graph.nodes)
        .links(graph.links)
        .start();
    initMenu();
}

setInterval(function() {
        getData(false);
    }, 2500);
