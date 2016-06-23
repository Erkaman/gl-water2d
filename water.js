/*
 Require dependencies
 */
var vec3 = require('gl-vec3');
var vec2 = require('gl-vec2');
var clamp = require('clamp');
var dt = require("./data_types.js");

var SpatialHash = require("./spatial_hash.js");
var createRenderer = require("./renderer.js");

/*
 function Circle(position, radius, color) {
 this.position = vec2.fromValues(position[0] * WORLD_SCALE, position[1] * WORLD_SCALE);
 this.radius = radius * WORLD_SCALE;
 this.color = color;
 }*/

function Capsule(p0, p1, radius, color) {

    this.p0 = vec2.fromValues(p0[0] * WORLD_SCALE, p0[1] * WORLD_SCALE);
    this.p1 = vec2.fromValues(p1[0] * WORLD_SCALE, p1[1] * WORLD_SCALE);

    this.radius = radius * WORLD_SCALE;
    this.color = color;
}

function Particle(position, velocity, color) {

    this.position = vec2.fromValues(position[0] * WORLD_SCALE, position[1] * WORLD_SCALE);

    this.velocity = vec2.fromValues(velocity[0] * WORLD_SCALE, velocity[1] * WORLD_SCALE);

    // console.log("add part: ", this.position );
    this.color = color;

    this.radius = particleRadius;

    this.o = [this.position[0], this.position[1]];
    this.f = [0.0, 0.0];
    this.isNew = true;
}

// evaluate the implicit function of the capsule on the coordinate x.
// return positive number if x is outside the capsule
// return negative number if x is inside the capsule
// return zero if x is exactly on the border.
Capsule.prototype.eval = function (x) {
    var scratch = [0.0, 0.0];
    var p0 = this.p0;
    var p1 = this.p1;
    var r = this.radius;

    var p1_sub_p0 = [0.0, 0.0];
    vec2.subtract(p1_sub_p0, p1, p0);

    var t = -vec2.dot(vec2.subtract(scratch, p0, x), p1_sub_p0) / vec2.dot(p1_sub_p0, p1_sub_p0);
    t = clamp(t, 0.0, 1.0);

    var q = [0.0, 0.0];
    vec2.scaleAndAdd(q, p0, p1_sub_p0, t);

    var Fx = vec2.length(vec2.subtract(scratch, q, x)) - r;
    return Fx;
}


/*
If, for instance, frequency=0.1, that means we emit every 100th millisecond. So ten times per second. 
 */
function Emitter(position, frequency) {
    this.position = position;
    this.frequency = {val: 0.05};
    this.timer = 0.0;
    this.radius =  0.015;
    this.color = [0.0, 0.0, 1.0];


    this.baseAngle = {val: 70};
    this.angleVelocity = {val: 0};
    this.angle = {val: 0};


    this.strength = {val: 0.006};
    this.velRand= {val: 2};

}

Emitter.prototype.eval = function(x) {

    var o = this.position;
    var r = this.radius;

    var o_minus_x= [0.0, 0.0];
    vec2.subtract(o_minus_x, o, x);

    return vec2.length(o_minus_x) - r;
}


var WORLD_MIN = [-0.6, -0.6];
var WORLD_MAX = [+0.6, +0.9];
var WORLD_SCALE = dt.WORLD_SCALE;

var SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
var SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

var particleRadius = 0.015 * WORLD_SCALE;

// support radius
var h = particleRadius;

const FRAME_RADIUS = 0.06;
const FRAME_COLOR = [0, 0.5, 0];
const CAPSULE_RADIUS = 0.03;


var gravity = +0.03; // gravity force.
var sigma = 0.9;
var beta = 0.3;

var wallDamp = 1.0 / 5.0;

const rho_0 = 10.0; // rest density
//const l = 0.08
//const k = 0.008*(1-l) + (0.08)*(l); // gas stiffness constant.
const k = 0.009;

