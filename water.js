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

// collision body types:
const CIRCLE_BODY = 0;
const CAPSULE_BODY = 1;

var WORLD_MIN = [-0.75, -0.5];
var WORLD_MAX = [+0.75, +0.7];
var WORLD_SCALE = 50.0;

var SCALED_WORLD_MIN = [WORLD_MIN[0] * WORLD_SCALE, WORLD_MIN[1] * WORLD_SCALE];
var SCALED_WORLD_MAX = [WORLD_MAX[0] * WORLD_SCALE, WORLD_MAX[1] * WORLD_SCALE];

var particleRadius = 0.01 * WORLD_SCALE;

// support radius
var h = particleRadius * 1.0;


var g = +9.82; // gravity force.


const rho_0 = 180.0; // rest density
const k = 1.2; // gas stiffness constant.
const k_near = 1.4; // gas stiffness for near.
/*
const kSurfaceTension = 0.0004;
const kLinearViscocity = 0.5;
const kQuadraticViscocity = 1.0;
*/


const kappa = 0.2; // surface tension.

const sigma = 0.5; // linear viscosity
const beta  = 1.0; // quadratic viscosity.


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


    /*
    for (var y = -0.3; y < 0.14; y += 0.017) {

        for (var x = -0.2; x < 0.2; x += 0.017) {
            this.particles.push(new Particle([x, y]));
        }
    }
    */
    
   // console.log("count: ",  this.particles.length );

    //this.particles.push(new Particle([0.11, 0.1], 0.006));
    //this.particles.push(new Particle([0.11, 0.15], 0.006));
    //  this.particles.push(new Particle([0.11, 0.2], 0.006));
//    this.particles.push(new Particle([-0.1, -0.4], 0.01));

    this.collisionBodies = [];

    //this.collisionBodies.push(new Circle([0.0,0.2], 0.13, [0.7, 0.2, 0.2]));

    const FRAME_RADIUS = 0.06;
    const FRAME_COLOR = [0, 0.5, 0];

    // frame
    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MAX[0], WORLD_MIN[1]], FRAME_RADIUS, FRAME_COLOR));
    this.collisionBodies.push(new Capsule([WORLD_MIN[0], WORLD_MAX[1]], WORLD_MAX, FRAME_RADIUS, FRAME_COLOR));
    this.collisionBodies.push(new Capsule(WORLD_MIN, [WORLD_MIN[0], WORLD_MAX[1]], FRAME_RADIUS, FRAME_COLOR));
    this.collisionBodies.push(new Capsule([WORLD_MAX[0], WORLD_MIN[1]], WORLD_MAX, FRAME_RADIUS, FRAME_COLOR));

    this.collisionBodies.push(new Circle(WORLD_MIN, FRAME_RADIUS, [0.7, 0.0, 0.0]));
    this.collisionBodies.push(new Circle(WORLD_MAX, FRAME_RADIUS, [0.7, 0.0, 0.0]));

   // this.collisionBodies.push(new Capsule([+0.05, 0.0], [+0.05, +0.4], FRAME_RADIUS, FRAME_COLOR));

    this.hash = new SpatialHash(h, SCALED_WORLD_MIN, SCALED_WORLD_MAX);
}

function Particle(position, velocity) {

    this.position = vec2.fromValues(position[0] * WORLD_SCALE, position[1] * WORLD_SCALE);

    this.velocity = vec2.fromValues(velocity[0] * WORLD_SCALE, velocity[1] * WORLD_SCALE);
    this.radius = particleRadius;
}

var count = 0;

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

