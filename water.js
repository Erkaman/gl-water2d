/*
 Require dependencies
 */
var createShader = require("gl-shader");
var mat4 = require("gl-mat4");
var createTexture = require('gl-texture2d');
var createBuffer = require('gl-buffer');
var vec3 = require('gl-vec3');
var vec2 = require('gl-vec2');
var clamp = require('clamp');

var shaders = require("./shaders.js");
var SpatialHash = require("./spatial_hash.js");

var particleImage = require("./part.js");

// collision body types:
const CIRCLE_BODY = 0;
const CAPSULE_BODY = 1;

var WORLD_MIN = [-0.6, -0.6];
var WORLD_MAX = [+0.6, +0.9];
var WORLD_SCALE = 260.0;

var SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
var SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

var particleRadius = 0.015 * WORLD_SCALE;

// support radius
var h = particleRadius;

var renderMult = 1.0; // 2.5

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


    /*
     We use this single shader to render the GUI.
     */
    this.shader = createShader(gl, shaders.vert, shaders.frag);

    /*
     These buffers contain all the geometry data.
     */
    this.positionBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.colorBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.uvBufferObject = createBuffer(gl, [], gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
    this.indexBufferObject = createBuffer(gl, [], gl.ELEMENT_ARRAY_BUFFER, gl.DYNAMIC_DRAW);



    this.particleTexture = createTexture(gl, particleImage);
   // this.particleTexture.magFilter = gl.LINEAR;
  //  this.particleTexture.minFilter = gl.LINEAR;



    function Circle(position, radius, color) {
        this.position = vec2.fromValues(position[0] * WORLD_SCALE, position[1] * WORLD_SCALE);
        this.radius = radius * WORLD_SCALE;
        this.color = color;
        this.type = CIRCLE_BODY;
    }

    function Capsule(p0, p1, radius, color) {

        this.p0 = vec2.fromValues(p0[0] * WORLD_SCALE, p0[1] * WORLD_SCALE);
        this.p1 = vec2.fromValues(p1[0] * WORLD_SCALE, p1[1] * WORLD_SCALE);

        this.radius = radius * WORLD_SCALE;
        this.color = color;
        this.type = CAPSULE_BODY;

    }

    this.particles = [];


    var add = 0;

    /*
    for (var y = -0.3; y < 0.35; y += 0.020) {
        for (var x = -0.4; x < +0.3; x += 0.020) {
            this.particles.push(new Particle([x + add, y], [0.0, 0.0]));
        }

        if(add > 0) {
            add = 0;
        } else {
            add = +0.05;
        }
    }
    */


    this.collisionBodies = [];

    //this.collisionBodies.push(new Circle([0.0,0.2], 0.13, [0.7, 0.2, 0.2]));

    const FRAME_RADIUS = 0.06;
    const FRAME_COLOR = [0, 0.5, 0];

    // frame
    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MAX[0], WORLD_MIN[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([WORLD_MIN[0]*0.7, WORLD_MAX[1]], [WORLD_MAX[0], WORLD_MAX[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MIN[0], WORLD_MAX[1]], FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([WORLD_MAX[0], WORLD_MIN[1]], WORLD_MAX, FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([0.1, 0.8], [0.3, 0.5], 0.03, FRAME_COLOR));

    this.collisionBodies.push(new Capsule([0.6, 0.0], [0.3, 0.3], 0.03, FRAME_COLOR));
    this.collisionBodies.push(new Capsule([-0.5, -0.3], [0.2, 0.4], 0.03, FRAME_COLOR));


    this.collisionBodies.push(new Circle(WORLD_MIN, FRAME_RADIUS, [0.7, 0.0, 0.0]));
    this.collisionBodies.push(new Circle(WORLD_MAX, FRAME_RADIUS, [0.7, 0.0, 0.0]));

    this.hash = new SpatialHash(h, SCALED_WORLD_MIN, SCALED_WORLD_MAX);
}


function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function Particle(position, velocity) {

    this.position = vec2.fromValues(position[0] * WORLD_SCALE, position[1] * WORLD_SCALE);

    this.velocity = vec2.fromValues(velocity[0] * WORLD_SCALE, velocity[1] * WORLD_SCALE);

   // console.log("add part: ", this.position );
  //  this.color = [ 0.0, 0.0 ,getRandomArbitrary(0.95, 1.0)  ] ;
    this.color = [ getRandomArbitrary(0.0, 1.0), getRandomArbitrary(0.0, 1.0) ,getRandomArbitrary(0.0, 1.0)  ] ;

    this.radius = particleRadius;

    this.o = [this.position[0], this.position[1]];
    this.f = [0.0, 0.0];
    this.isNew = true;



}

var count = 0;

var timeCount = 0;

Water.prototype.update = function (canvasWidth, canvasHeight, delta) {
    
    count++;


    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;


    if(count % 2 == 0 && this.particles.length < 800) {

        const MIN_Y_VEL = -0.0095;
        const MAX_Y_VEL = -0.0090;

        this.particles.push(new Particle([-0.1, 0.0], [0.003, getRandomArbitrary(MIN_Y_VEL, MAX_Y_VEL) ]));

        this.particles.push(new Particle([-0.1, 0.01], [0.003,getRandomArbitrary(MIN_Y_VEL, MAX_Y_VEL)   ]));

        this.particles.push(new Particle([-0.1, 0.02], [0.003, getRandomArbitrary(MIN_Y_VEL, MAX_Y_VEL)  ]));

    }


    for (var i = 0; i < this.particles.length; ++i) {
        var iParticle = this.particles[i];
        var p = iParticle.position;

       // var SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
      //  var SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

        if(p[0] < SCALED_WORLD_MIN[0] || p[1] < SCALED_WORLD_MIN[1] ||
            p[0] > SCALED_WORLD_MAX[0] || p[1] > SCALED_WORLD_MAX[1]) {

            console.log("remove part at ", p );

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
        if(!iParticle.isNew)
            vec2.subtract( iParticle.velocity, iParticle.position, iParticle.o);

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
            vec2.scale( normalized_r, dp, 1.0/r );

            var one_minus_q = 1 - r/h;



            var vi_minus_vj = [0.0, 0.0];

            // TODO: should it not be that reverse order?
            vec2.subtract(vi_minus_vj, iParticle.velocity, jParticle.velocity);


            var u = vec2.dot(  vi_minus_vj, normalized_r  );
//                (_loc2_.vx - _loc8_.vx) * _loc9_ + (_loc2_.vy - _loc8_.vy) * _loc10_;



            var T = 0;
            if(u > 0) {

                T = one_minus_q * (sigma * u + beta * u * u) * 0.5;

                if(T < u) {
                    T = T;
                } else {
                    T = u;
                }
            } else {

                T = one_minus_q * (sigma * u - beta * u * u) * 0.5;

                if(T > u) {
                    T = T;
                } else {
                    T = u;
                }

            }

            var I_div2 = [0.0, 0.0];
            vec2.scale( I_div2, normalized_r, T );

            vec2.scaleAndAdd(iParticle.velocity, iParticle.velocity, I_div2, -1.0 );
            vec2.scaleAndAdd(jParticle.velocity, jParticle.velocity, I_div2, +1.0 );


        }




    }

    // calculate pressures.
    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];

        iParticle.o = [ iParticle.position[0], iParticle.position[1] ];

      //  console.log("add vel: ", iParticle.velocity);
        vec2.add(  iParticle.position, iParticle.position, iParticle.velocity );
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


           if (body.type == CAPSULE_BODY) {
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

                    // compute contact point
                    var cp = [0.0, 0.0];
                    vec2.scaleAndAdd(
                        cp,
                        q,
                        x_sub_q, (r / x_sub_q_len ));

                    // compute normal.
                    var n = [0.0, 0.0];
                    vec2.scale(n, x_sub_q, -Math.sign(Fx) / ( x_sub_q_len  ))

                    // update particle due to collision
                    //iParticle.position = cp;
                    //this._reflect(iParticle.velocity, n);

                    vec2.scaleAndAdd( iParticle.position, iParticle.position, n, -Fx*wallDamp  );

                    // = cp;

                }
            }
        }

        
        var nearParticles = this.hash.getNearParticles(iParticle);

        for (var j = 0; j < nearParticles.length; ++j) {

            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];

            vec2.subtract(dp, iParticle.position, jParticle.position);

            var r2 = vec2.dot(dp, dp);

            if (r2 <= 0.0 || r2 > h*h)
                continue;

            var r = Math.sqrt(r2);
            var a = 1 - r/h;

            var aa = a*a;
            var aaa = aa*a;

            iParticle.density +=  aa;
            jParticle.density +=  aa;

            iParticle.nearDensity +=  aaa;
            jParticle.nearDensity +=  aaa;
        }
    }

   // console.log("step5");


    // calculate relaxed positions:

    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];

        var pressure     = k * (iParticle.density - rho_0);
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

            if (r2 <= 0.0 || r2 > h*h)
                continue;

            var r = Math.sqrt(r2);
            var a = 1 - r/h;
            
            var D = ( pressure * a + nearPressure * a * a ) * 0.5;

            var DA = [0.0, 0.0];

            vec2.scale( DA, dp, D / r );

           // console.log("generate pressure: ", DA );


            vec2.scaleAndAdd(iParticle.f, iParticle.f, DA, 1.0 );
            vec2.scaleAndAdd(jParticle.f, jParticle.f, DA, -1.0 );


        }
    }


}


