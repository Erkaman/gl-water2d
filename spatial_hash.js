/**
 * Created by eric on 02/06/16.
 */


var sieve = require('sieve');
var vec2 = require('gl-vec2');

var primeList = null;

function SpatialHash(h, min, max) {

    this.min = [min[0], min[1]];
    this.max = [max[0], max[1]];
    this.h = h;

    var xRem =  (this.max[0] - this.min[0]) / h - Math.floor((this.max[0] - this.min[0]) / h);
    xRem = h*(1.0 - xRem);
    var yRem =  (this.max[1] - this.min[1]) / h - Math.floor((this.max[1] - this.min[1]) / h);
    yRem = h*(1.0 - yRem);

    this.max[0] += xRem;
    this.max[1] += yRem;


    this.xSize = Math.round((this.max[0] - this.min[0]) / this.h );
    this.ySize = Math.round((this.max[1] - this.min[1]) / this.h );

    // initialize grid.
    this.grid = [];


    console.log("now min: ", this.min);
    console.log("now max: ", this.max);

    console.log("before min: ", min);
    console.log("before max: ", max);


    console.log("table size: ", this.xSize, this.ySize);
}


SpatialHash.prototype._toGridPos = function (position) {
    return [
        Math.floor((position[0] - this.min[0])/this.h ),
        Math.floor((position[1] - this.min[1])/this.h )
    ];

}

SpatialHash.prototype._toIndex = function (gridPos) {
    return gridPos[1] * this.xSize + gridPos[0];
}



SpatialHash.prototype.update = function (particles) {

    //console.log("DO UPDATE: ", this.xSize, this.ySize, this.xSize*this.ySize);

    // initialize grid.
    for(var i = 0; i < this.xSize*this.ySize; ++i) {
        this.grid[i] = [];
     //   console.log("rgrid length: ",  this.grid[i].length );
    }


    for(var iParticle = 0; iParticle < particles.length; ++iParticle) {
        var particle = particles[iParticle];

        var gridPos = this._toGridPos( particle.position );

        if(gridPos[0] < 0 || gridPos[1] < 0 || gridPos[0] >= this.xSize || gridPos[1] >= this.ySize)
            console.log("OUTSIDE grid: ", gridPos);;

        var a = this._toIndex(gridPos);

        if(a < 0 || a>= this.xSize*this.ySize)
            console.log("OUTSIDE index: ", a);

     //   console.log("a: ", a);
        // TODO: should put index integer here, for better performance


/*
        if(typeof this.grid[this._toIndex(gridPos)] === "undefined" ) {
            console.log("UNDEFINED");
            console.log("grid: ", gridPos);
            console.log("index: ", this._toIndex(gridPos) );
            console.log("posit: ", particle.position );
            console.log("iParticle: ", iParticle);
            console.log(" particles.length: ",  particles.length);


        }
        */

        this.grid[this._toIndex(gridPos)].push(particle);
       // console.log("index: ", this._toIndex(gridPos),  (gridPos) );

    }

    //console.log("updated grid ", this.grid);


};

/*
// get particles that are within the support radius of the particle.
SpatialHash.prototype.getNearParticles2 = function (particle) {


    var scratch = [0.0, 0.0];

    var nearParticles = [];
    for(var x = 0; x < this.xSize; ++x) {
        for (var y = 0; y < this.ySize; ++y) {

            var cellParticles = this.grid[this._toIndex([x, y])];


            for(var i = 0; i < cellParticles.length; ++i) {
                var p = cellParticles[i];

                var d = vec2.length(  vec2.subtract(scratch, particle.position,p.position )  );
                if(d < this.h) {
                    //     console.log("add ", p.position);
                    nearParticles.push(p);
                } else {
                    //     console.log("skip ", p.position);
                }

            }


        }
    }

    return nearParticles;


}
*/

// get particles that are within the support radius of the particle.
SpatialHash.prototype.getNearParticles = function (particle) {
    // find bounding box that contains the support radius.
    var bbMin = this._toGridPos([ particle.position[0] - this.h, particle.position[1] - this.h ]);
    var bbMax = this._toGridPos([ particle.position[0] + this.h, particle.position[1] + this.h ]);

    var xMin = bbMin[0];
    var yMin = bbMin[1];
    var xMax = bbMax[0];
    var yMax = bbMax[1];


    var nearParticles = [];

    var scratch = [0.0, 0.0];
    var total = 0;
    for(var x = xMin; x <= xMax; ++x) {
        for(var y = yMin; y <= yMax; ++y) {

            if(x < 0 || y < 0 || x >= this.xSize || y >= this.ySize)
                continue;

            var cellParticles = this.grid[this._toIndex([x,y])];

            for(var i = 0; i < cellParticles.length; ++i) {
                var p = cellParticles[i];

                var d = vec2.length(  vec2.subtract(scratch, particle.position,p.position )  );
                if(d < this.h) {
               //     console.log("add ", p.position);
                    nearParticles.push(p);
                } else {
               //     console.log("skip ", p.position);
                }

            }

            total += cellParticles.length;

          //  console.log("look in cell: ", x,y, cellParticles );
        }
    }

   // console.log(nearParticles.length,"/",total);

    return nearParticles;
}

// returns the first prime number that is larger than n.
function nextPrime(n) {

    for(var i = 0; i < primeList.length; ++i) {
        var prime = primeList[i];
        if(prime > n)
            return prime;
    }

    console.log("could not find next prime: ", n);
    
    // if we could not find it, just return this. Better than nothing, at least. 
    return 2*n;
}


module.exports = SpatialHash;