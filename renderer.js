var shaders = require("./shaders.js");
var createTexture = require('gl-texture2d');
var createBuffer = require('gl-buffer');

var createShader = require("gl-shader");
var mat4 = require("gl-mat4");

var particleImage = require("./part.js");

var dt = require("./data_types.js");

var WORLD_SCALE = dt.WORLD_SCALE;

var renderMult = dt.renderMult;

var vec2 = require('gl-vec2');
var vec3 = require('gl-vec3');

const CAPSULE_SEGMENTS = 40;

function Renderer(gl) {

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

}

Renderer.prototype.update = function (canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
}


Renderer.prototype.draw = function (gl, collisionBodies, particles,newCapsule) {

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

    for (var i = 0; i < collisionBodies.length; ++i) {

        var body = collisionBodies[i];

        this._capsule(
                [body.p0[0] / WORLD_SCALE, body.p0[1] / WORLD_SCALE],
                [body.p1[0] / WORLD_SCALE, body.p1[1] / WORLD_SCALE], body.radius / WORLD_SCALE, body.color, CAPSULE_SEGMENTS);
    }

    if(newCapsule != null) {
        this._capsule(
            [newCapsule.p0[0] / WORLD_SCALE, newCapsule.p0[1] / WORLD_SCALE],
            [newCapsule.p1[0] / WORLD_SCALE, newCapsule.p1[1] / WORLD_SCALE], newCapsule.radius / WORLD_SCALE, newCapsule.color, CAPSULE_SEGMENTS);
    }


    for (var i = 0; i < particles.length; ++i) {

        var particle = particles[i];

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

Renderer.prototype._addIndex = function (index) {
    this.indexBuffer[this.indexBufferIndex++] = index;
};

Renderer.prototype._addPosition = function (position) {

    var x = ((position[0] + 1) / 2.0) * this.canvasHeight + (this.canvasWidth - this.canvasHeight) / 2.0;
    var y = (((position[1] + 1) / 2.0) * this.canvasHeight);

    this.positionBuffer[this.positionBufferIndex++] = x
    this.positionBuffer[this.positionBufferIndex++] = y;
};

Renderer.prototype._addColor = function (color) {
    this.colorBuffer[this.colorBufferIndex++] = color[0];
    this.colorBuffer[this.colorBufferIndex++] = color[1];
    this.colorBuffer[this.colorBufferIndex++] = color[2];
    this.colorBuffer[this.colorBufferIndex++] = color[3];
};

Renderer.prototype._addUv = function (uv) {
    this.uvBuffer[this.uvBufferIndex++] = uv[0];
    this.uvBuffer[this.uvBufferIndex++] = uv[1];
};

/*
 Add vertex that only has one color, and does not use a texture.
 */
Renderer.prototype._coloredVertex = function (position, color) {
    // at this uv-coordinate, the font atlas is entirely white.
    var whiteUv = [2.0, 2.0];

    this._addPosition(position);
    this._addColor(color);
    this._addUv(whiteUv);
};

Renderer.prototype._texturedVertex = function (position, color, uv) {
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
Renderer.prototype._texturedBox = function (position, size, color) {


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

Renderer.prototype._box = function (position, size, color) {


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

Renderer.prototype._unitCircle = function (position, theta, radius) {
    return [position[0] + radius * Math.cos(theta), position[1] + radius * Math.sin(theta)];
};

/*
 A capsule is defined by a line segment between p1 and p2, and a radius.
 */
Renderer.prototype._capsule = function (p1, p2, radius, color, segments) {

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

Renderer.prototype._arc = function (centerPosition, radius, direction, color, segments) {


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


/*
 Render a circle, where the top-left corner of the circle is `position`
 Where `segments` is how many triangle segments the triangle is rendered with.
 */
Renderer.prototype._circle = function (centerPosition, radius, color, segments) {


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

module.exports = Renderer;

