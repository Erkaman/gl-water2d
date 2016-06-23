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
const EM_ADD_EMITTER = 2;
const EM_REMOVE_EMITTER = 3;
const EM_EDIT_EMITTER = 4;

var editMode = {val: EM_ADD_CAPSULE};

var editEmitter = null; // the emitter being edited.

var capsuleRadius = {val: 0.05};

shell.on("gl-init", function () {
    var gl = shell.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    
    gui = new createGui(gl);
    gui.windowSizes = [300, 530];
    gui.windowAlpha = 1.0;

    water = new createWater(gl);

//    rockShader = glShader(gl, glslify("./rock_vert.glsl"), glslify("./rock_frag.glsl"));

});

var total = 0;

shell.on("tick", function () {
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
    gui.radioButton("Add Emitter", editMode, EM_ADD_EMITTER);
    gui.radioButton("Remove Emitter", editMode, EM_REMOVE_EMITTER);
    gui.radioButton("Edit Emitter", editMode, EM_EDIT_EMITTER);

    gui.separator();

    gui.textLine("Edit Mode Settings");

    if(editMode.val == EM_ADD_CAPSULE) {
        gui.textLine("Right click to cancel");
        gui.sliderFloat("Capsule Radius", capsuleRadius, 0.02, 0.06);
    }else if(editMode.val == EM_EDIT_EMITTER) {

        if(editEmitter == null) {
            gui.textLine("Please select an emitter");
        } else {
            gui.textLine("Editing");

            gui.draggerRgb("Color", editEmitter.color);
            gui.sliderFloat("Frequency", editEmitter.frequency, 0.01, 0.3 );
            gui.sliderInt("Angle", editEmitter.baseAngle, 0, 360);
            gui.sliderInt("Angle Velocity", editEmitter.angleVelocity, 0, 80);

            gui.sliderFloat("Strength", editEmitter.strength, 0.001, 0.02);

            gui.sliderInt("Velocity Randomness", editEmitter.velRand, 0, 30);

        }

    }

    gui.separator();

    if(gui.button("Reset Particles")) {
        water.reset();
    }

    gui.checkbox("Limit Particle Count", water.isLimitParticles);

    if(water.isLimitParticles.val) {
        gui.sliderInt("Max Particles", water.maxParticles, 0, 10000);
    }


    gui.end(gl, canvas.width, canvas.height);

});

var leftClicked = false;
var rightClicked = false;

shell.on("tick", function () {
    var gl = shell.gl

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;

    var leftDown = shell.wasDown("mouse-left");
    var rightDown = shell.wasDown("mouse-right");

    if(!leftClicked && leftDown ==true) {
        console.log("lrft CLICK");

        if (editMode.val == EM_REMOVE_CAPSULE) {
            water.removeCapsule(shell.mouse);
        } else if (editMode.val == EM_ADD_CAPSULE) {
            water.addCapsule(shell.mouse, capsuleRadius.val);
        }else if (editMode.val == EM_ADD_EMITTER) {
            water.addEmitter(shell.mouse);
        }else if (editMode.val == EM_REMOVE_EMITTER) {
            editEmitter = null;
            water.removeEmitter(shell.mouse);
        }else if (editMode.val == EM_EDIT_EMITTER) {
            var e = water.selectEmitter(shell.mouse);

            if(e != null) {
                editEmitter = e;
            }

        }

        leftClicked = true;
    }

    if(!rightClicked && rightDown ==true) {
        console.log("right CLICK");

        if (editMode.val == EM_ADD_CAPSULE) {
            water.cancelAddCapsule();
        }

        rightClicked = true;
    }

    if(leftDown==false) {
        leftClicked = false;
    }
    if(rightDown==false) {
        rightClicked = false;
    }
    
    /*
    HANDLE MOUSE INPUT
     */
});