MathBox.Renderable = function (options, style) {
  // Allow inheritance constructor
  if (options === null) return;

  // Unique renderable ID.
  this.id = ++MathBox.Renderable.id;

  // Apply defaults
  var defaults = this.defaults();
  if (options) {
    options = _.extend(defaults, options || {});
  }
  options = options || defaults;
  this.set(options);

  // Wrap a three.js renderable.
  this.object = null;
  this.material = null;
  this.geometry = null;
  this.visible = true;

  // Update on style/uniforms change
  this.style = style || new MathBox.Style();
  this.style.on('change', this.styleCallback = this.refreshStyle.bind(this));
  this.on('change', this.uniformsCallback = this.refreshOptions.bind(this));

  // Combined user-defined math-space transform
  this.mathTransform = new THREE.Matrix4();
};

MathBox.Renderable.id = 0;

MathBox.Renderable.prototype = {
  defaults: function () {
    return {};
  },

  make: function (materials) {
  },

  destroy: function () {
  },

  show: function (show) {
    var change = (show === undefined ? true : !!show);
    if (change != this.visible) {
      this.visible = change;
      this.refresh();
    }
  },

  isVisible: function () {
    return this.object && this.object.visible;
  },

  composeTransform: function (position, rotation, scale) {
		var mRotation = THREE.Matrix4.__m1;
		var mScale = THREE.Matrix4.__m2;

    mRotation.identity();
		mRotation.setRotationFromEuler(rotation, this.object.eulerOrder);

		mScale.makeScale(scale.x, scale.y, scale.z);

		this.mathTransform.multiply(mRotation, mScale);

    var te = this.mathTransform.elements;
		te[12] = position.x;
		te[13] = position.y;
		te[14] = position.z;
  },

  refreshStyle: function (changed) {
    var style = this.style.get();
    changed = changed || style;

    if (this.material) {
      this.material.applyUniforms(changed);
    }

    if (this.object) {
      // No point in culling if everything is dynamic / GLSL based
      this.object.frustumCulled = false;

      // Apply user-defined world transforms through three.js modelView matrix.
      if (changed.worldPosition) this.object.position = style.worldPosition;
      if (changed.worldRotation) this.object.rotation = style.worldRotation;
      if (changed.worldScale) this.object.scale = style.worldScale;

      // Prepare combined mathTransform matrix
      if (changed.mathPosition || changed.mathRotation || changed.mathScale) {
        this.composeTransform(style.mathPosition, style.mathRotation, style.mathScale);

        if (this.material) {
          this.material.applyUniforms({ mathTransform: this.mathTransform });
        }
      }

      // Set visibility
      if (changed.opacity !== undefined) {
        this.object.visible = this.visible && (style.opacity > 0);
      }

      // Set zIndex
      if ((changed.opacity !== undefined || changed.zIndex !== undefined) && this.material) {
        // Solid objects are drawn front to back
        // Transparent objects are drawn back to front
        // Always make sure positive zIndex makes it draw on top of everything else
        var sign = (style.opacity == 1) ? 1 : -1;
        this.object.renderDepth = style.zIndex * sign;
      }
    }
  },

  refreshOptions: function (changed) {
    var options = this.get();
    changed = changed || options;

    if (this.material) {
      options = this.get();

      if (changed.doubleSided !== undefined || changed.flipSided !== undefined) {
        // Set double sided / culling order.
        this.material.side = options.doubleSided ? THREE.DoubleSide :
                             options.flipSided ? THREE.BackSide : THREE.FrontSide;
        options = { flipSided: (options.doubleSided && options.flipSided) ? -1 : 1 };
        this.material.applyUniforms(options);
      }

      // Apply custom uniforms
      options = this.get().uniforms;
      if (options) {
        this.material.applyUniforms(options);
      }

      // Apply custom attributes
      options = this.get().attributes;
      if (options) {
        this.material.applyAttributes(options);
      }
    }
  },

  refresh: function () {
    this.refreshStyle();
    this.refreshOptions();
  },

  adjust: function (viewport) {
    if (this.material) {
       this.material.applyUniforms(viewport.uniforms());
    }
  }//,

};

MathBox.Attributes.mixin(MathBox.Renderable);
