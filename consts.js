
// this file contains the constants of the simulation

// all the distances are multiplied by this scale, in order to make the simulation not run too fast.
module.exports.WORLD_SCALE = 260;

// To obtain the radius of a rendered particle, we multiply its radius by this constant.
// so we can use this constant to make particles appear larger than they are in the simulation.
module.exports.renderMult = 1.0;


// this is the min and max points of the simulation world.
module.exports.WORLD_MIN = [-0.6, -0.6];
module.exports.WORLD_MAX = [+0.6, +0.9];

// however, we scale the entire simulation world by WORLD_SCALE, in order to make
// sure that it doesn't run too fast.
var WORLD_MIN = module.exports.WORLD_MIN;
var WORLD_MAX = module.exports.WORLD_MAX;
var WORLD_SCALE = module.exports.WORLD_SCALE;

module.exports.SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
module.exports.SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

module.exports.particleRadius = 0.015 * WORLD_SCALE;
module.exports.h = module.exports.particleRadius; // support radius
