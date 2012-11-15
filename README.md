MathBox
=======

![MathBox](https://raw.github.com/unconed/MathBox.js/master/resources/example.png)

MathBox is a library for rendering presentation-quality math diagrams in a browser using WebGL. Built on top of Three.js and tQuery, it provides a clean API to visualize mathematical relationships and animate them smoothly.

MathBox can be operated manually using a tQuery-like API, or used in presentation mode with the included Director. This lets you to feed in a script of actions and step through them one by one, generating an automatic 'rollback' script to allow you to step backwards.

MathBox was initially created for the conference talk "Making Things with Maths" at [Full Frontal 2012](http://2012.full-frontal.org) and is still a work in progress. There are a couple of important functionality gaps, such as a complete lack of axis and point labelling and inability to re-use styles consistently.

I've only tested thoroughly in Google Chrome, but Firefox seems to work well, with Opera at 90% functionality.

* * *

Usage
-----

MathBox requires its library of GLSL shaders to be included in the DOM. You can either paste in the included `shaders/snippets.glsl.html`, or use the ThreeBox preloader with your favorite onReady mechanism:

```
DomReady.ready(function() {
  ThreeBox.preload([
    '../shaders/snippets.glsl.html',
  ], function () {
    ...
  });
});
```

MathBox uses the ThreeBox tQuery boilerplate. Create a MathBox as follows and call .start() to begin rendering. See [ThreeBox.js](https://github.com/unconed/ThreeBox.js) for a list of available options.

```
var mathbox = mathBox({
  ...
}).start();
```

Styles
------

All MathBox primitives support the following styles:

```
{
color: 0x123456, // Color in hex
opacity: 1,      // Opacity
lineWidth: 2,    // Line width for curves and wireframes
pointSize: 5,    // Point size for point rendering

mathScale: [1, 1, 1],    // Scale transform in math-space
mathRotation: [0, 0, 0], // Euler-angle rotation in math-space
mathPosition: [0, 0, 0], // Position shift in math-space

worldScale: [1, 1, 1],    // Scale transform in world-space
worldRotation: [0, 0, 0], // Euler-angle rotation in world-space
worldPosition: [0, 0, 0], // Position shift in world-space

zIndex: 0.0, // Z bias which pushes the object forward (+) or backward (-)
}
```

Primitives
----------

You can add the following items into the scene by invoking methods on the mathbox object:

Axis
```
.axis({
  axis: 0,           // 0 = X, 1 = Y, 2 = Z
  offset: [0, 0, 0], // Shift axis position
  n: 2,              // Number of points on axis line (set to higher for curved viewports)
  ticks: 10,         // Approximate number of ticks on axis (ticks are spaced at sensible units).
  tickBase: 1,       // Base unit for ticks. Set to π e.g. to space ticks at multiples of π.
  arrow: true,       // Whether to include an arrow on the axis
  size: .07,         // Size of the arrow relative to the stage
});
```

Bezier Curve
```
.bezier({
  n: 64,                         // Number of points
  domain: [0, 1],                // Domain, expressed in interpolation space
  data: null,                    // Array of control points, each an array of 2 or 3 elements
  order: 3,                      // Order of bezier curve (1-3)
  expression: function (x, i) {  // Live expression for data points. Return single value or array of 2/3 elements.
    return 0;
  },
  points: false,                 // Whether to draw points
  line: true,                    // Whether to draw lines
})
```

Bezier Surface
```
.beziersurface({
  n: [ 64, 64 ],                       // Number of points in each direction
  domain: [[0, 1], [0, 1]],            // X/Y Domain in interpolation space
  data: null,                          // Array of control points, each an array of 2 or 3 elements
  order: 3,                            // (unsupported, must be 3)
  expression: function (x, y, i, j) {  // Live expression for data points. Return single value or array of 2/3 elements.
    return 0;
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
```
.curve({
  n: 64,                         // Number of points
  domain: [0, 1],                // Input domain
  data: null,                    // Array of data points, each an array of 2 or 3 elements
  expression: function (x, i) {  // Live expression for data points. Return single value or array of 2/3 elements.
    return 0;
  },
  points: false,                 // Whether to draw points
  line: true,                    // Whether to draw lines
})
```

Grid
```
.grid({
  axis: [ 0, 1 ],         // Primary and secondary grid axis (0 = X, 1 = Y, 2 = Z)
  offset: [0, 0, 0],      // Shift grid position
  show: [ true, true ],   // Show horizontal and vertical direction
  n: 2,                   // Number of points on grid line (set to higher for curved viewports)
  ticks: [ 10, 10 ],      // Approximate number of ticks on axis (ticks are spaced at sensible units).
  tickBase: [ 1, 1 ],     // Base unit for ticks. Set to π e.g. to space ticks at multiples of π.
});
```

Surface
```
.surface({
  n: [ 64, 64 ],                         // Number of points in each direction
  domain: [[0, 1], [0, 1]],              // X/Y Input domain
  data: null,                            // Array of data points, each an array of 2 or 3 elements
  expression: function (x, y, i, j) {    // Live expression for data points. Return single value or array of 2/3 elements.
    return 0;
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
```
.vector({
  n: 1,                              // Number of vectors
  data: null,                        // Array of start and end points, each an array of 2 or 3 elements
  expression: function (i, end) {    // Live expression for start/end points. Return single value or array of 2/3 elements.
    return 0;
  },
  points: false,                     // Whether to draw points
  line: false,                       // Whether to draw wireframe lines
  mesh: true,                        // Whether to draw a solid mesh
  doubleSided: true,                 // Whether the mesh is double sided
  flipSided: false,                  // Whether to flip a single sided mesh
  shaded: true,                      // Whether to shade the surface
  size: .07,                         // Size of the arrow relative to the stage
})
```

* * *

Steven Wittens - http://acko.net/
