/**
 * MathBox.js. Math plotting tool for three.js / webgl.
 */

// Math!
var π = Math.PI,
    τ = π * 2;

// Check dependencies.
(function (deps) {
  for (var i in deps) {
    if (!window[i]) throw "Error: MathBox requires " + deps[i];
  }
})({
  'THREE': 'Three.js',
  'tQuery': 'tQuery.js (bundle)',
  'ThreeBox': 'ThreeBox.js',
  'ThreeRTT': 'ThreeRTT.js'//,
});

// Namespace.
window.MathBox = {};

// Shortcut static call.
window.mathBox = function (element, options) {
  // Omit element (use body)
  if (element && !(element instanceof Node)) {
    options = element;
    element = null;
  }

  return tQuery.createWorld(options).mathBox(element, options);
};

// Fetch shader from <script> tag by id
MathBox.getShader = function (id) {
  var elem = document.getElementById(id);
  return elem && (elem.innerText || elem.textContent) || id;
};

Math.sign = function (x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
};
