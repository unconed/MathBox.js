/**
 * Arrowhead, constant screen-space size.
 */
MathBox.Renderable.ArrowHead = function (from, to, options, style) {
  this.from = from;
  this.to = to;

  MathBox.Renderable.call(this, options, style);
};

MathBox.Renderable.ArrowHead.geometry = new THREE.CylinderGeometry(.33, 0, 1, 16, 1);

MathBox.Renderable.ArrowHead.prototype = _.extend(new MathBox.Renderable(null), {

  defaults: function () {
    return {
      offset: 0,
      absolute: true,
      size: .1//,
    };
  },

  make: function (materials) {
    var options = this.get();

    // Make material.
    var material = this.material = materials.generic(options);

    this._from = new THREE.Vector3();
    this._to = new THREE.Vector3();

    this.diff = new THREE.Vector3();
    this.bi = new THREE.Vector3();
    this.normal = new THREE.Vector3(0, 0, 1);

    // Make cone mesh
    var geometry = this.geometry = MathBox.Renderable.ArrowHead.geometry;
    this.object = new THREE.Mesh(geometry, material);

    // Refresh material uniforms.
    this.refresh();
  },

  isVisible: function () {
    return this.visible && (this.style.get('opacity') > 0);
  },

  adjust: function (viewport) {
    var options = this.get();
    var offset = options.offset;

    // Calculate arrow in world space
    var from = this._from.copy(this.from);
    var to = this._to.copy(this.to);
    this.mathTransform.multiplyVector3(from);
    this.mathTransform.multiplyVector3(to);
    viewport.to(from);
    viewport.to(to);

    // Calculate axis of arrowhead.
    var diff = this.diff.sub(from, to);
    if (diff.length() < .001) {
      this.object.visible = false;
      return;
    }
    else {
      this.object.visible = this.visible;
    }

    diff = diff.normalize();

    // Prepare 'random' normal
    this.normal.x = this.diff.y + .1;
    this.normal.y = this.diff.z + .2;
    this.normal.z = this.diff.x + .3;
    this.normal.normalize();

    // Prepare binormal
    var bi = this.bi.cross(this.normal, this.diff).normalize();

    // Renormalize axes.
    var normal = this.normal.cross(this.bi, this.diff);

    // Prepare object matrix to place arrowhead
    var size = options.size;
    var matrix = new THREE.Matrix4(
      bi.x, diff.x, normal.x, to.x,
      bi.y, diff.y, normal.y, to.y,
      bi.z, diff.z, normal.z, to.z,
      0, 0, 0, 1//,
    )
    .scale(new THREE.Vector3(size, size, size));

    // Add arrowhead transform before object matrix
    this.object.updateMatrix();
    this.object.matrix.multiplySelf(matrix);

    // Move cone down so tip is at 0,0,0
    matrix.identity().setPosition({ x: 0, y: 0.5 - offset, z: 0 });
    this.object.matrix.multiplySelf(matrix);

    // Override object matrix
    this.object.matrixAutoUpdate = false;
    this.object.matrixWorldNeedsUpdate = true;

    MathBox.Renderable.prototype.adjust.call(this, viewport);
  },

});