Water.prototype.draw = function (gl) {

    /*
     Setup geometry buffers.
     */
    this.indexBuffer = [];
    this.positionBuffer = [];
    this.colorBuffer = [];
    this.uvBuffer = [];

    this.indexBufferIndex = 0;
    this.positionBufferIndex = 0;
    this.colorBufferIndex = 0;
    this.uvBufferIndex = 0;


    /*
     Create geometry.
     */

    for (var i = 0; i < this.collisionBodies.length; ++i) {

        var body = this.collisionBodies[i];

        if (body.type == CIRCLE_BODY)
            this._circle([body.position[0] / WORLD_SCALE, body.position[1] / WORLD_SCALE],  body.radius / WORLD_SCALE, body.color, 40);
        else if (body.type == CAPSULE_BODY)
            this._capsule(
                [body.p0[0] / WORLD_SCALE, body.p0[1] / WORLD_SCALE],
                [body.p1[0] / WORLD_SCALE, body.p1[1] / WORLD_SCALE], body.radius / WORLD_SCALE, body.color, 40);
    }


    for (var i = 0; i < this.particles.length; ++i) {

        var particle = this.particles[i];

        var p = [particle.position[0] / WORLD_SCALE, particle.position[1] / WORLD_SCALE];
        var r =  renderMult*(particle.radius / WORLD_SCALE);

        this._texturedBox([ p[0] - r, p[1] - r  ], [2*r, 2*r], particle.color);
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

    /*
     If a VAO is already bound, we need to unbound it. Otherwise, we will write into a VAO created by the user of the library
     when calling vertexAttribPointer, which means that we would effectively corrupt the user data!
     */
    var VAO_ext = gl.getExtension('OES_vertex_array_object');
    if (VAO_ext)
        VAO_ext.bindVertexArrayOES(null);


    this.positionBufferObject.update(this.positionBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aPosition.location);
    gl.vertexAttribPointer(this.shader.attributes.aPosition.location, 2, gl.FLOAT, false, 0, 0);
    this.positionBufferObject.unbind();


    this.colorBufferObject.update(this.colorBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aColor.location);
    gl.vertexAttribPointer(this.shader.attributes.aColor.location, 4, gl.FLOAT, false, 0, 0);
    this.colorBufferObject.unbind();

    this.uvBufferObject.update(this.uvBuffer);
    gl.enableVertexAttribArray(this.shader.attributes.aUv.location);
    gl.vertexAttribPointer(this.shader.attributes.aUv.location, 2, gl.FLOAT, false, 0, 0);
    this.uvBufferObject.unbind();

    this.indexBufferObject.update(this.indexBuffer);


    /*
     Setup matrices.
     */
    var projection = mat4.create()
    mat4.ortho(projection, 0, this.canvasWidth, this.canvasHeight, 0, -1.0, 1.0)

    this.shader.bind()

    this.shader.uniforms.uProj = projection;
    this.shader.uniforms.uTex = this.particleTexture.bind();


    //this.shader.uniforms.uFontAtlas = this.fontAtlasTexture.bind()

    gl.disable(gl.DEPTH_TEST) // no depth testing; we handle this by manually placing out
    // widgets in the order we wish them to be rendered.

    // for text rendering, enable alpha blending.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)

    gl.drawElements(gl.TRIANGLES, (this.indexBufferIndex), gl.UNSIGNED_SHORT, 0);


};

Water.prototype._addIndex = function (index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
};

Water.prototype._addPosition = function (position) {

    var x = ((position[0] + 1) / 2.0) * this.canvasHeight + (this.canvasWidth - this.canvasHeight) / 2.0;
    var y = 1.0 * (((position[1] + 1) / 2.0) * this.canvasHeight);

    this.positionBuffer[this.positionBufferIndex++] = x
    this.positionBuffer[this.positionBufferIndex++] = y;
};

Water.prototype._addColor = function (color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];
    this.colorBuffer[this.colorBufferIndex++] = color[3];
};

