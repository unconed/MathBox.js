/**
 * Wrapper around ThreeBox camera to allow attribute animations.
 */
MathBox.CameraProxy = function (world, options) {

  this.set({
    orbit: options.orbit === undefined ? 3.5 : options.orbit,
    phi: options.phi === undefined ? τ/4 : options.phi,
    theta: options.theta || 0,
    lookAt: options.lookAt || [0, 0, 0],
  });

  this.singleton = 'camera';

  var controls = this.controls = world.getCameraControls()
                     || ThreeBox.OrbitControls.bind(world.tCamera(), null, this.get());

  this.on('change', function (changed) {
    _.each(changed, function (value, key) {
      if (key == 'lookAt') return;
      controls[key] = value;
    });

    if (changed.lookAt) {
      controls.lookAt.set.apply(controls.lookAt, changed.lookAt);
    }
    controls.update();
  });
  controls.update();

  this.update = function () {

    this.set({
      orbit: controls.orbit,
      phi: controls.phi,
      theta: controls.theta,
    }, null, true);

    var l = this.get('lookAt');
    l[0] = controls.lookAt.x;
    l[1] = controls.lookAt.y;
    l[2] = controls.lookAt.z;

  };
}

MathBox.Attributes.mixin(MathBox.CameraProxy);