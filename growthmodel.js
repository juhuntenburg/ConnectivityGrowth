// model parameters
var w = $("#svg").attr("width");
var h = $("#svg").attr("height");
var o = {"x":w/2, "y":h/2}; //origin of the model
var ecc = 0.8; // eccentricity of ellipse, 0 is a circle
var rad_minor = 100; // initial minor radius of the model
var rad_major = Math.sqrt(Math.pow(rad_minor,2)/(1-Math.pow(ecc,2))) // major radius from minor radius and eccentricity
var dotrad = 2; // radius of the dots

var delta = 0.0001; // by which the initial surface will be parameterized
var ndot = 20; //number of initial dots
var g = 0.01 // growth rate

// other global variables
var surf = {'v':[], 'e':[]};
var dot = [];

// set default values for input
$("#growth").val(g);
$("#nodes").val(ndot);
$("#ecc").val(ecc);

// function to initiate the finite element surface
function initSurf() {
    var i, j, p, e;
    var n = delta*2*Math.PI // cut radians pieces
    // construct 1/delta points on the ellipse
    for (i=0; i<1/delta; i++) {
        var p = {'x':o.x+rad_major*Math.cos(i*n),
                 'y':o.y+rad_minor*Math.sin(i*n)};
        // add resting length of the radial element of each point
        p.rad0 = lenvec(subvec(p,o))
        p.rad = p.rad0;
        surf.v.push(p)
    };
    // construct edges between neighbouring points
    for (j=0; j<surf.v.length; j++) {
        if (j<surf.v.length-1)
            e = {"a":j, "b":j+1}
        else if (j=surf.v.length-1)
            e = {"a":j, "b":0}
        // add resting length of edge
        e.len0 = lenvec(subvec(surf.v[e.a], surf.v[e.b]));
        e.len = e.len0;

        surf.e.push(e);
        var line=makeSVG('line', {id:"e"+j, x1:surf.v[e.a].x, y1:surf.v[e.a].y, x2:surf.v[e.b].x, y2:surf.v[e.b].y, stroke:"grey"});
        $("#svg")[0].appendChild(line)
    };
    return surf;
};

// function to calculate the length of the surface between two points
// only in 2D, in 3D will require shortest path /geodist algorithm
function surfLen(start, stop) {
    var i;
    var start = start;
    var stop = stop;
    var len = 0;
    // fix if start and stop are the same (length of whole surface)
    if (start == stop) {
        stop = surf.v.length;
    };
    // add length of edges together
    for (i=start; i<stop; i++){
        len += surf.e[i].len;
    };
    return len;
}

// function to initiate dots
// only in 2D
function initDot() {
    var peri = surfLen(0,0);
    var spacing = peri / ndot;
    dot.push(surf.v[0]);
    var count = 0;
    while (dot.length < ndot) {
        // walk along surface and make dot when length > equal spacing
        var diff = 0;
        var len = 0;
        while (len < spacing) {
            diff = spacing - len;
            count += 1
            console.log(count)
            len += surf.e[count].len;
        };
        // correct potential overshoot
        new_diff = len - spacing;
        if (new_diff > diff) {
            count -= 1
        };
        // push every new dot
        dot.push(surf.v[count]);
    };
    // draw dots
    for (i=0; i<dot.length; i++) {
        var circle=makeSVG('circle', {id:"dot"+count, cx:dot[i].x, cy:dot[i].y, r:dotrad, fill:"grey", stroke:"grey"});
        $("#svg")[0].appendChild(circle);
    };
    return dot;
};


// function to animate growth
function animate() {
    // update radius
    rad_major=lenvec(subvec(P[E[0].a],o));
    rad_minor=rad_major/skew

    // break loop if flag is true or radius exceeds threshold
    if (rad_major>stoprad*rad || stopanimate==true) {
        return P;
    } else {
        requestAnimationFrame(animate);
        var i;
        for (i=0; i<E.length; i++) {
            delta=0.01
            // inserting new points if required
            // calculating edge length
            if (rad_minor==rad_major){
                var l = lenvec(subvec(P[E[i].a], P[E[i].b]));
            } else if (rad_minor < rad_major){
                p0 = {'x':P[E[i].a].x, 'y':P[E[i].a].y}
                if (P[E[i].b].t > 0) {var stopRad=P[E[i].b].t
                } else {var stopRad=2*Math.PI};
                var l = arcFromRad(p0=p0, delta=delta, stopRad=stopRad, startRad=P[E[i].a].t)
            };
            if (l>=2*r) {
                if (rad_minor == rad_major) {
                    // vector between neighbouring points
                    var newp=addvec(subvec(P[E[i].a],o), subvec(P[E[i].b],o));
                    // calculating length of new vector
                    var len_newp=lenvec(newp);
                    // divide by length to get only direction
                    newp=mulvec(newp, 1/len_newp);
                    // multiply by current radius
                    newp=mulvec(newp,rad_major);
                    newp=addvec(newp,o); // add origin
                } else if (rad_minor < rad_major){
                    var newp0 = {'x':P[E[i].a].x, 'y':P[E[i].a].y}
                    delta=0.0001
                    newP = equalPoints(p0=newp0, stopArc=l, ndot=2, delta=delta, startRad=P[E[i].a].t);
                    var newp=newP[1];
                };
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
            };
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
};

var stopanimate=true;

// update values from input if applicable and animate upon set
$("#start").click(function(){
    g = parseFloat($("#growth").val());
    ndot = parseFloat($("#nodes").val());
    ecc = parseFloat($("#ecc").val());
    $("#svg").empty();
    rad_major = Math.sqrt(Math.pow(rad_minor,2)/(1-Math.pow(ecc,2)));
    surf = {'v':[], 'e':[]};
    surf = initSurf();
    dot = [];
    dot = initDot();
/*  stopanimate=false;
    animate();
	$("#music")[0].play();*/
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