// set to 0.8 for less splash.
const k_near = 1.2; // gas stiffness for near.
/*
 const kSurfaceTension = 0.0004;
 const kLinearViscocity = 0.5;
 const kQuadraticViscocity = 1.0;
 */


var cr = 0.0;



/*
 Constructor
 */
function Water(gl) {

    this.particles = [];


    var add = 0;

    this.renderer = new createRenderer(gl);

    this.newCapsule = null;

    this.collisionBodies = [];
    this.emitters = [];

    //this.collisionBodies.push(new Circle([0.0,0.2], 0.13, [0.7, 0.2, 0.2]));


    // frame
    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MAX[0], WORLD_MIN[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([WORLD_MIN[0] * 0.7, WORLD_MAX[1]], [WORLD_MAX[0], WORLD_MAX[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MIN[0], WORLD_MAX[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([WORLD_MAX[0], WORLD_MIN[1]], WORLD_MAX, FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([0.1, 0.8], [0.3, 0.5], CAPSULE_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([0.6, 0.0], [0.3, 0.3], CAPSULE_RADIUS, FRAME_COLOR));
    this.collisionBodies.push(new Capsule([-0.5, -0.3], [0.2, 0.4], CAPSULE_RADIUS, FRAME_COLOR));

    this.emitters.push(new Emitter([-0.1, -0.15]));


    // this.collisionBodies.push(new Circle(WORLD_MIN, FRAME_RADIUS, [0.7, 0.0, 0.0]));
    //   this.collisionBodies.push(new Circle(WORLD_MAX, FRAME_RADIUS, [0.7, 0.0, 0.0]));

    this.hash = new SpatialHash(h, SCALED_WORLD_MIN, SCALED_WORLD_MAX);
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


var timeCount = 0;

Water.prototype.update = function (canvasWidth, canvasHeight, mousePos, delta) {
    
    if(this.newCapsule != null) {
        this.newCapsule.p1 = this.mapMousePos(mousePos);

       // console.log("new: ", this.newCapsule.p0, this.newCapsule.p1 );
    }


    this.renderer.update(canvasWidth, canvasHeight);

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    for (var i = 0; i < this.emitters.length; ++i) {
        var emitter = this.emitters[i];

        emitter.timer += delta;

       // console.log("timer: ",  emitter.timer, emitter.frequency );

        if(emitter.timer > emitter.frequency.val && this.particles.length < 1500) {



            var c = [emitter.color[0], emitter.color[1], emitter.color[2]];

            if(emitter.angleVelocity.val == 0) {
                emitter.angle.val = emitter.baseAngle.val;
            } else {
                emitter.angle.val += emitter.angleVelocity.val;
            }



            var theta = emitter.angle.val * (Math.PI / 180.0);
            theta = Math.PI * 2 - theta;

            emitter.angle.val += emitter.angleVelocity.val;

            const strength = emitter.strength.val;
            const velocity = [strength * Math.cos(theta), strength * Math.sin(theta)];

            const v = [-velocity[1], velocity[0]];

            var c = [emitter.color[0], emitter.color[1], emitter.color[2]];

            var a = emitter.velRand.val * 0.0001;

            for (var j = -1; j <= 1; ++j) {
                var p = [0.0, 0.0];

                vec2.scaleAndAdd(p, emitter.position, v, 0.8* (j) );

                this.particles.push(new Particle(
                    p, [velocity[0]+getRandomArbitrary(-a,a), velocity[1]+getRandomArbitrary(-a,a)  ],

                    c
                ));
            }

            emitter.timer = 0.0;
        }

    }




    for (var i = 0; i < this.particles.length; ++i) {
        var iParticle = this.particles[i];
        var p = iParticle.position;

        // var SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
        //  var SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

        if (p[0] < SCALED_WORLD_MIN[0] || p[1] < SCALED_WORLD_MIN[1] ||
            p[0] > SCALED_WORLD_MAX[0] || p[1] > SCALED_WORLD_MAX[1]) {

            //    console.log("remove part at ", p );

            this.particles.splice(i, 1);
            --i;
        }
    }


    // console.log("step2: ", this.particles.length );

    this.hash.update(this.particles);


    for (var i = 0; i < this.particles.length; ++i) {
        var iParticle = this.particles[i];


        vec2.add(iParticle.position, iParticle.position, iParticle.f);
        iParticle.f = [0.0, 0.0];

        // console.log("move: ", iParticle.position);

        iParticle.nearDensity = 0.0;
        iParticle.density = 0.0;


        //var diff = vec2.create();
        if (!iParticle.isNew)
            vec2.subtract(iParticle.velocity, iParticle.position, iParticle.o);

        iParticle.isNew = false;

        iParticle.velocity[1] += gravity;

        //  console.log("grav: ", gravity);


        // do viscosisity.


        var nearParticles = this.hash.getNearParticles(iParticle);

        for (var j = 0; j < nearParticles.length; ++j) {

            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];
            vec2.subtract(dp, iParticle.position, jParticle.position);

            var r2 = vec2.dot(dp, dp);

            if (r2 <= 0.0 || r2 > h * h)
                continue;

            var r = Math.sqrt(r2);

            var normalized_r = [0.0, 0.0];
            vec2.scale(normalized_r, dp, 1.0 / r);

            var one_minus_q = 1 - r / h;


            var vi_minus_vj = [0.0, 0.0];

            // TODO: should it not be that reverse order?
            vec2.subtract(vi_minus_vj, iParticle.velocity, jParticle.velocity);


            var u = vec2.dot(vi_minus_vj, normalized_r);
//                (_loc2_.vx - _loc8_.vx) * _loc9_ + (_loc2_.vy - _loc8_.vy) * _loc10_;


            var T = 0;
            if (u > 0) {

                T = one_minus_q * (sigma * u + beta * u * u) * 0.5;

                if (T < u) {
                    T = T;
                } else {
                    T = u;
                }
            } else {

                T = one_minus_q * (sigma * u - beta * u * u) * 0.5;

                if (T > u) {
                    T = T;
                } else {
                    T = u;
                }

            }

            var I_div2 = [0.0, 0.0];
            vec2.scale(I_div2, normalized_r, T);

            vec2.scaleAndAdd(iParticle.velocity, iParticle.velocity, I_div2, -1.0);
            vec2.scaleAndAdd(jParticle.velocity, jParticle.velocity, I_div2, +1.0);


        }


    }

    // calculate pressures.
    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];

        iParticle.o = [iParticle.position[0], iParticle.position[1]];

        //  console.log("add vel: ", iParticle.velocity);
        vec2.add(iParticle.position, iParticle.position, iParticle.velocity);
        //  console.log("added vel: ", iParticle.position);

        // do collision handling here!

        // SCALED_WORLD_MAX


        const pad = 15;

        /*
         if(iParticle.position[1] > SCALED_WORLD_MAX[1]-pad) {
         iParticle.position[1] += ( SCALED_WORLD_MAX[1]-pad - iParticle.position[1]   ) * wallDamp;
         }
         else if(iParticle.position[0] > SCALED_WORLD_MAX[0]-pad) {
         iParticle.position[0] += ( SCALED_WORLD_MAX[0]-pad - iParticle.position[0]   ) * wallDamp;
         }
         else if(iParticle.position[0] < SCALED_WORLD_MIN[0]+pad) {
         iParticle.position[0] += ( SCALED_WORLD_MIN[0]+pad - iParticle.position[0]   ) * wallDamp;
         }
         else if(iParticle.position[1] < SCALED_WORLD_MIN[1]+5) {
         iParticle.position[1] += ( SCALED_WORLD_MIN[1]+pad - iParticle.position[1]   ) * wallDamp;
         }
         */


        for (var iBody = 0; iBody < this.collisionBodies.length; ++iBody) {

            var body = this.collisionBodies[iBody];

            var x = iParticle.position;
            var scratch = vec2.create();

            if (true) {
                var p0 = body.p0;
                var p1 = body.p1;
                var r = body.radius;


                var p1_sub_p0 = [0.0, 0.0];
                vec2.subtract(p1_sub_p0, p1, p0);

                var t = -vec2.dot(vec2.subtract(scratch, p0, x), p1_sub_p0) / vec2.dot(p1_sub_p0, p1_sub_p0);
                t = clamp(t, 0.0, 1.0);

                var q = [0.0, 0.0];
                vec2.scaleAndAdd(q, p0, p1_sub_p0, t);

                var Fx = vec2.length(vec2.subtract(scratch, q, x)) - r;

                // check if collision
                if (Fx <= 0) {


                    var x_sub_q = [0.0, 0.0];
                    vec2.subtract(x_sub_q, x, q);
                    var x_sub_q_len = vec2.length(x_sub_q);

                    // compute normal.
                    var n = [0.0, 0.0];
                    vec2.scale(n, x_sub_q, -Math.sign(Fx) / ( x_sub_q_len  ))

                    // bounce particle in the direction of the normal.
                    vec2.scaleAndAdd(iParticle.position, iParticle.position, n, -Fx * wallDamp);
                }
            }
        }


        var nearParticles = this.hash.getNearParticles(iParticle);

        for (var j = 0; j < nearParticles.length; ++j) {

            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];

            vec2.subtract(dp, iParticle.position, jParticle.position);

            var r2 = vec2.dot(dp, dp);

            if (r2 <= 0.0 || r2 > h * h)
                continue;

            var r = Math.sqrt(r2);
            var a = 1 - r / h;

            var aa = a * a;
            var aaa = aa * a;

            iParticle.density += aa;
            jParticle.density += aa;

            iParticle.nearDensity += aaa;
            jParticle.nearDensity += aaa;
        }
    }

    // console.log("step5");


    // calculate relaxed positions:

    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];

        var pressure = k * (iParticle.density - rho_0);
        var nearPressure = k_near * iParticle.nearDensity;

        //console.log("pressure ", pressure);
        //console.log("nearPressure ", nearPressure);


        var nearParticles = this.hash.getNearParticles(iParticle);

        for (var j = 0; j < nearParticles.length; ++j) {


            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];
            vec2.subtract(dp, iParticle.position, jParticle.position);
            //float dx = pj.x - pi.x;
            //float dy = pj.y - pi.y;


            var r2 = vec2.dot(dp, dp);

            if (r2 <= 0.0 || r2 > h * h)
                continue;

            var r = Math.sqrt(r2);
            var a = 1 - r / h;

            var D = ( pressure * a + nearPressure * a * a ) * 0.5;

            var DA = [0.0, 0.0];

            vec2.scale(DA, dp, D / r);

            // console.log("generate pressure: ", DA );


            vec2.scaleAndAdd(iParticle.f, iParticle.f, DA, 1.0);
            vec2.scaleAndAdd(jParticle.f, jParticle.f, DA, -1.0);


        }
    }


}

