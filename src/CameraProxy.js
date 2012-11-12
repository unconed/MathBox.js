/**
 * Wrapper around ThreeBox camera to allow attribute animations.
 */
MathBox.CameraProxy = function (world, options) {

  this.set({
    orbit: options.orbit || 3.5,
    phi: options.phi || τ/4,
    theta: options.theta || 0,
    lookAt: [0, 0, 0],
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
}

MathBox.Attributes.mixin(MathBox.CameraProxy);