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
  this.q = new THREE.Vector3();
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

    // Iterate over individual objects for update
    _.each(this.sprites, function (sprite) {
      this._update(sprite, camera);
    }.bind(this));

    // Iterate over individual objects for measurement
    _.each(this.sprites, function (sprite) {
      this._measure(sprite, camera);
    }.bind(this));

    // Iterate over individual objects for measurement
    _.each(this.sprites, function (sprite) {
      this._vis(sprite, camera);
    }.bind(this));
  },

  _measure: function (object, camera) {
    // Measure sprites
    if (object.measure) {
      var element = object.element;
      object.width = element.offsetWidth;
      object.height = element.offsetHeight;
      object.measure = false;
    }
  },

  _vis: function (object, camera) {
    // If already hidden, ignore
    if (!object.render) return;
    if (!object.width && !object.height) return;

    // Check visibility for each sprite relative to other visibles
    var ox1 = object.left,
        oy1 = object.top,
        ox2 = object.width + ox1,
        oy2 = object.height + oy1;

    // Iterate only sprites after this one
    found = false;
    _.each(this.sprites, function (sprite) {
      if (sprite === object) {
        found = true;
        return;
      }
      if (!found) return;
      if (!sprite.render) return;

      var sx1 = sprite.left,
          sy1 = sprite.top,
          sx2 = sprite.width + sx1,
          sy2 = sprite.height + sy1;

      // Check for overlap in X or Y
      if (ox2 < sx1 || ox1 > sx2) return;
      if (oy2 < sy1 || oy1 > sy2) return;

      // Hide
      sprite.element.style.display = 'none';
      sprite.render = false;
    });
  },

  _update: function (object, camera) {
    var v = this.v,
        q = this.q,
        epsilon = 0.01;

    var render = object.render;

    // Check visibility
    var visible = object.visible, parent = object.parent;
    while (visible && parent) {
      visible = visible && parent.visible;
      parent = parent.parent;
    }
    object.render = visible && (object.opacity > 0);

    if (!object.render) {
      if (render || render === null) {
        object.element.style.display = 'none';
      }
      return;
    }
    else if (!render) {
      object.element.style.display = 'block';
    }

    // Transform into camera space
    v.copy(object.position);
    camera.matrixWorldInverse.multiplyVector3(v);

    // Project to 2D and convert to pixels
    var x = -(v.x / v.z) * this.fov + this.width  * .5;
    var y =  (v.y / v.z) * this.fov + this.height * .5;

    // Add spacer
    if (object.distance) {
      // Add tangent and project again
      q.copy(object.tangent).multiplyScalar(epsilon);
      q.addSelf(object.position);
      camera.matrixWorldInverse.multiplyVector3(q);

      // Find difference and scale it
      var sign = object.distance > 0 ? 1 : -1;
      q.subSelf(v);
      q.z = 0;
      q.normalize().multiplyScalar(object.distance);
      x += Math.abs(q.y) * sign;
      y += Math.abs(q.x) * sign;
    }

    // Round to avoid pixel fuzzyness
    x = Math.round(x);
    y = Math.round(y);

    // Set position
    if (object.left !== x) {
      object.left = x;
      object.element.style.left = x + 'px';
    }
    if (object.top !== y) {
      object.top = y;
      object.element.style.top  = y + 'px';
    }

    // Set opacity
    if (object.lastOpacity !== object.opacity) {
      object.element.style.opacity = object.opacity;
      object.lastOpacity = object.opacity;
    }

  },

};

MathBox.Sprite = function (element, tangent, distance) {
  this.element = element;
  this.tangent = tangent || new THREE.Vector3(1, 0, 0);
  this.distance = distance || 0;
  this.width = 0;
  this.height = 0;
  this.visible = true;
  this.measure = true;
  this.render = null;
  this.content = '';

  this.lastLeft = null;
  this.lastTop = null;
  this.lastOpacity = null;

  element.style.position = 'absolute';
  element.style.left = 0;
  element.style.top = 0;
  element.style.opacity = 0;

  THREE.Object3D.call(this);
}

MathBox.Sprite.prototype = _.extend(new THREE.Object3D(), {
  
});