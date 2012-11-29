MathBox.Primitive = function (options) {
  // Allow inheritance constructor
  if (options === null) return;

  // Apply defaults and unpack styles
  var defaults = this.defaults();
  if (options) {
    options.style = _.extend(defaults.style, options.style || {});
    options = _.extend(defaults, options || {});
  }
  options = options || defaults;
  this.set(options);

  // Holds persistent object styles
  this.style = new MathBox.Style();
  this.style.set(this.get().style || {});

  // Pass through style changes
  this.on('change', function (changed) {
    if (changed.style !== undefined) {
      this.style.set(changed.style);
    }
  }.bind(this));

  // Unique primitive sequence number.
  this.set('sequence', options.sequence || ++MathBox.Primitive.sequence);

  // Auto-assign ID.
  this.set('id', options.id || this.sequence);

  // Call init method for subclass' benefit.
  this.init();
};

MathBox.Primitive.sequence = 0;

MathBox.Primitive.types = {};

MathBox.Primitive.prototype = {
  defaults: function () {
    return {};
  },

  type: function () {
    return 'primitive';
  },

  init: function () {
  },

  make: function () {
  },

  destroy: function () {
  },

  renderables: function () {
    return [];
  },

  adjust: function (viewport) {
  }//,

};

MathBox.Attributes.mixin(MathBox.Primitive);
MicroEvent.mixin(MathBox.Primitive);
