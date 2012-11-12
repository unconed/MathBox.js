/**
 * Generic renderable of vertices for points/lines/surfaces.
 */
MathBox.Renderable.Mesh = function (points, options, style) {
  this.points = points;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.Mesh.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      type: 'points',
      doubleSided: true,
      dynamic: false,
      absolute: false,
      strip: true,
      shaders: {},
    };
  },

  make: function (materials) {
    var options = this.get(),
        type = options.type,
        strip = options.strip,
        shaders = options.shaders;

    // Decide on THREE renderable.
    var klass = {
      points: THREE.ParticleSystem,
      line: THREE.Line,
      mesh: THREE.Mesh//,
    }[type];
    if (!klass) throw "Invalid Mesh type '"+ type +"'";

    // Prepare material / shadergraph
    var material = this.material = materials.generic(options);

    // Prepare geometry
    var geometry, points = this.points;
    if (points instanceof Array) {
      // Default, vertices-only
      geometry = this.geometry = new THREE.Geometry();
      geometry.vertices = this.points;
    }
    else {
      // Pass through
      geometry = this.geometry = points;
    }
    geometry.dynamic = options.dynamic;

    // Prepare object3d
    var object;
    switch (type) {
      case 'line':
        object = new THREE.Line(geometry, material, strip ? THREE.LineStrip : THREE.LinePieces);
        break;
      default:
        object = new klass(geometry, material);
        break;
    }
    this.object = object;

    // Refresh material uniforms.
    this.refresh();
  },

  adjust: function (viewport) {
    if (this.get().dynamic) {
      this.geometry.verticesNeedUpdate = true;
    }
    MathBox.Renderable.prototype.adjust.call(this, viewport);
  }//,

});
