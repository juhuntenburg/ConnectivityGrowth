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