Water.prototype.draw = function (gl) {

  //  Water.prototype.addCapsule = function (mousePos) {
//        var mMousePos = this.mapMousePos(mousePos);

        this.renderer.draw(gl, this.collisionBodies, this.particles,
            this.newCapsule, this.emitters
            );
}

Water.prototype.mapMousePos = function (mousePos) {

    // we map the mouse pos to the coordinate system of the water simultation
    return [

        WORLD_SCALE *(mousePos[0] - ( this.canvasWidth - this.canvasHeight ) * 0.5 - 0.5 * this.canvasHeight) * (  2.0 / this.canvasHeight ),

        (-1 + 2 * (  mousePos[1] / this.canvasHeight )) * WORLD_SCALE,

    ];


}

Water.prototype.removeCapsule = function (mousePos) {
    var mMousePos = this.mapMousePos(mousePos);

    for (var iBody = 0; iBody < this.collisionBodies.length; ++iBody) {

        var body = this.collisionBodies[iBody];

        var Fx = body.eval(mMousePos);
        
        if(Fx <= 0) {
            this.collisionBodies.splice(iBody, 1);
            --iBody;
        }
    }

}

Water.prototype.addCapsule = function (mousePos, capsuleRadius) {

    if(this.newCapsule != null) {
        // add the capsule.

        this.collisionBodies.push(this.newCapsule);
        
        this.newCapsule = null;
    } else {
        // make new capsule.
        var mMousePos = this.mapMousePos(mousePos);
        this.newCapsule = new Capsule([mMousePos[0]/WORLD_SCALE, mMousePos[1]/WORLD_SCALE], [0.0, 0.0], capsuleRadius, FRAME_COLOR);

        this.newCapsule.p1 = this.mapMousePos(mousePos);
    }

}