Water.prototype.update = function (canvasWidth, canvasHeight, delta) {


    count++;

    if(this.particles.length < 500) {

        if (count % 3 == 0) {

            var xMin = 0.17;
            var xMax = 0.22

            var yMin = -0.02;
            var yMax = +0.02;


            this.particles.push(new Particle([-0.2, -0.03],
                [getRandomArbitrary(xMin,xMax), getRandomArbitrary(yMin,yMax)]));
            this.particles.push(new Particle([-0.2, 0.0],
                [getRandomArbitrary(xMin,xMax), getRandomArbitrary(yMin,yMax)]));
            this.particles.push(new Particle([-0.2, 0.03],
                [getRandomArbitrary(xMin,xMax), getRandomArbitrary(yMin,yMax)]));

        }
    }




    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    for (var i = 0; i < this.particles.length; ++i) {
        var iParticle = this.particles[i];

        // g:
        iParticle.velocity[1] += g * delta;


        // preserve position.
        iParticle.prevPosition = [iParticle.position[0], iParticle.position[1]];

        // advance due to g.
        vec2.scaleAndAdd(iParticle.position, iParticle.position, iParticle.velocity, delta);
    }

    this.hash.update(this.particles);


    // calculate pressures.
    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];


        var nearParticles = this.hash.getNearParticles(iParticle);

        var density = 0.0;
        var nearDensity = 0.0;

        for (var j = 0; j < nearParticles.length; ++j) {

            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];

            vec2.subtract(dp, jParticle.position, iParticle.position);

            var r2 = vec2.dot(dp, dp);

            if (r2 < 0.000001 || r2 > h*h)
                continue;

            var r = Math.sqrt(r2);
            var a = 1 - r/h;
            density +=   a*a*a ;
            nearDensity +=   a*a*a*a ;

        }

        iParticle.density = density;


        iParticle.nearDensity = nearDensity;
        iParticle.P = k * (density - rho_0);
        iParticle.nearP = k_near * nearDensity;
    }

    // calculate relaxed positions:

    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];
        var nearParticles = this.hash.getNearParticles(iParticle);


        var sum = [iParticle.position[0], iParticle.position[1] ];


        for (var j = 0; j < nearParticles.length; ++j) {


            var jParticle = nearParticles[j];

            var dp = [0.0, 0.0];
            vec2.subtract(dp, jParticle.position, iParticle.position);
            //float dx = pj.x - pi.x;
            //float dy = pj.y - pi.y;


            var r2 = vec2.dot(dp, dp);
            var r = Math.sqrt(r2);

            if (r2 < 0.000001 || r2 > h*h)
                continue;



            var a = 1 - r/h;

            var d = delta*delta * ((iParticle.nearP)*a*a*a + (iParticle.P)*a*a) / 2;

            // relax
            vec2.scaleAndAdd( sum, sum, dp, -d / (  r ) );

            // tension.


            vec2.scaleAndAdd( sum, sum, dp, (kappa * a*a)  );


            //          x += (kSurfaceTension) * a*a*kNorm * dx;
//            y += (kSurfaceTension) * a*a*kNorm * dy;







        }

        iParticle.relaxedPosition = [sum[0], sum[1]];

    }


    for (var i = 0; i < this.particles.length; ++i) {
        var iParticle = this.particles[i];

        iParticle.position = [iParticle.relaxedPosition[0], iParticle.relaxedPosition[1]];

        var diff = vec2.create();
        vec2.subtract(diff, iParticle.position, iParticle.prevPosition);

        vec2.scale(iParticle.velocity, diff, 1.0 / delta);

    }





    for (var i = 0; i < this.particles.length; ++i) {

        var iParticle = this.particles[i];


        // collision handling:
        for (var iBody = 0; iBody < this.collisionBodies.length; ++iBody) {

            var body = this.collisionBodies[iBody];

            var x = iParticle.position;
            var scratch = vec2.create();


            if (body.type == CIRCLE_BODY) {
                var c = body.position;
                var r = body.radius;

                var x_sub_c = vec2.create();
                vec2.subtract(x_sub_c, x, c);

                var Fx = vec2.squaredLength(x_sub_c) - r * r;

                // collision if F(X) <= 0
                if (Fx <= 0) {

                    var x_sub_c_len = vec2.length(x_sub_c);

                    // compute contact point
                    var cp = [0.0, 0.0];
                    vec2.scaleAndAdd(
                        cp,
                        c,
                        x_sub_c, (r / x_sub_c_len ));

                    // compute normal.
                    var n = [0.0, 0.0];
                    vec2.scale(n, x_sub_c, -Math.sign(Fx) / ( x_sub_c_len  ))

                    var prev = isNaN(iParticle.position[0]);

                    // update particle due to collision
                    iParticle.position = cp;
                    this._reflect(iParticle.velocity, n);


                    if (!prev && isNaN(iParticle.position[0])) {
                        console.log("pos nan due to circle coll");
                    }

                }

            } else if (body.type == CAPSULE_BODY) {
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
                    iParticle.position = cp;
                    this._reflect(iParticle.velocity, n);
                }
            }
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
/*
    var WORLD_MIN = [-0.75, -0.5];
    var WORLD_MAX = [+0.75, +0.7];
    var WORLD_SCALE = 50.0;
*/

    this._box([-0.75, -0.5], [1.5, 1.2], [1.0, 1.0, 1.0]);

    for (var i = 0; i < this.collisionBodies.length; ++i) {

        var body = this.collisionBodies[i];

        if (body.type == CIRCLE_BODY)
            this._circle([body.position[0] / WORLD_SCALE, body.position[1] / WORLD_SCALE], body.radius / WORLD_SCALE, body.color, 40);
        else if (body.type == CAPSULE_BODY)
            this._capsule(
                [body.p0[0] / WORLD_SCALE, body.p0[1] / WORLD_SCALE],
                [body.p1[0] / WORLD_SCALE, body.p1[1] / WORLD_SCALE], body.radius / WORLD_SCALE, body.color, 40);
    }

    for (var i = 0; i < this.particles.length; ++i) {

        var particle = this.particles[i];

        this._circle(
            [particle.position[0] / WORLD_SCALE, particle.position[1] / WORLD_SCALE], particle.radius / WORLD_SCALE, [0.0, 0.0, 1.0], 40);
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
    //this.shader.uniforms.uFontAtlas = this.fontAtlasTexture.bind()

    gl.disable(gl.DEPTH_TEST) // no depth testing; we handle this by manually placing out
    // widgets in the order we wish them to be rendered.

    // for text rendering, enable alpha blending.
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

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
    var whiteUv = [0.95, 0.95];

    this._addPosition(position);
    this._addColor(color);
    this._addUv(whiteUv);
};

/*
 Render a box.

 `color` is a RGB-triplet.
 the optional `alpha` argument specifies the transparency of the box.
 default value of `alpha` is 1.0
 */
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

    var cr = 0.2;
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