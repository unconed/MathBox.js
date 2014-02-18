MathBox
=======

![MathBox](https://raw.github.com/unconed/MathBox.js/master/resources/example.png)

MathBox is a library for rendering presentation-quality math diagrams in a browser using WebGL. Built on top of Three.js and tQuery, it provides a clean API to visualize mathematical relationships and animate them smoothly.

MathBox can be operated manually using a tQuery-like API, or used in presentation mode with the included Director. This lets you to feed in a script of actions and step through them one by one, generating an automatic 'rollback' script to allow you to step backwards.

MathBox was initially created for the conference talk "Making Things with Maths" at [Full Frontal 2012](http://2012.full-frontal.org) and is still a work in progress. There are a couple of important functionality gaps, such as labelling being limited to axes and inability to re-use styles easily.

I've only tested thoroughly in Google Chrome, but Firefox seems to work well, with Opera at 90% functionality.

* * *

Examples
--------

* [Viewport, axis, vectors with labeling](http://acko.net/files/mathbox/MathBox.js/examples/Axis.html)
* [Bezier surface (slideshow)](http://acko.net/files/mathbox/MathBox.js/examples/BezierSurface.html)
* [Complex numbers (slideshow)](http://acko.net/files/mathbox/MathBox.js/examples/ComplexNumbers.html)
* [Complex exponentiation 4D -> 3D](http://acko.net/files/mathbox/MathBox.js/examples/ComplexExponentiation.html)
* [Circle equation (x^2 + y^2 = 1) complex 4D -> 3D](http://acko.net/files/mathbox/MathBox.js/examples/ComplexCircle.html)
* [Circle equation (x^2 + y^2 = 1) complex 4D -> 3D (animated projection)](http://acko.net/files/mathbox/MathBox.js/examples/ComplexCircleAlt.html)
* [Distance from a point to a curve](http://acko.net/files/mathbox/MathBox.js/examples/Distance.html)
* [Surface/plane intersection](http://acko.net/files/mathbox/MathBox.js/examples/Intersections.html)
* [Procedural landscape (slideshow)](http://acko.net/files/mathbox/MathBox.js/examples/Landscape.html)
* [Rational function on the projective line](http://acko.net/files/mathbox/MathBox.js/examples/ProjectiveLine.html)
* [Projective viewport transform](http://acko.net/files/mathbox/MathBox.js/examples/ProjectiveView.html)
* [Warping cartesian into cylindrical coordinates](http://acko.net/files/mathbox/MathBox.js/examples/SurfaceWarp.html)
* [Texture mapping a surface](http://acko.net/files/mathbox/MathBox.js/examples/TextureMap.html)
* [Cross-eyed 3D](http://acko.net/files/mathbox/MathBox.js/examples/3D.html)


Try It Out
----------

You can try MathBox online right away. Simply open any of the examples above, or use this [empty template](http://acko.net/files/mathbox/MathBox.js/examples/Empty.html) and open the JavaScript console (Chrome: Ctrl-Alt-J / Cmd-Opt-J). You can interact with MathBox using the `mathbox` object and any of the methods documented below, for example:

```javascript
mathbox.grid();
mathbox.curve({
  id: 'my-curve',
  domain: [-3, 3],
  expression: function (x) { return Math.cos(x); },
})
mathbox.animate('#my-curve', {
  color: 0x20c050,
}, {
  duration: 1000,
});
```

Setup & Usage
-----

MathBox requires its library of GLSL shaders to be included in the DOM. You can either paste in the included `MathBox.glsl.html`, or use the included ThreeBox preloader with your favorite onReady mechanism:

```javascript
DomReady.ready(function() {
  ThreeBox.preload([
    'MathBox.glsl.html',
  ], function () {

    // Do stuff with MathBox here

  });
});
```

Because shaders are loaded separately, *MathBox examples will not run over the file:// protocol*. You must set up a local or remote webserver, or paste MathBox.glsl.html into your HTML file directly, so you can skip the preloading. This is discouraged, as it will make upgrading harder.

MathBox uses the ThreeBox/tQuery boilerplate. Create a MathBox as follows and call .start() to begin rendering.

```javascript
var mathbox = mathBox({
  // ...
}).start();

// or

var element = document.getElementById('my-element');
var mathbox = mathBox(element, {
  // ...
}).start();
```
(which is equivalent to `tQuery.createWorld(options).mathBox(element, options).start()`).

Then you call methods on the `mathbox` object to set up your scene. For example:

```javascript
mathbox
// Cartesian viewport
.viewport({
  type: 'cartesian',
  range: [[-3, 3], [-3, 3]],
  scale: [1, 1],
})
// Apply automatic 300ms fade in/out
.transition(300)

// Add XYZ axes
.axis({
  id: 'x-axis',
  axis: 0,
  color: 0xa0a0a0,
  ticks: 5,
  lineWidth: 2,
  size: .05,
  labels: true,
})
.axis({
  id: 'y-axis',
  axis: 1,
  color: 0xa0a0a0,
  ticks: 5,
  lineWidth: 2,
  size: .05,
  labels: true,
  zero: false,
})
.axis({
  id: 'z-axis',
  axis: 2,
  color: 0xa0a0a0,
  ticks: 5,
  lineWidth: 2,
  size: .05,
  zero: false,
  labels: true,
})
// Grid
.grid({
  id: 'my-grid',
  axis: [0, 2],
  color: 0xc0c0c0,
  lineWidth: 1,
})

// Curve, explicit function
.curve({
  id: 'my-curve',
  domain: [-3, 3],
  expression: function (x) { return Math.cos(x); },
  line: true,
  points: true,
  lineWidth: 2,
})

// Curve, parametric function
.curve({
  id: 'my-circle',
  domain: [-3, 3],
  expression: function (x) { return [Math.sin(x)*2, Math.cos(x)*2]; },
  line: true,
  points: true,
  lineWidth: 2,
})
```

Configuration
----------

All mathbox arguments are optional. The following options are available for configuration in addition to the normal tQuery world options:

```javascript
{
  // Whether to allow mouse control of the camera.
  cameraControls: true, 
  // Override the class to use for mouse controls.
  controlClass: ThreeBox.OrbitControls,
  // Whether to show the mouse cursor.
  // When set to false, the cursor auto-hides after a short delay.
  cursor: true,
  // Whether to track resizing of the containing element.
  elementResize: true,
  // Enable fullscreen mode with 'f' (browser support is buggy)
  fullscreen: true, 
  // Render at scaled resolution, e.g. scale 2 is half the width/height.
  // Fractional values allowed.
  scale: 1, 
  // Enable screenshot taking with 'p'
  screenshot: true, 
  // Show FPS stats in the corner
  stats: true,
}
```

Manipulation
------------

By giving objects an ID, you can manipulate them, using CSS-like selectors, i.e. `#id`. IDs must not contain spaces or punctuation other than `-` and `_`. You can also select all objects of a certain type, e.g. `axis`, `camera`, `grid` or `viewport`.

```javascript
// Get all properties of the X axis object.
var properties = mathbox.get('#x-axis');

// Make all axes red
mathbox.set('axis', { color: 0xff0000 });

// Make Z axis thicker (1000ms animation)
mathbox.animate('#z-axis', { lineWidth: 10 }, { duration: 1000 });

// Clone the Z axis and move it to the side (500ms animation, 200ms delay)
mathbox.clone('#z-axis', { id: 'copy', mathPosition: [0, 1, 0] }, { duration: 500, delay: 200 });
```

You can inspect the scene by calling:

```javascript
var primitives = mathbox.select('*');
```

which returns an array of matching elements (`*`, `#id` or `type`).

Styles
------

All MathBox primitives support the following styles, in addition to their specific properties:

```javascript
{
color: 0x123456, // Color in hex
opacity: 1,      // Opacity
lineWidth: 2,    // Line width for curves and wireframes
pointSize: 5,    // Point size for point rendering

map: null,       // Texture Map (pass in THREE.Texture)
mapColor: 0,     // Strength of texture map color (0 - 1)
mapOpacity: 0,   // Strength of texture map mask (0 - 1)

mathScale: [1, 1, 1],    // Scale transform in math-space
mathRotation: [0, 0, 0], // Euler-angle rotation in math-space
mathPosition: [0, 0, 0], // Position shift in math-space

worldScale: [1, 1, 1],    // Scale transform in world-space
worldRotation: [0, 0, 0], // Euler-angle rotation in world-space
worldPosition: [0, 0, 0], // Position shift in world-space

zIndex: 0.0, // Z bias which pushes the object forward (+) or backward (-)
}
```

Styles are grouped under a separate `style` property for each primitive, e.g.

```javascript
mathbox.get('#x-axis').style.color
```

Note however that styles are converted into and stored as Three.js objects, such as `THREE.Color` and `THREE.Vector3`. You can pass these back into MathBox, in fact, the array-based notation for the styles above is just a convenient shorthand.

However, when using `mathbox.set()` and `mathbox.animate()`, you can omit the `style` key and pass in a flat object mixing both styles and options:

```javascript
mathbox.set('#x-axis', { color: 0xff0000, arrow: false });
mathbox.animate('#y-axis', { opacity: 0.5 });
```

Viewports
---------

Each mathbox scene has an associated viewport. This sets up a specific mathematical coordinate grid. Viewports support morphing between various coordinate grids in a mathematically correct way.

The following viewport types are available:

__Cartesian__  
Regular linear XYZ.

```javascript
.viewport({
  type: 'cartesian',
  range: [[-1, 1], [-1, 1], [-1, 1]], // Range in X, Y, Z
  scale: [1, 1, 1],                   // Scale in X, Y, Z
  rotation: [0, 0, 0],                // Viewport rotation in Euler angles
  position: [0, 0, 0],                // Viewport position in XYZ
})
```

__Projective__  
Applies a 4x4 homogeneous/projective transform.

```javascript
.viewport({
  type: 'projective',
  range: [[-1, 1], [-1, 1], [-1, 1]], // Range in X, Y, Z
  scale: [1, 1, 1],                   // Scale in X, Y, Z
  rotation: [0, 0, 0],                // Viewport rotation in Euler angles
  position: [0, 0, 0],                // Viewport position in XYZ
  projective: [[1, 0, 0, 0],          // 4x4 projective transform
               [0, 1, 0, 0],
               [0, 0, 1, 0],
               [0, 0, 0, 1]],
})
```

__Polar__  
Polar coordinate grid in radians. X is angle, Y is radius, Z is ordinary depth.
Also useful for visualizing complex operations in polar representation.

```javascript
.viewport({
  type: 'polar',
  range: [[-π, π], [-1, 1], [-1, 1]], // Range in X, Y, Z (Angle, Radius, Depth)
  polar: 1,                           // Morph between cartesian (0) and polar (1)
  fold:  1,                           // Fold the angles by this factor
  power: 1,                           // Apply this power to the radius
  helix: 0,                           // Separate the complex plane into a helix by this amount
  scale: [1, 1, 1],                   // Scale in X, Y, Z
  rotation: [0, 0, 0],                // Viewport rotation in Euler angles
  position: [0, 0, 0],                // Viewport position in XYZ
})
```

__Sphere__  
Spherical coordinate grid in radians. X is longitude, Y is latitude, Z is radius.

```javascript
.viewport({
  type: 'sphere',
  range: [[-π, π], [-π/2, π/2], [-1, 1]], // Range in X, Y, Z (Longitude, Latitude, Radius)
  sphere: 1,                              // Morph between cartesian (0) and spherical (1)
  scale: [1, 1, 1],                       // Scale in X, Y, Z
  rotation: [0, 0, 0],                    // Viewport rotation in Euler angles
  position: [0, 0, 0],                    // Viewport position in XYZ
})
```

Note that for 2D viewports, you can just pass in 2 elements rather than 3 for each vector.

Camera
---------
For 3D graphs, you'll often want to move the camera around. For simplicity, the camera is a simple orbiter that always looks at a particular point in space. It uses spherical coordinates (i.e. latitude/longitude) to position itself around the point of interest.

By default the camera is positioned to face the X/Y plane at a distance of 3.5 units, which gives the default viewport a slight margin.

```javascript
.camera({
  orbit: 3.5,        // Distance from the center
  phi: τ/4,          // Longitude angle in XZ, in radians, relative to 0 degrees on the X axis
  theta: 0,          // Latitude angle towards Y, in radians, relative to the XZ plane.
  lookAt: [0, 0, 0], // Point of focus in space
})
```

Primitives
----------

You can add the following items into the scene by invoking these methods:

Axis
```javascript
.axis({
  axis: 0,           // 0 = X, 1 = Y, 2 = Z
  offset: [0, 0, 0], // Shift axis position
  n: 2,              // Number of points on axis line (set to higher for curved viewports)
  ticks: 10,         // Approximate number of ticks on axis (ticks are spaced at sensible units).
  tickUnit: 1,       // Base unit for ticks. Set to π e.g. to space ticks at multiples of π.
  tickScale: 10,     // Integer denoting the base for recursive division. 2 = binary, 10 = decimal
  arrow: true,       // Whether to include an arrow on the axis
  size: .07,         // Size of the arrow relative to the stage
})
```

Bezier Curve
```javascript
.bezier({
  n: 64,                         // Number of points
  domain: [0, 1],                // Domain, expressed in interpolation space
  data: null,                    // Array of control points, each an array of 2 or 3 elements
  order: 3,                      // Order of bezier curve (1-3)
  expression: function (x, i) {  // Live expression for data points.
    return 0;                    // Return single value or array of 2/3 elements.
  },
  points: false,                 // Whether to draw points
  line: true,                    // Whether to draw lines
})
```

Bezier Surface
```javascript
.bezierSurface({
  n: [ 64, 64 ],                       // Number of points in each direction
  domain: [[0, 1], [0, 1]],            // X/Y Domain in interpolation space
  data: null,                          // Array of array of control points, each an array of 2 or 3 elements
  order: 3,                            // (unsupported, must be 3)
  expression: function (x, y, i, j) {  // Live expression for data points.
    return 0;                          // Return single value or array of 2/3 elements.
  },
  points: false,                       // Whether to draw points
  line: false,                         // Whether to draw wireframe lines
  mesh: true,                          // Whether to draw a solid mesh
  doubleSided: true,                   // Whether the mesh is double sided
  flipSided: false,                    // Whether to flip a single sided mesh
  shaded: true,                        // Whether to shade the surface
})
```

Curve
```javascript
.curve({
  n: 64,                         // Number of points
  domain: [0, 1],                // Input domain
  data: null,                    // Array of data points, each an array of 2 or 3 elements
  expression: function (x, i) {  // Live expression for data points.
    return 0;                    // Return single value or array of 2/3 elements.
  },
  points: false,                 // Whether to draw points
  line: true,                    // Whether to draw lines
})
```

Grid
```javascript
.grid({
  axis: [ 0, 1 ],         // Primary and secondary grid axis (0 = X, 1 = Y, 2 = Z)
  offset: [0, 0, 0],      // Shift grid position
  show: [ true, true ],   // Show horizontal and vertical direction
  n: 2,                   // Number of points on grid line (set to higher for curved viewports)
  ticks: [ 10, 10 ],      // Approximate number of ticks on axis (ticks are spaced at sensible units).
  tickUnit: [ 1, 1],      // Base unit for ticks on each axis. Set to π e.g. to space ticks at multiples of π.
  tickScale: [ 10, 10 ],  // Integer denoting the base for recursive division on each axis. 2 = binary, 10 = decimal
})
```

Surface
```javascript
.surface({
  n: [ 64, 64 ],                         // Number of points in each direction
  domain: [[0, 1], [0, 1]],              // X/Y Input domain
  data: null,                            // Array of array of data points, each an array of 2 or 3 elements
  expression: function (x, y, i, j) {    // Live expression for data points.
    return 0;                            // Return single value or array of 2/3 elements.
  },
  points: false,                         // Whether to draw points
  line: false,                           // Whether to draw wireframe lines
  mesh: true,                            // Whether to draw a solid mesh
  doubleSided: true,                     // Whether the mesh is double sided
  flipSided: false,                      // Whether to flip a single sided mesh
  shaded: true,                          // Whether to shade the surface
})
```

Vector
```javascript
.vector({
  n: 1,                              // Number of vectors
  data: null,                        // Array of alternating start and end points,
                                     // each an array of 2 or 3 elements
  expression: function (i, end) {    // Live expression for start/end points.
    return 0;                        // Return single value or array of 2/3 elements.
  },
  line: true,                        // Whether to draw vector lines
  arrow: true,                       // Whether to draw arrowheads
  size: .07,                         // Size of the arrowhead relative to the stage
})
```

Contributions
-------------

MathBox created by Steven Wittens - http://acko.net/

Contributors:

* So8res (Nate Soares)
* johan (Johan Sundström)
* waldir (Waldir Pimenta)
* fourplusone (Matthias Bartelmeß)
* hugoferreira (Hugo Ferreira)
