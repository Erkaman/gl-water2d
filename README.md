# 2D Liquid Simulation in WebGL

This project is an implementation of 2D liquid simulation using  Smoothed Particle Hydrodynamics in WebGL.
[Here is a demo](http://erkaman.github.io/gl-water2d/demo/ ). You can use the demo to place out emitters and capsules and create liquid simulations. 
You can see some simulations made using the demo below


<table><thead>
</thead><tbody>
<tr>
<td align="center"><img src="images/container.gif" alt="Container" width="268" height="336"></td>
<td align="center"><img src="images/obstacles.gif" alt="Obstacles" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/container.json">container.json</a> </td>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/obstacles.json">obstacles.json</a> </td>
</tr>


<tr>
<td align="center"><img src="images/red.gif" alt="Red" width="268" height="336"></td>
<td align="center"><img src="images/ramps.gif" alt="Obstacles" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/red.json">red.json</a> </td>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/ramps.json">ramps.json</a> </td>
</tr>


<tr>
<td align="center"><img src="images/simple.gif" alt="Simple" width="268" height="336"></td>
<td align="center"><img src="images/sprinkler.gif" alt="Sprinkler" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/simple.json">simple.json</a> </td>
<td align="center"> <a href="https://raw.githubusercontent.com/Erkaman/gl-water2d/master/json/sprinkler.json">sprinkler.json</a> </td>
</tr>

</tbody></table>

[You can see the full simulations in this video](https://www.youtube.com/watch?v=SHvIOMl7-pQ).
You can import the JSON files into the demo to run the simulations yourself, by copying the json and pressing the import button(if you are having problems, see the FAQ!). **But note that these simulations were renderered offline**, and they will probably not run in real-time for you. Note that the implementation is not very efficient, and using too many particles(about more than 1500) will slow down the GUI and the entire simulation.

## Brief Technical Details

The water simulation is based on the paper [Particle-based Viscoelastic Fluid Simulation](http://www.ligum.umontreal.ca/Clavet-2005-PVFS/pvfs.pdf), which describes a variaton of Smoothed Particle Hydrodynamics. But not all details of the paper are implemented. The implemented parts are Double Density Relaxation(section 4), and Viscosity Impulses(section 5.3).

The environment is all represented by capsulses. This simplifies the code much, because it is trivial to check for collision with a capsule. To handle the collision, we use the formulas derived in [section 4.4.2.2 of"Lagrangian Fluid Dynamics Using Smoothed Particle Hydrodynamics"](http://image.diku.dk/projects/media/kelager.06.pdf#page=33).

People wanting an easy-to-read introduction to the field of fluid simulation are referred to ["Fluid Simulation -Siggraph 2007 Course Notes"](https://www.cs.ubc.ca/~rbridson/fluidsimulation/fluids_notes.pdf). People wanting an introduction to Smoothed Particle Hydrodynamics are referred to ["Lagrangian Fluid Dynamics Using Smoothed Particle Hydrodynamics"](http://image.diku.dk/projects/media/kelager.06.pdf).

## How to Record Offline Simulations

The below instructions are what works for me. But I have only tested this on my Mac, so this may or may not work for you. If you can't get it to work no matter what, make I pull request and I will help you.

If you press the record button, you will start recording the simulation. This functionality uses the FileSystems API, **so it will only work on Chrome!** 

Once you press record, the program will start saving the frames of the simulation to some place on your filesystem. On my Mac, this location is `/Users/eric/Library/Application Support/Google/Chrome/Default/File System`. On windows, this location appears to be `C:\Users\Eric\AppData\Local\Google\Chrome\User Data\Default\File System`. At this location, there are folders named `001`, `002`, and so on. In one of these folders(probably the most newly created one) the recorded frames can be found.
In that folder, enter the folder `p/`. In this folder, the recorded frames are saved in the TGA format, and they are spread out over directories named `00`, `01`, and so on. You will need to gather the frames of these folders into a single folder. 

I provide the script [gather.py](scripts/gather.py) for gathering up all the files in one folder. Set the variables `in_path` and `out_path` to specify the output and input folders, run the script, and if it works, it will copy all the frames to a single folder. In the process, it will convert the `.tga` files to `.png` files using `imagemagick/graphicsmagick`, because this makes it much faster to later convert the frames to a video.

If you have `ffmpeg` installed, you can now easily make a video. Go to `out_path` and run the command

```Bash
ffmpeg -framerate 50 -i frame%08d.png -c:v libx264 -r 50 -pix_fmt yuv420p out.mp4
```

and it will create a video in `out.mp4`. If you want a GIF, you can make it using imagemagick by doing

`convert -delay 2 -loop 0 frame*.png out.gif`

or by using graphicsmagick

`gm convert -delay 2 -loop 0 frame*.png out.gif`

but be aware that this will take quite a while!

If you want to record another simulation after recording a first one, **be sure to clear the cache before you do so!** To do this, go to [chrome://settings/cookies](chrome://settings/cookies) and delete the site data for the demo. The entry you should delete is named something like `erkaman.github.io`. If you do not clear the cache, the numbering of the frames of the new simulation will not start from zero, and  `gather.py` will not handle this special case for you.


## Build

To run the demo locally on your computer, first change your directory to the directory of the project, then run

```bash
npm install
```

To then run the demo, do

```bash
npm start
```


## FAQ

<b>Why does it say "Import Failed" when I try to import some json?</b>

This means your json is invalid. Check the javascript console for more detailed error messages. 

The most probable reason for failure is that you accidentaly got some garbage characters in the beginning of your json when your copied it(you can check this in a hex-editor). Be careful when copying. 
