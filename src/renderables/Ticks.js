/**
 * Tickmarks on an axis, constant screen space size.
 */
MathBox.Renderable.Ticks = function (points, signs, epsilon, options, style) {
  this.points = points;
  this.signs = signs;
  this.epsilon = epsilon;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Ticks.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      dynamic: false,
      absolute: false,
      size: .1//,
    };
  },

  make: function (materials) {
    var options = this.get(),
        points = this.points,
        signs = this.signs;

    // Prepare material with custom position shader
    var materialOptions = {
      type: 'line',
      shaders: {
        position: function (f, m) {
          // Add snippet to load vertex position.
          m.position(f, options);

          // Calculate position and position + epsilon
          f.snippet('tickVertexSplit');

          // Transform positions to viewport
          f.group();
            // Transform position
            m.viewport(f);
          f.next();
            // Transform position + epsilon
            m.viewport(f);
          f.combine();

          // Transform both vectors into tick vertex
          f.snippet('tickVertexJoin');
        },
      },
    };
    var material = this.material = materials.generic(materialOptions);

    // Prepare geometry
    var geometry = this.geometry = new THREE.Geometry();
    geometry.vertices = points;

    // Prepare object3d
    var object = new THREE.Line(geometry, material, THREE.LinePieces);
    this.object = object;

    // Refresh material uniforms.
    this.refresh();
  },

  adjust: function (viewport) {
    var options = this.get();
    this.material && this.material.applyAttributes({
      tickSign: this.signs,
    });
    this.material && this.material.applyUniforms({
      tickEpsilon: this.epsilon,
      tickSize: options.size//,
    });

    if (options.dynamic) {
      this.material.attributes.tickSign.needsUpdate = true;
      this.geometry.verticesNeedUpdate = true;
    }

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  }//,

});
