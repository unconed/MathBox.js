/**
 * MathBox Overlay
 *
 * Positions 2D labels on top of the scene and takes care of overlap.
 */
MathBox.Overlay = function () {
  var element = this.domElement = document.createElement('div');

  element.className = 'mathbox-overlay';

  this.sprites = [];
  this.v = new THREE.Vector3();
}

MathBox.Overlay.prototype = {

  size: function (width, height) {
    this.width = width;
    this.height = height;

    this.domElement.style.width = width +'px';
    this.domElement.style.height = height +'px';
  },

  add: function (object) {
    if (this.sprites.indexOf(object) != -1) return;
    this.sprites.push(object);

    if (!object.element.parentNode) {
      this.domElement.appendChild(object.element);
    }

    _.each(object.children, function (child) {
      this.add(child);
    }.bind(this))
  },

  remove: function (object) {
    var index;
    if ((index = this.sprites.indexOf(object)) == -1) return;
    this.sprites.splice(index, 1);

    if (object.element.parentNode) {
      object.element.parentNode.removeChild(object.element);
    }

    _.each(object.children, function (child) {
      this.remove(child);
    }.bind(this))
  },

  update: function (camera) {
		this.fov = 0.5 / Math.tan( camera.fov * Math.PI / 360 ) * this.height;

    // Iterate over individual objects
    _.each(this.sprites, function (sprite) {
      this._update(sprite, camera);
    }.bind(this));
  },

  _update: function (object, camera) {
    // Project into camera space
    var v = this.v;
    v.copy(object.position);
    camera.matrixWorldInverse.multiplyVector3(v);

    // Project in 3D and convert to pixels
    var x = -(v.x / v.z) * this.fov + this.width * .5;
    var y = (v.y / v.z) * this.fov + this.height * .5;

    // Round to avoid pixel fuzzyness
    object.element.style.left = Math.round(x) + 'px';
    object.element.style.top = Math.round(y) + 'px';

    _.each(object.children, function (child) {
      this._update(child, camera);
    }.bind(this));
  },

};

MathBox.Sprite = function (element) {
  this.element = element;

  element.style.position = 'absolute';
  element.style.left = 0;
  element.style.top = 0;

  THREE.Object3D.call(this);
}

MathBox.Sprite.prototype = _.extend(new THREE.Object3D(), {
  
});