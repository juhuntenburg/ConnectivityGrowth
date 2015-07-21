// parameters
var P=[]; // list of dots
var E=[]; // list of edges
var w=$("#svg").attr("width");
var h=$("#svg").attr("height");
var rad=10; // initial minor radius of the model
var skew=2 // skewness in x direction
var rad_minor=rad;
var rad_major=skew*rad
var dotrad=3; // radius of the dots
var ndot=6; //number of initial dots
var o={"x":w/2, "y":h/2}; //origin
var g=0.01; //growth
var prob=0.01; //probability of connection to form
var stoprad=30 // to multiply by rad for stopping point
var dist=4 // max distance of connections to form
var nclust=3; // number of cluster for k-means in vis
var G=[];

// set default values for input
$("#growth").val(g);
$("#nodes").val(ndot);
$("#prob").val(prob);
$("#dist").val(dist);
$("#skew").val(skew);
$("#nclust").val(nclust);

// function to add elements to SVG
function makeSVG(tag, attrs) {
    var el=document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
};

//function to subtract two vectors
function subvec(a,b) {
    return {"x":a.x-b.x, "y":a.y-b.y}
}

//function calculate length of vector
function lenvec(a) {
    return Math.sqrt(Math.pow(a.x, 2)+Math.pow(a.y, 2))
}

//function to multiply vector a with constant k
function mulvec(a, k) {
    return {"x":a.x*k, "y":a.y*k};
}

//function to multiply vector a with constant k
function addvec(a, b) {
    return {"x":a.x+b.x, "y":a.y+b.y};
}

// function to approximate the arc length of an ellipse over a given radians
function arcFromRad(p0, delta, stopRad) {
    var arc = 0;
    var p = {};
    var t = 0;
    for(t=0;t<=stopRad;t+=delta) {
        var p = {x:o.x+rad_major*Math.cos(t),y:o.y+rad_minor*Math.sin(t)};
        arc += lenvec(subvec(p,p0));
        p0.x = p.x;
        p0.y = p.y;
    };
    return arc
};

// function to produce evenly spaced dots on a given arc of an ellipse
function equalPoints(p0, stopArc, ndot, delta) {
    var P = [];
    var arc = 0;
    var t = 0;
    var p = {'x':p0.x, 'y':p0.y}
    for (i=0; i<ndot; i++) {
        var arcGoal = i*stopArc/ndot;
        while (arc < arcGoal){
            // update p0 to current point
            p0.x=p.x;
            p0.y=p.y;
            // increase angle
            t += delta;
            // calculate new point on ellipse from this angle
            p = {'x':o.x+rad_major*Math.cos(t),
                'y':o.y+rad_minor*Math.sin(t)}
            // update arc
            arc += lenvec(subvec(p,p0));
        };
        p.n=[];
        P.push(p);
        dot=makeSVG('circle', {id:"p"+i, cx:p.x, cy:p.y, r:dotrad, fill:"grey", stroke:"grey"});
        $("#svg")[0].appendChild(dot);
    };
    return P
};

// function to initiate dots for circular model
function initdot_circle() {
    // initiate dots
    for (i=0; i<ndot; i++) {
        var p={}; // single dot
        // divide surface in equal pieces depending on number of dots
        p.x=o.x+rad_minor*Math.cos(i/ndot*2*Math.PI);
        p.y=o.y+rad_minor*Math.sin(i/ndot*2*Math.PI);
        p.n=[];
        P.push(p);
        dot=makeSVG('circle', {id:"p"+i, cx:p.x, cy:p.y, r:dotrad, fill:"grey", stroke:"grey"});
        $("#svg")[0].appendChild(dot);
    };
    return P
};

// function to initiate dots for ellipsoid model
function initdot_ellipse() {
    // approximate perimeter
    var delta = 0.00001
    var p0 = {'x':o.x+rad_major, 'y':o.y+0};
    var peri = arcFromRad(p0=p0, delta=delta, stopRad=2*Math.PI);
    // approximate positions of points and draw them
    p0 = {'x':o.x+rad_major, 'y':o.y+0};
    P = equalPoints(p0=p0, stopArc=peri, ndot=ndot, delta=delta);
    return P
};

