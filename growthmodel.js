// model parameters
var w = $("#svg").attr("width");
var h = $("#svg").attr("height");
var o = {"x":w/2, "y":h/2}; //origin of the model
// adapt to throw error when input is not 0<=ecc<1
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
/*function animate() {
    requestAnimationFrame(animate);
    var i;
    for (i=0; i<surf.v.length; i++) {
        var p1, p2, e, e_len, m, f;
        // find point i and its following neighbour on the surface
        p1 = {'x':surf.v[i].x, 'y':surf.v[i].y};
        if (i=surf.v.length-1) {
            p2 = {'x':surf.v[0].x, 'y':surf.v[0].y};
        } else {p2 = {'x':surf.v[i].x, 'y':surf.v[i].y}};
        // find edge as directional vector from p1 to p2
        e = subvec(p2, p1);
        // length of this vector, resting spring
        e_len = lenvec(e);
        // make e direction only
        e = mulvec(e, (1/e_len);
        // midpoint between p1 and p2
        m = addvec(p1, mulvec(e, (1/2*e_len)));
        // force due to growth
        f = mulvec(e, (e_len/2*(1+g)));
        // new point p1 and p2
        p1 = addvec(m, f);
        p2 = subvec(m, f);

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

};
*/
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

$("#cont").click(function(){
    g=parseFloat($("#growth").val());
    ndot=parseFloat($("#nodes").val());
    animate();
	//$("#music")[0].play();
});
