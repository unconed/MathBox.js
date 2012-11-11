/**
 * World.mathBox() – Create a mathbox-capable renderer inside a DOM element.
 */
tQuery.World.register('mathBox', function (element, options) {
  element = element || document.body;

  // Create threebox scene for WebGL
  this.threeBox(element, options);

  // Create CSS 3D overlay for labels / annotations
  var cssOverlay = new Acko.CSS3DRenderer();
  element.appendChild(cssOverlay.domElement);
  cssOverlay.domElement.style.position = 'absolute';
  cssOverlay.domElement.style.left = 0;
  cssOverlay.domElement.style.top = 0;
  cssOverlay.domElement.style.right = 0;
  cssOverlay.domElement.style.bottom = 0;

  // Auto-size overlay
  this.on('resize', function (width, height) {
    cssOverlay.setSize(width, height);
  });

  // Create mathbox stage
  var mathbox = new MathBox.Stage(options, this, cssOverlay);
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

