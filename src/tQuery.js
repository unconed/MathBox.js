/**
 * World.mathBox() – Create a mathbox-capable renderer inside a DOM element.
 */
tQuery.World.registerInstance('mathBox', function (element, options) {
  element = element || document.body;

  // Create threebox scene for WebGL
  this.threeBox(element, options);

  // Create overlay for labels / annotations
  var overlay = new MathBox.Overlay();
  element.appendChild(overlay.domElement);
  overlay.domElement.style.position = 'absolute';
  overlay.domElement.style.left = 0;
  overlay.domElement.style.top = 0;
  overlay.domElement.style.right = 0;
  overlay.domElement.style.bottom = 0;

  // Create mathbox stage
  var mathbox = new MathBox.Stage(options, this, overlay);
  var callback = function () {
    mathbox.update();
  };
  this.tScene().add(mathbox);

  // White background
	this._renderer.setClearColorHex( 0xFFFFFF, 1 );

  // Hook into rendering loop
  mathbox.unhook = function () {
    this.loop().unhookPreRender(callback)
  }
  this.loop().hookPreRender(callback);

  if (!options.cameraControls) {
    var camera = this.tCamera();

    camera.position.x = 0;
    camera.position.y = 0;
    camera.position.z = options.orbit;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }

  return mathbox;
});

