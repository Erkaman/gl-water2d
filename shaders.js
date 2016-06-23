

module.exports.vert = `
precision mediump float;
 
attribute vec2 aPosition;
attribute vec4 aColor;
attribute vec2 aUv;
uniform mat4 uProj;
varying vec4 vColor;
varying vec2 vUv;
 
void main() {
  gl_Position = uProj * vec4(aPosition, 0, 1);
  vColor = aColor;
  vUv = aUv;
}
`

module.exports.frag = `
precision mediump float;
 
varying vec4 vColor;
varying vec2 vUv;
uniform sampler2D uTex;
void main() {
  vec4 sample = texture2D(uTex, vUv);
  //gl_FragColor = vec4(vColor.xyz * sample.xyz, sample.x * vColor.a );
  
  
  if(vUv.x == 2.0) {
 
  gl_FragColor = vec4(vColor.xyz ,1.0 );
  
  } else {
 gl_FragColor = vec4(sample.xyz * vColor.xyz, sample.a);
 
  }
  
  
 
}
`