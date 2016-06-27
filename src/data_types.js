/**
 * Created by eric on 22/06/16.
 */


var vec2 = require('gl-vec2');
var clamp = require('clamp');


var consts = require("./consts.js");
var WORLD_SCALE = consts.WORLD_SCALE;

function Capsule(p0, p1, radius, color) {

    this.p0 = vec2.fromValues(p0[0] * WORLD_SCALE, p0[1] * WORLD_SCALE);
    this.p1 = vec2.fromValues(p1[0] * WORLD_SCALE, p1[1] * WORLD_SCALE);

    this.radius = radius * WORLD_SCALE;
    this.color = color;
}

// evaluate the implicit function of the capsule on the point x.
// return positive number if x is outside the capsule
// return negative number if x is inside the capsule
// return zero if x is exactly on the border.
var capsuleImplicit = function (capsule, x) {
    var scratch = [0.0, 0.0];
    var p0 = capsule.p0;
    var p1 = capsule.p1;
    var r = capsule.radius;

    var p1_sub_p0 = [0.0, 0.0];
    vec2.subtract(p1_sub_p0, p1, p0);

    var t = -vec2.dot(vec2.subtract(scratch, p0, x), p1_sub_p0) / vec2.dot(p1_sub_p0, p1_sub_p0);
    t = clamp(t, 0.0, 1.0);

    var q = [0.0, 0.0];
    vec2.scaleAndAdd(q, p0, p1_sub_p0, t);

    var Fx = vec2.length(vec2.subtract(scratch, q, x)) - r;
    return Fx;
};


/*

 If, for instance, frequency=0.1, that means we emit every 100th millisecond. So ten times per second.
 */
function Emitter(position, frequency) {
    this.position = position;
    this.frequency = {val: 20.0};
    this.timer = 0.0;
    this.radius = 0.015;
    this.color = [0.0, 0.0, 1.0];


    this.baseAngle = {val: 70};
    this.angleVelocity = {val: 0};
    this.angle = {val: 0};


    this.strength = {val: 6};
    this.velRand = {val: 2};
};


// evaluate the implicit function of the emitter(the circle representing the emitter) on the point x.
// return positive number if x is outside the emitter
// return negative number if x is inside the emitter
// return zero if x is exactly on the border.
var emitterImplicit = function (emitter, x) {

    var o = emitter.position;
    var r = emitter.radius;

    var o_minus_x = [0.0, 0.0];
    vec2.subtract(o_minus_x, o, x);

    return vec2.length(o_minus_x) - r;
}

module.exports.Capsule = Capsule;
module.exports.Emitter = Emitter;
module.exports.emitterImplicit = emitterImplicit;
module.exports.capsuleImplicit = capsuleImplicit;





