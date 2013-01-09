/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.CrosseyedEffect = function ( renderer ) {

  this.domElement = renderer.domElement;

	// API

	this.separation = .065;

	// internals

	var _width, _height;

	var _cameraL = this.cameraL = new THREE.PerspectiveCamera();

	var _cameraR = this.cameraR = new THREE.PerspectiveCamera();

	// initialization

  this.renderer = renderer;
	renderer.autoClear = false;

  this.setClearColorHex = function () {
    renderer.setClearColorHex.apply(renderer, arguments);
  },

	this.setSize = function ( width, height ) {

		_width = width / 2;
		_height = height;

		renderer.setSize( width, height );

	};

	this.render = function ( scene, camera ) {

    // not sure why camera lags. oh well

		renderer.clear();

		renderer.setViewport( 0, 0, _width, _height );
		renderer.render( scene, _cameraL );

		renderer.setViewport( _width, 0, _width, _height );
		renderer.render( scene, _cameraR, false );


		// left

		_cameraL.fov = camera.fov;
		_cameraL.aspect = 0.5 * camera.aspect;
		_cameraL.near = camera.near;
		_cameraL.far = camera.far;

		_cameraL.matrix.identity();
    _cameraL.matrix.multiplySelf(camera.matrix);
    _cameraL.matrix.translate({ x: this.separation, y: 0, z: 0});
		_cameraL.matrixAutoUpdate = false;
    _cameraL.matrixWorldNeedsUpdate = true;

    _cameraL.updateMatrixWorld();
    _cameraL.updateProjectionMatrix();

		// right

		_cameraR.near = camera.near;
		_cameraR.far = camera.far;

		_cameraR.matrix.identity();
    _cameraR.matrix.multiplySelf(camera.matrix);
    _cameraR.matrix.translate({ x: -this.separation, y: 0, z: 0});
		_cameraR.matrixAutoUpdate = false;
    _cameraR.matrixWorldNeedsUpdate = true;

    _cameraR.updateMatrixWorld();
		_cameraR.projectionMatrix.copy(_cameraL.projectionMatrix);

	};

};