// metafunction to select which to use
function initdot() {
    if (rad_major==rad_minor) {
        P=initdot_circle();
    } else if (rad_major>=rad_minor) {
        P=initdot_ellipse();
    };
    return P
};

// function to initiate edges
function initedge(P) {
    // initiate edges
    for (i=0; i<P.length; i++) {
        var e={};
        if (i<ndot-1)
            e={"a":i, "b":i+1}
        else if (i=ndot-1)
            e={"a":i, "b":0}
        E.push(e);
        line=makeSVG('line', {id:"e"+i, x1:P[e.a].x, y1:P[e.a].y, x2:P[e.b].x, y2:P[e.b].y, stroke:"grey"});
        $("#svg")[0].appendChild(line)
    };
    return E
};

// function to get resting edge length
function rest(P,E) {
    //this only works if all dots are equally spaced
     var r = lenvec(subvec(P[E[0].a], P[E[0].b]));
     return r;
 };


 // functions to calculate network measures:
 // see: http://nbviewer.ipython.org/github/deep-introspection/My-Random-Notebooks/blob/master/Growing%20networks.ipynb
 function graphMetrics(P) {
     G = new jsnx.Graph();
     for (i=0; i<P.length; i++) {
         G.addNodesFrom([i])
         for (j=0; j<P[i].n.length; j++) {
             G.addEdgesFrom([[i,P[i].n[j]]])
         }
     }
     // To draw:
     // jsnx.draw(G, {element: '#svg',  });
     // jsnx.shortestPathLength(i)._numberValues[i]._numberValues)
     return G;
 }

function globalefficiency(G) {
    var inv_lengths = [];
    for (node=0; node<G.numberOfNodes(); node++) {
        lengths = jsnx.singleSourceShortestPathLength(G,node)._numberValues;
        //lengths = lengths[0];
        inv = $.map(lengths,function(i) {return 1/i});
        inv_lengths = $.extend(inv_lengths, inv);
    }
    var total = 0;
    $.map(inv_lengths, function(ind){
        if (ind!=Infinity) {total = total + ind;}
    });
    return total/(G.numberOfNodes()*(G.numberOfNodes()-1));
}
function localefficiency(G) {
    var efficiencies = [];
    for (node=0; node<G.numberOfNodes(); node++) {
        var temp_G = new jsnx.Graph();
        temp_G.addNodesFrom(G.neighbors(node));
        for (nei=0; nei<temp_G.numberOfNodes(); nei++) {
            temp_G.addEdgesFrom(G.edges(nei));
        }
        efficiencies[node] = globalefficiency(temp_G);
    }
    return efficiencies
}
function avglocalefficiency(Gx) {
    eff = localefficiency(Gx)
    var total = 0;
    $.map(eff, function(ind){
        if (ind!=Infinity) {total = total + ind;}
    });
    return total/Gx.numberOfNodes();
}

