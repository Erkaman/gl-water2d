/* global requestAnimationFrame */
var glShader = require('gl-shader');
var glslify = require('glslify')
var shell = require("gl-now")({tickRate: 20});
var createGui = require("pnp-gui");
var mat4 = require("gl-mat4");
var vec3 = require("gl-vec3");

var createWater = require("./simulation.js");
var saveAs = require('filesaver.js').saveAs;

/*
These are used by the GUI
 */
var mouseLeftDownPrev = false;
var pressed;
var io;

/*
the water simulation.
 */
var water;


// edit modes. Used by GUI
const EM_REMOVE_CAPSULE = 0;
const EM_ADD_CAPSULE = 1;
const EM_ADD_EMITTER = 2;
const EM_REMOVE_EMITTER = 3;
const EM_EDIT_EMITTER = 4;
var editMode = {val: EM_ADD_CAPSULE};

var editEmitter = null; // the emitter being edited.

var capsuleRadius = {val: 0.05}; // capsule radius of capsules that we add.

var isRunningSimulation = {val: true}; // capsule radius of capsules that we add.

var importMessage = "No Message";

// ammount of seconds between the update steps of the water simulation.
const updateRate = 0.02;


function hash(text) {

    var h = 5381;
    var index = text.length;

    while (index) {
        h = (h * 33) ^ text.charCodeAt(--index);
    }

    return h >>> 0;
}

shell.on("gl-init", function () {
    var gl = shell.gl;

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gui = new createGui(gl);
    gui.windowSizes = [300, 530];
    gui.windowAlpha = 1.0;

    water = new createWater(gl);
});


var firstTime = true;

shell.on("tick", function () {
    var canvas = shell.canvas;


        /*
         if(firstTime) {
         for(var i = 0; i < 1000; ++i) {
         water.update(canvas.width, canvas.height, shell.mouse, updateRate, isRunningSimulation.val);
         }
         firstTime = false;

         }
         */

        water.update(canvas.width, canvas.height, shell.mouse, updateRate, isRunningSimulation.val);
    
});