Water.prototype.addEmitter = function(mousePos) {
    var mMousePos = this.mapMousePos(mousePos);

    this.emitters.push(new Emitter([mMousePos[0]/WORLD_SCALE, mMousePos[1]/WORLD_SCALE   ]  ));
}

// return index of emitter under the cursor.
Water.prototype.findEmitter = function(mousePos) {

    var mMousePos = this.mapMousePos(mousePos);

    for (var i = 0; i < this.emitters.length; ++i) {
        var emitter = this.emitters[i];
        var Fx = emitter.eval([mMousePos[0]/WORLD_SCALE, mMousePos[1]/WORLD_SCALE   ]);
        if(Fx <= 0) {
            return i;
        }
    }

    return -1;
}


Water.prototype.removeEmitter = function(mousePos) {
    var i = this.findEmitter(mousePos);
    if(i != -1) {
        this.emitters.splice(i, 1);
    }
}

Water.prototype.selectEmitter = function(mousePos) {
    var i = this.findEmitter(mousePos);
    if(i != -1) {
        return this.emitters[i]
    } else {
        return null;
    }
}



Water.prototype.cancelAddCapsule = function () {
    this.newCapsule = null;
}

module.exports = Water;

/*
 http://prideout.net/blog/?p=58

 3D SPH rendering:
 http://developer.download.nvidia.com/presentations/2010/gdc/Direct3D_Effects.pdf


 GPU gems 2D fluids:
 http://meatfighter.com/fluiddynamics/GPU_Gems_Chapter_38.pdf


 SPH Study for integration in games:
 http://www.roelezendam.com/Specialisation%20Thesis%20Final%20Roel%20Ezendam%20070254.pdf

 Original SPH article:
 http://matthias-mueller-fischer.ch/publications/sca03.pdf

 Siggraph course:
 file:///Users/eric/Dropbox/backlog/fluids_notes.pdf

 Japanese SPH article:
 http://inf.ufrgs.br/cgi2007/cd_cgi/papers/harada.pdf

 SPH and euler tutorial:
 http://cg.informatik.uni-freiburg.de/intern/seminar/gridFluids_fluid-EulerParticle.pdf

 Fluid flow for the rest of us:
 http://cg.informatik.uni-freiburg.de/intern/seminar/gridFluids_fluid_flow_for_the_rest_of_us.pdf

 5.6.1

 create n particles.
 create collision objects.
 initialize leap-frog integrator.(but initially, we may as well use
 newton. )



 5.6.4
 compute g force.



 5.6.5

 F = f_internal + f_external
 but it in will only be the g force, in our simplified case.

 use leap-frog to advance particle velocity and position.


 Perform collision detection against collision primitives using (4.33).
 v. If a collision occurred then
 a. Project particle position according to the contact point using (4.55).
 b. Update the velocity using (4.58).
 vi. Approximate the new particle velocity using


 optimizeize v8:
 https://www.youtube.com/watch?v=UJPdhx5zTaw
 http://thibaultlaurens.github.io/javascript/2013/04/29/how-the-v8-engine-works/

 masters thesis:
 http://image.diku.dk/projects/media/kelager.06.pdf

 */