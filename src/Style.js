/**
 * Object containing style attributes and their validators.
 */
MathBox.Style = function (options) {
  // Apply defaults
  var defaults = this.defaults();
  options = _.extend(defaults, options || {});
  this.set(options);
};

MathBox.Style.prototype = {

  defaults: function () {
    return {
      color: new THREE.Color(0x3080F0),
      opacity: 1,
      lineWidth: 2,
      pointSize: 5,

      mathScale: new THREE.Vector3(1, 1, 1),
      mathRotation: new THREE.Vector3(),
      mathPosition: new THREE.Vector3(),

      worldScale: new THREE.Vector3(1, 1, 1),
      worldRotation: new THREE.Vector3(),
      worldPosition: new THREE.Vector3(),
      zIndex: 0.0,

      map: null,
      mapColor: 0,
      mapOpacity: 0,
    };
  },

  validateColor: function (c) {
    if (c.constructor == Array) {
      c = c.concat([0, 0, 0]);
      var color = new THREE.Color();
      return color.setRGB.apply(color, c);
    }
    if (c.constructor == Number) {
      return new THREE.Color(c);
    }
    if (c.constructor != THREE.Color) {
      return this.get('color');
    }
    return c;
  },

  validateMathScale: function (v) {
    if (v.constructor == Array) {
      v = v.concat([1, 1, 1]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathScale');
    }
    return v;
  },

  validateMathRotation: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathRotation');
    }
    return v;
  },

  validateMathPosition: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('mathPosition');
    }
    return v;
  },

  validateWorldScale: function (v) {
    if (v.constructor == Array) {
      v = v.concat([1, 1, 1]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldScale');
    }
    return v;
  },

  validateWorldRotation: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldRotation');
    }
    return v;
  },

  validateWorldPosition: function (v) {
    if (v.constructor == Array) {
      v = v.concat([0, 0, 0]);
      var vector = new THREE.Vector3();
      return vector.set.apply(vector, v);
    }
    if (v.constructor != THREE.Vector3) {
      return this.get('worldPosition');
    }
    return v;
  },

};

MathBox.Attributes.mixin(MathBox.Style);
