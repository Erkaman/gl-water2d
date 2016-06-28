# 2D Smoothed Liquid Simulation in WebGL

TODO: this README is still under construction!

This project is an implementation of 2D liquid simulation using  Smoothed Particle Hydrodynamics in WebGL.
You can see some simulations made using this implementation below


<table><thead>
</thead><tbody>
<tr>
<td align="center"><img src="images/container.gif" alt="Container" width="268" height="336"></td>
<td align="center"><img src="images/obstacles.gif" alt="Obstacles" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="json/obstacles.json">container.json</a> </td>
<td align="center"> <a href="json/obstacles.json">obstacles.json</a> </td>
</tr>


<tr>
<td align="center"><img src="images/red.gif" alt="Red" width="268" height="336"></td>
<td align="center"><img src="images/ramps.gif" alt="Obstacles" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="json/red.json">red.json</a> </td>
<td align="center"> <a href="json/ramps.json">ramps.json</a> </td>
</tr>


<tr>
<td align="center"><img src="images/simple.gif" alt="Simple" width="268" height="336"></td>
<td align="center"><img src="images/sprinkler.gif" alt="Sprinkler" width="268" height="336"></td>
</tr>
<tr>
<td align="center"> <a href="json/simple.json">simple.json</a> </td>
<td align="center"> <a href="json/sprinkler.json">sprinkler.json</a> </td>
</tr>

</tbody></table>

[You can see the full simulations in this video](https://www.youtube.com/watch?v=SHvIOMl7-pQ).
You can export the JSON files into the corresponding demo to run the simulations yourself. **But note that these simulations were renderered offline**, and they will probably not run in real-time for you. Note that the implementation is not very efficient, and using too many particles(about more than 1500) will slow down the GUI and the entire simualation.