Water.prototype._addUv = function (uv) {
    this.uvBuffer[this.uvBufferIndex++] = uv[0];
    this.uvBuffer[this.uvBufferIndex++] = uv[1];
};

/*
 Add vertex that only has one color, and does not use a texture.
 */
Water.prototype._coloredVertex = function (position, color) {
    // at this uv-coordinate, the font atlas is entirely white.
    var whiteUv = [2.0, 2.0];

    this._addPosition(position);
    this._addColor(color);
    this._addUv(whiteUv);
};

Water.prototype._texturedVertex = function (position, color, uv) {
    this._addPosition(position);
    this._addColor(color);
    this._addUv(uv);
};

/*
 Render a box.

 `color` is a RGB-triplet.
 the optional `alpha` argument specifies the transparency of the box.
 default value of `alpha` is 1.0
 */
Water.prototype._texturedBox = function (position, size, color) {


    if (typeof alpha === 'undefined') {
        alpha = 1.0; // default to 1.0
    }

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl = [position[0], position[1] + size[1]];
    var tr = [position[0] + size[0], position[1]];
    var br = [position[0] + size[0], position[1] + size[1]];

    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], alpha];

    // vertex 1
    //this._coloredVertex(tl, c);
    this._texturedVertex(tl, c, [0.0, 0.0] );

    // vertex 2
    //this._coloredVertex(bl, c);
    this._texturedVertex(bl, c, [0.0, 1.0] );

    // vertex 3
  //  this._coloredVertex(tr, c);
    this._texturedVertex(tr, c, [1.0, 0.0] );


    // vertex 4
