
var vec2 = require('gl-vec2');

/*
This class implements spatial hashing.
In the simulation, every particle needs to know which particles are within the support radius h.
This data-structure speeds up getting those neighbours. 
 */

function SpatialHash(h, min, max) {

    this.min = [min[0], min[1]];
    this.max = [max[0], max[1]];
    this.h = h;

    // x-size and y-size of a single grid-cell.
    this.xSize = Math.round((this.max[0] - this.min[0]) / this.h );
    this.ySize = Math.round((this.max[1] - this.min[1]) / this.h );

    // initialize grid.
    this.grid = [];
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

    // initialize grid.
    for(var i = 0; i < this.xSize*this.ySize; ++i) {
        this.grid[i] = [];
    }

    // iterate over all particles, and add the particles to their corresponding grid cell.
    for(var iParticle = 0; iParticle < particles.length; ++iParticle) {
        var particle = particles[iParticle];

        var gridPos = this._toGridPos( particle.position );
        this.grid[this._toIndex(gridPos)].push(particle);
    }
};

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

    // we iterate over all grid cells that are near the particle, and from the grid cells
    // we add the particles that are near enough.
    for(var x = xMin; x <= xMax; ++x) {
        for(var y = yMin; y <= yMax; ++y) {

            // make sure we are not outside the world
            if(x < 0 || y < 0 || x >= this.xSize || y >= this.ySize)
                continue;

            var cellParticles = this.grid[this._toIndex([x,y])];

            for(var i = 0; i < cellParticles.length; ++i) {
                var p = cellParticles[i];

                var d = vec2.length(  vec2.subtract(scratch, particle.position,p.position )  );
                if(d < this.h) { // if within support radius, add
                    nearParticles.push(p);
                }
            }
        }
    }

    return nearParticles;
}



module.exports = SpatialHash;