// function to animate growth
function animate() {

    // update radius
    rad_minor=rad_minor*(1+g);
    rad_major=rad_major*(1+g);
    //rad_minor=rad_minor*(1+(g/lenvec(pvec)));
    //rad_minor=rad_minor*(1+(g/lenvec(pvec)));
    //var new_rad = lenvec(subvec(P[E[0].a],o));

    // break loop if flag is true or radius exceeds threshold
    if (rad_major>stoprad*rad || stopanimate==true) {
        return P;
    } else {
        requestAnimationFrame(animate);
        for (i=0; i<E.length; i++) {
            // inserting new points if required
            var l = lenvec(subvec(P[E[i].a], P[E[i].b])); // calculating edge length
/*            if (l>=2*r) {
                var newp=addvec(subvec(P[E[i].a],o), subvec(P[E[i].b],o)); // vector between neighbouring points
                var len_newp=lenvec(newp); // calculating length of new vector
                newp=mulvec(newp, 1/len_newp); // divide by length to get only direction

                // calculate angle of new point via normalized vector
                theta_newp=Math.atan2(newp.y, newp.x)
                // calculate radius at the new point
                rad_newp=Math.sqrt(Math.pow((rad_major*Math.cos(theta_newp)),2)+Math.pow((rad_minor*Math.sin(theta_newp)),2))
                newp=mulvec(newp,rad_newp);  // multiply by radius at this angle
                //newp=mulvec(newp,new_rad);  // multiply by current radius

                newp=addvec(newp,o); // add origin
                newp.n=[]; // add empty neighbour lis
                P.push(newp); // new point is added to the end of the list
                E.push({"a":P.length-1, "b":E[i].b})// add new edge from newpoint to i+1
                E[i]={"a":E[i].a, "b":P.length-1} // updating edge from point i to newpoint (end of list)

                // add new dots
                dot=makeSVG('circle', {id:"p"+(P.length-1), cx:P[P.length-1].x, cy:P[P.length-1].y, r:dotrad, fill:"grey", stroke:"grey"});
                $("#svg")[0].appendChild(dot);

                // update first edge
                $("#e"+i).attr("x1", P[E[i].a].x);
                $("#e"+i).attr("y1", P[E[i].a].y);
                $("#e"+i).attr("x2", P[E[i].b].x);
                $("#e"+i).attr("y2", P[E[i].b].y);

                // add new edges
                line=makeSVG('line', {id:"e"+(E.length-1), x1:P[E[E.length-1].a].x, y1:P[E[E.length-1].a].y, x2:P[E[E.length-1].b].x, y2:P[E[E.length-1].b].y, stroke:"grey"});
                $("#svg")[0].appendChild(line);
            };*/
        };

        // grow, update dots
        for (i=0; i<P.length; i++) {
            var pvec=subvec(P[i], o); // vector from origin to point
            pvec=mulvec(pvec, 1+g); // make vector grow
            // pvec=mulvec(pvec, 1+(g/lenvec(pvec)));
            pvec=addvec(pvec, o); // add origin
            P[i].x=pvec.x // update point
            P[i].y=pvec.y
            $("#p"+i).attr("cx", P[i].x);
            $("#p"+i).attr("cy", P[i].y);
        };

        // update edges
        for (i=0; i<E.length; i++) {

            $("#e"+i).attr("x1", P[E[i].a].x);
            $("#e"+i).attr("y1", P[E[i].a].y);
            $("#e"+i).attr("x2", P[E[i].b].x);
            $("#e"+i).attr("y2", P[E[i].b].y);
        };
        // make new connections
        for (i=0; i<P.length; i++) {
            //compute distance to other dots
            for (j=0; j<P.length; j++) {
                // for each dot go through all dots that have a higher index and update connections
                // if there is no connection yet between the dots, draw one in case the distance is smaller than a threshold
                if (i<j) {
                    // for non-existing connections, calculate length
                    if ($.inArray(j, P[i].n)==-1) {
                        var connvec = subvec(P[j],P[i]);
                        var connlen = lenvec(connvec);
                        if (connlen <= dist*r) {
                            // roll a dice if connection will be drawn
                            dice=Math.random()
                            if (dice <= prob) {
                                P[i].n.push(j);
                                connection=makeSVG('line', {id:"c"+i+j, x1:P[i].x, y1:P[i].y, x2:P[j].x, y2:P[j].y, stroke:"red"});
                                $("#svg")[0].appendChild(connection);
                            }
                        };
                    // update existing connections
                    } else {
                        $("#c"+i+j).attr("x1", P[i].x);
                        $("#c"+i+j).attr("y1", P[i].y);
                        $("#c"+i+j).attr("x2", P[j].x);
                        $("#c"+i+j).attr("y2", P[j].y);
                    };
                };
            };
        };
    };
	G = graphMetrics(P)
};

var stopanimate=true;

// update values from input if applicable and animate upon set
$("#start").click(function(){
    g=parseFloat($("#growth").val());
    ndot=parseFloat($("#nodes").val());
    prob=parseFloat($("#prob").val());
    skew=parseFloat($("#skew").val());
    dist=parseFloat($("#dist").val());
    stopanimate=false;
    $("#svg").empty();
    P=[];
    E=[];
    G=[];
    rad_minor=rad;
    rad_major=rad*skew;
    P=initdot();
    E=initedge(P);
    r=rest(P,E);
    stopanimate=false;
    animate();
	//$("#music")[0].play();
})

