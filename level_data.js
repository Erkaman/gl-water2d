/**
 * Created by eric on 24/06/16.
 */


var createEmitter = require("./data_types.js").Emitter;


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
    this.emitters.push(new createEmitter([-0.1, -0.15]));


}

module.exports = LevelData;