//    this._coloredVertex(br, c);
    this._texturedVertex(br, c, [1.0, 1.0] );

    // triangle 1
    this._addIndex(baseIndex + 0);
    this._addIndex(baseIndex + 1);
    this._addIndex(baseIndex + 2);

    // triangle 2
    this._addIndex(baseIndex + 3);
    this._addIndex(baseIndex + 2);
    this._addIndex(baseIndex + 1);
};

Water.prototype._box = function (position, size, color) {


    if (typeof alpha === 'undefined') {
        alpha = 1.0; // default to 1.0
    }

    // top-left, bottom-left, top-right, bottom-right corners
    var tl = position;
    var bl = [position[0], position[1] + size[1]];
    var tr = [position[0] + size[0], position[1]];
    var br = [position[0] + size[0], position[1] + size[1]];

    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], alpha];

    // vertex 1
    this._coloredVertex(tl, c);

    // vertex 2
    this._coloredVertex(bl, c);

    // vertex 3
    this._coloredVertex(tr, c);


    // vertex 4
    this._coloredVertex(br, c);

    // triangle 1
    this._addIndex(baseIndex + 0);
    this._addIndex(baseIndex + 1);
    this._addIndex(baseIndex + 2);

    // triangle 2
    this._addIndex(baseIndex + 3);
    this._addIndex(baseIndex + 2);
    this._addIndex(baseIndex + 1);
};

