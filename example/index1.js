/* global requestAnimationFrame */

var glShader = require('gl-shader');
var glslify = require('glslify')
var shell = require("gl-now")();
var createGui = require("pnp-gui");
var mat4 = require("gl-mat4");
var vec3 = require("gl-vec3");

var createWater = require("../water.js");

var mouseLeftDownPrev = false;

var bg = [0.6, 0.7, 1.0]; // clear color.

var water;


shell.on("gl-init", function () {
    var gl = shell.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    gui = new createGui(gl);
    gui.windowSizes = [300, 530];

    water = new createWater(gl);

//    rockShader = glShader(gl, glslify("./rock_vert.glsl"), glslify("./rock_frag.glsl"));

});

var total = 0;

shell.on("tick", function () {
    /*total += 0.033;
    
    if(total > 10.0) {
        console.log("555555: ");
    }*/
    var canvas = shell.canvas;

    water.update(canvas.width, canvas.height, 0.033);

    

});


shell.on("gl-render", function (t) {
    var gl = shell.gl;
    var canvas = shell.canvas;



    water.draw(gl);
    
    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePositionCur: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Editor");

    if(gui.button("CLICK"))
        //gui.textLine("frame time " + t);
    
        console.log("frame time ", t);


    gui.end(gl, canvas.width, canvas.height);
});


shell.on("tick", function () {
    var gl = shell.gl

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;
    
    /*
    HANDLE MOUSE INPUT
     */
});