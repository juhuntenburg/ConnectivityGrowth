// functions to calculate network measures:
// see: http://nbviewer.ipython.org/github/deep-introspection/My-Random-Notebooks/blob/master/Growing%20networks.ipynb
function graphMetrics(P) {
    G = new jsnx.Graph();
    for (i=0; i<P.length; i++) {
        G.addNodesFrom([i])
        var j;
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