Water.prototype._unitCircle = function (position, theta, radius) {
    return [position[0] + radius * Math.cos(theta), position[1] + radius * Math.sin(theta)];
};

/*
 A capsule is defined by a line segment between p1 and p2, and a radius.
 */
Water.prototype._capsule = function (p1, p2, radius, color, segments) {

    // direction vector the line segment.
    var d = vec2.create();
    vec2.subtract(d, p1, p2);

    var theta = Math.atan2(d[1], d[0]) - Math.PI / 2.0;

    // Draw the round parts at the end of the capsule.
    this._arc(p1, radius, theta, color, segments);
    this._arc(p2, radius, theta + Math.PI, color, segments);


    // normal to line segment.
    var n = [-d[1], d[0]];
    vec2.normalize(n, n);

    var scratch = [0.0, 0.0];

    var baseIndex = this.positionBufferIndex / 2;


    var alpha = 1.0;
    var c = [color[0], color[1], color[2], alpha];

    // vertex 1
    this._coloredVertex(vec3.scaleAndAdd(scratch, p1, n, radius), c);

    // vertex 2
    this._coloredVertex(vec3.scaleAndAdd(scratch, p2, n, radius), c);

    // vertex 3
    this._coloredVertex(vec3.scaleAndAdd(scratch, p1, n, -radius), c);

    // vertex 4
    this._coloredVertex(vec3.scaleAndAdd(scratch, p2, n, -radius), c);


    // triangle 1
    this._addIndex(baseIndex + 2);
    this._addIndex(baseIndex + 1);
    this._addIndex(baseIndex + 0);


    // triangle 2
    this._addIndex(baseIndex + 1);
    this._addIndex(baseIndex + 2);
    this._addIndex(baseIndex + 3);


}

Water.prototype._arc = function (centerPosition, radius, direction, color, segments) {


    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], 1.0];

    // add center vertex.
    this._coloredVertex(centerPosition, c);
    var centerVertexIndex = baseIndex + 0;

    var stepSize = (2 * Math.PI) / segments;
    var curIndex = baseIndex + 1;
    for (var theta = 0; theta <= Math.PI; theta += stepSize, ++curIndex) {

        // for first iteration, we only create one vertex, and no triangles
        if (theta == 0) {
            var p =
                [centerPosition[0] + radius * Math.cos(theta + direction), centerPosition[1] + radius * Math.sin(theta + direction)];

            this._coloredVertex(p, c);
        } else {
            var p =
                [centerPosition[0] + radius * Math.cos(theta + direction), centerPosition[1] + radius * Math.sin(theta + direction)];

            this._coloredVertex(p, c);

            this._addIndex(curIndex + 0);
            this._addIndex(curIndex - 1);
            this._addIndex(centerVertexIndex);
        }
    }
};


// reflect(particle.velocity, n
Water.prototype._reflect = function (v, n) {
    var scratch = [0.0, 0.0];

    vec2.subtract(
        v,
        v,
        vec2.scale(scratch, n, (1.0 + cr) * vec2.dot(v, n))
    );

}

/*
 Render a circle, where the top-left corner of the circle is `position`
 Where `segments` is how many triangle segments the triangle is rendered with.
 */
Water.prototype._circle = function (centerPosition, radius, color, segments) {


    var baseIndex = this.positionBufferIndex / 2;

    var c = [color[0], color[1], color[2], 1.0];

    // add center vertex.
    this._coloredVertex(centerPosition, c);
    var centerVertexIndex = baseIndex + 0;

    var stepSize = (2 * Math.PI) / segments;
    var curIndex = baseIndex + 1;
    for (var theta = 0; theta <= 2 * Math.PI + 0.1; theta += stepSize, ++curIndex) {

        // for first frame, we only create one vertex, and no triangles
        if (theta == 0) {
            var p = this._unitCircle(centerPosition, theta, radius);
            this._coloredVertex(p, c);
        } else {
            var p = this._unitCircle(centerPosition, theta, radius);
            this._coloredVertex(p, c);

            this._addIndex(curIndex + 0);
            this._addIndex(curIndex - 1);
            this._addIndex(centerVertexIndex);
        }
    }
};


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