$("#stop").click(function(){
    stopanimate=true;
	$("#music")[0].pause();
})

// double check if values rest, and rads don't need to be updated here
$("#cont").click(function(){
    g=parseFloat($("#growth").val());
    ndot=parseFloat($("#nodes").val());
    prob=parseFloat($("#prob").val());
    dist=parseFloat($("#dist").val());
    stopanimate=false;
    animate();
	//$("#music")[0].play();
});

$("#compute").click(function(){
    $("#stats").html("<p>avg clustering: "+jsnx.averageClustering(G).toFixed(4)+
    "<br>glob efficiency.:      "+globalefficiency(G).toFixed(4)+
    "<br>avg loc efficiency.: "+avglocalefficiency(G).toFixed(4)+"</p>")
});

$("#vis").click(function(){
    // Structure data for input to protovis
    G = graphMetrics(P);
    var labels = [];
    var vectors = [];
    for (var j = 0 ; j < G.numberOfNodes(); j++) {
        labels[j] = j;
        var vec = []
        for (k=0; k<P[j].n.length; k++) {
            vec.push(P[j].n[k]);
        }
        vectors[j] = Array.apply(null, new Array(G.numberOfNodes())).map(Number.prototype.valueOf,0);
        for (h=0; h<vec.length; h++) {
            vectors[j][[vec[h]]] = 1;
        }
    }
    nclust=parseFloat($("#nclust").val());
    var clust = figue.kmeans(nclust, vectors);
    var clustlabels = clust.assignments;
    var nodes = [];
    var links = [];
    for (i=0; i<G.nodes().length; i++) {
        nodes[i]={"nodeName":G.nodes()[i], "group":clustlabels[i]};
    };
    for (i=0; i<G.edges().length; i++) {
          links[i] = {"source":G.edges()[i][0], "target":G.edges()[i][1], "value":"1"};
    };
    var mis = {nodes, links};

    // http://mbostock.github.io/protovis/ex/matrix.html
    var colorsF = pv.Colors.category10();

    var visM = new pv.Panel()
        .canvas('matrix-div');
    var layoutM = visM.add(pv.Layout.Matrix)
        .nodes(mis.nodes)
        .links(mis.links)
        .sort(function(a, b) {b.group - a.group});
    layoutM.link.add(pv.Bar)
        .fillStyle(function(l) {return l.linkValue
        ? ((l.targetNode.group == l.sourceNode.group)
        ? colorsF(l.sourceNode):colorsF(l.sourceNode.group)):"#eee"})
        .antialias(false)
        .lineWidth(1);

    // Labels NOT properly added yet
    layoutM.label.add(pv.Label)
        .textStyle(colorsF.by(function(d) {d.group}));
    visM.render();
    // http://mbostock.github.io/protovis/ex/force.html
    var visF = new pv.Panel()
        .canvas('force-div')
        .width($("#force-div").attr("width"))
        .height($("#force-div").attr("height"))
        .fillStyle("white")
       .event("mousedown", pv.Behavior.pan())
       .event("mousewheel", pv.Behavior.zoom());
    var forceF = visF.add(pv.Layout.Force)
        .nodes(mis.nodes)
        .links(mis.links);

    forceF.link.add(pv.Line);
    forceF.node.add(pv.Dot)
        .size(20)
        .fillStyle(function(d){return colorsF(d.group)})
        .strokeStyle("#ddd") //function() this.fillStyle())
        .lineWidth(1)
        .antialias(false)
        //.title(function(d) {return d.nodeName})
        .event("mousedown", pv.Behavior.drag())
        .event("drag", forceF);

    visF.render();
    // Recolor main view nodes
    for (i=0; i<P.length; i++) {
            $("#p"+i).attr("fill",colorsF(clustlabels[i]).color);
            $("#p"+i).attr("stroke",colorsF(clustlabels[i]).color);
    };
});

$("#download").click(function(){
});
