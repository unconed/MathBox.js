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
  this.style.on('change', this.styleCallback = this.refresh.bind(this));
  this.on('change', this.uniformsCallback = this.refresh.bind(this));

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
    this.visible = (show === undefined ? true : !!show);
    this.refresh();
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

  refresh: function () {
    var options;
    var style = this.style.get();

    if (this.object) {
      // Apply user-defined world transforms through three.js modelView matrix.
      this.object.position = style.worldPosition;
      this.object.rotation = style.worldRotation;
      this.object.scale = style.worldScale;

      // Prepare combined mathTransform matrix
      this.composeTransform(style.mathPosition, style.mathRotation, style.mathScale);

      // Set visibility
      this.object.visible = this.visible && (style.opacity > 0);
    }

    if (this.material) {

      // Set double sided / culling order.
      options = this.get();
      this.material.side = options.doubleSided ? THREE.DoubleSide :
                           THREE.FrontSide;
      options = { flipSided: (options.doubleSided && options.flipSided) ? -1 : 1 };
      this.material.applyUniforms(options);

      // Apply style uniforms
      this.material.applyUniforms(style);

      // Apply mathTransform
      this.material.applyUniforms({ mathTransform: this.mathTransform });

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

  adjust: function (viewport) {
    if (this.material) {
      this.material.applyUniforms(viewport.uniforms());
    }
  }//,

};

MathBox.Attributes.mixin(MathBox.Renderable);