shell.on("gl-render", function (t) {
    var gl = shell.gl;
    var canvas = shell.canvas;

    water.draw(gl);

    /*
    Gather information needed by the GUI
     */
    pressed = shell.wasDown("mouse-left");
    io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePositionCur: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    /*
    Create GUI
     */

    gui.begin(io, "Editor");

    gui.textLine("Edit Mode");

    gui.radioButton("Remove Capsule", editMode, EM_REMOVE_CAPSULE);
    gui.radioButton("Add Capsule", editMode, EM_ADD_CAPSULE);
    gui.radioButton("Add Emitter", editMode, EM_ADD_EMITTER);
    gui.radioButton("Remove Emitter", editMode, EM_REMOVE_EMITTER);
    gui.radioButton("Edit Emitter", editMode, EM_EDIT_EMITTER);

    gui.separator();

    gui.textLine("Edit Mode Settings");

    if (editMode.val == EM_ADD_CAPSULE) {
        gui.textLine("Right click to cancel");
        gui.sliderFloat("Capsule Radius", capsuleRadius, 0.02, 0.06);
    } else if (editMode.val == EM_EDIT_EMITTER) {

        if (editEmitter == null) {
            gui.textLine("Please select an emitter");
        } else {
            gui.textLine("Editing");

            gui.draggerRgb("Color", editEmitter.color);
            gui.sliderFloat("Frequency", editEmitter.frequency, 0.01, 0.3);
            gui.sliderInt("Angle", editEmitter.baseAngle, 0, 360);
            gui.sliderInt("Angle Velocity", editEmitter.angleVelocity, 0, 80);

            gui.sliderFloat("Strength", editEmitter.strength, 0.001, 0.02);

            gui.sliderInt("Velocity Randomness", editEmitter.velRand, 0, 30);

        }

    }

    gui.separator();

    if (gui.button("Reset Particles")) {
        water.reset();
    }
    gui.checkbox("Run simulation", isRunningSimulation);


    gui.checkbox("Limit Particle Count", water.isLimitParticles);



    

    if (water.isLimitParticles.val) {
        gui.sliderInt("Max Particles", water.maxParticles, 0, 10000);
    }

    water.isLimitParticles.val = false;

    gui.textLine("Particles: " +  water.getParticleCount() );

    gui.separator();

    if (gui.button("Record")) {

        myfs = null;
        // Request 1MB
        var bytes = 1024 * 1024 * 100; // 100MB
        window.webkitStorageInfo.requestQuota(PERSISTENT, bytes, function (grantedBytes) {
            console.log('Got storage', grantedBytes);
            window.webkitRequestFileSystem(PERSISTENT, grantedBytes, function (fs) {

                window.fs = fs;
                console.log("Got filesystem");

                var totalTime  = 0.0;

                function create_random_file() {

                    var name = Math.random(); // File name doesn't matter
                    fs.root.getFile(name, {create: true}, function (entry) {
                        entry.createWriter(function (writer) {

                            var min = water.getMinPos();
                            var max = water.getMaxPos();
                            min = [Math.floor(min[0]), Math.floor(min[1])];
                            max = [Math.floor(max[0]), Math.floor(max[1])];

                            var width = max[0] - min[0];
                            var height = max[1] - min[1];

                            first = false;

                            var bufferArray = new Uint8Array(width * height * 4);

                            totalTime += updateRate;
                            water.update(canvas.width, canvas.height, shell.mouse, updateRate, isRunningSimulation.val);
                            water.draw(gl);
                            gl.flush();
                            gl.finish();


                            //     console.log("readpixels: ", min[0], min[1], width, height);
                            gl.readPixels(min[0], min[1], width, height, gl.RGBA, gl.UNSIGNED_BYTE, bufferArray);


                            // Convert base64 to binary without UTF-8 mangling.
                            var buffer = new Uint8Array(18 + width * height * 3);
                            var j = 0;

                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 2;
                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 0;

                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = 0;
                            buffer[j++] = width & 0x00FF;
                            buffer[j++] = (width & 0xFF00) / 256;

                            buffer[j++] = height & 0x00FF;
                            buffer[j++] = (height & 0xFF00) / 256;
                            buffer[j++] = 24;
                            buffer[j++] = 0;

                            for (var i = 0; i < width * height * 4; i += 4) {

                                buffer[j++] = bufferArray[i + 2];

                                buffer[j++] = bufferArray[i + 1];

                                buffer[j++] = bufferArray[i + 0];
                            }


                            // Write data
                            var blob = new Blob([buffer], {type: 'image/bmp'});
                            writer.seek(0);
                            writer.write(blob);

                            console.log('Writing file', frames, blob.size);

                            if(totalTime < 3.0)
                                create_random_file();

                        });
                    }, function () {
                        console.log('File error', arguments);
                    });

                }

                create_random_file();


            });
        }, function (e) {
            console.log('Storage error', e);
        });
    }


    if (gui.button("Export")) {

        var json = water.export();

        var blob = new Blob([json], {type: "text/plain;charset=utf-8"});

        // use json text to generate hash. This hash then idenitifies the level.
        var h = hash(json);
        var filename = "level" + h + ".json";

        saveAs(blob, filename);
    }

    if (gui.button("Import")) {
        var json = prompt("Please paste exported json below");

        if (json != null) {
            if(water.import(json)) {
                importMessage = "Import Succeeded!";
            } else {
                importMessage = "Import Failed!";
            }
        }
    }

    gui.textLine(importMessage);


    gui.end(gl, canvas.width, canvas.height);

});

var leftClicked = false;
var rightClicked = false;

shell.on("tick", function () {
    var gl = shell.gl

    // if interacting with the GUI, do not let the mouse control the simulation.
    if (gui.hasMouseFocus())
        return;

    var leftDown = shell.wasDown("mouse-left");
    var rightDown = shell.wasDown("mouse-right");

    if (!leftClicked && leftDown == true) {

        if (editMode.val == EM_REMOVE_CAPSULE) {
            water.removeCapsule(shell.mouse);
        } else if (editMode.val == EM_ADD_CAPSULE) {
            water.addCapsule(shell.mouse, capsuleRadius.val);
        } else if (editMode.val == EM_ADD_EMITTER) {
            water.addEmitter(shell.mouse);
        } else if (editMode.val == EM_REMOVE_EMITTER) {
            editEmitter = null;
            water.removeEmitter(shell.mouse);
        } else if (editMode.val == EM_EDIT_EMITTER) {
            var e = water.selectEmitter(shell.mouse);

            if (e != null) {
                editEmitter = e;
            }

        }

        leftClicked = true;
    }

    if (!rightClicked && rightDown == true) {

        if (editMode.val == EM_ADD_CAPSULE) {
            water.cancelAddCapsule();
        }

        rightClicked = true;
    }

    if (leftDown == false) {
        leftClicked = false;
    }
    if (rightDown == false) {
        rightClicked = false;
    }
});