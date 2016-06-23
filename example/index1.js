/* global requestAnimationFrame */

var glShader = require('gl-shader');
var glslify = require('glslify')
var shell = require("gl-now")( {tickRate: 20} );
var createGui = require("pnp-gui");
var mat4 = require("gl-mat4");
var vec3 = require("gl-vec3");

var createWater = require("../water.js");

var mouseLeftDownPrev = false;
var pressed;
var io;


var bg = [0.6, 0.7, 1.0]; // clear color.

var water;

// edit modes
const EM_REMOVE_CAPSULE = 0;
const EM_ADD_CAPSULE = 1;

var editMode = {val: EM_ADD_CAPSULE};


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
    /*total += 0.016;
    
    if(total > 10.0) {
        console.log("10: ");
    }*/

    var canvas = shell.canvas;

    water.update(canvas.width, canvas.height, shell.mouse, 0.02);

    

});


shell.on("gl-render", function (t) {
    var gl = shell.gl;
    var canvas = shell.canvas;



    water.draw(gl);

    pressed = shell.wasDown("mouse-left");
    io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePositionCur: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Editor");

    gui.textLine("Edit Mode");

    gui.radioButton("Remove Capsule", editMode, EM_REMOVE_CAPSULE);

    gui.radioButton("Add Capsule", editMode, EM_ADD_CAPSULE);


    gui.end(gl, canvas.width, canvas.height);

});

var clicked = false;

shell.on("tick", function () {
    var gl = shell.gl

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;


    if(io != null && !clicked && io.mouseLeftDownCur ==true) {
        console.log("CLICK");

        if (editMode.val == EM_REMOVE_CAPSULE) {
            water.removeCapsule(shell.mouse);
        } else if (editMode.val == EM_ADD_CAPSULE) {
            water.addCapsule(shell.mouse);
        }

        clicked = true;
    }

    if(io != null && io.mouseLeftDownCur==false) {
        clicked = false;
    }


    
    /*
    HANDLE MOUSE INPUT
     */
});