/**
 * Created by eric on 24/06/16.
 */


var createEmitter = require("./data_types.js").Emitter;
var createCapsule = require("./data_types.js").Capsule;

var consts = require("./consts.js");

var WORLD_MIN = consts.WORLD_MIN;
var WORLD_MAX = consts.WORLD_MAX;

var SCALED_WORLD_MIN = consts.SCALED_WORLD_MIN;
var SCALED_WORLD_MAX = consts.SCALED_WORLD_MAX;

var WORLD_SCALE = consts.WORLD_SCALE;


function LevelData() {

    // how much of its original velocity that a particle gets to keep when it bounces against a capsule.
    this.collisionDamping = {val: 1.0 / 5.0};

    this.sigma = {val: 0.9};
    this.beta =  {val: 0.3};
    this.capsuleColor = [0, 0.5, 0];

    this.gravity = {val: +0.03}; // gravity force.

    // see the paper for definitions of these.
    this.restDensity = {val: 10.0};
    this.stiffness = {val: 0.009};
    this.nearStiffness = {val: 1.2};

    this.emitters = [];
    this.collisionBodies = [];

    // below, we create the default level. 
    
    const CAPSULE_RADIUS = 0.03;
    const FRAME_RADIUS = 0.06;
    const CAPSULE_COLOR = this.capsuleColor;
    this.collisionBodies.push(new createCapsule(WORLD_MIN, [WORLD_MAX[0], WORLD_MIN[1]], FRAME_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule([WORLD_MIN[0] * 0.6, WORLD_MAX[1]], [WORLD_MAX[0], WORLD_MAX[1]], FRAME_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule(WORLD_MIN, [WORLD_MIN[0], WORLD_MAX[1]], FRAME_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule([WORLD_MAX[0], WORLD_MIN[1]], WORLD_MAX, FRAME_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule([0.1, 0.8], [0.3, 0.5], CAPSULE_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule([0.6, 0.0], [0.3, 0.3], CAPSULE_RADIUS, CAPSULE_COLOR));
    this.collisionBodies.push(new createCapsule([-0.5, -0.3], [0.2, 0.4], CAPSULE_RADIUS, CAPSULE_COLOR));

    this.emitters.push(new createEmitter([-0.1, -0.15]));
}

module.exports = LevelData;