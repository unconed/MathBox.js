MathBox.Attributes = function () {
};

MathBox.Attributes.prototype = {

  get: function (key) {
    if (key === undefined) return this.__attributes || {};
    if (!this.__attributes) return undefined;
    return this.__attributes[key];
  },

  set: function (object, value) {
    if (!this.__attributes) this.__attributes = {};
    if (!this.__validators) this.__validators = {};

    var changed = {},
        validators = this.__validators,
        attributes = this.__attributes,
        that = this;

    var validate = function (key, value) {
      if (validators[key] === undefined) {
        var method = 'validate' + key.charAt(0).toUpperCase() + key.slice(1);
        validators[key] = that[method] || false;
      }
      if (validators[key]) return validators[key].call(this, value);
      return value;
    }.bind(this);

    function set(key, value) {
      try {
        value = validate(key, value);
        changed[key] = value;
        attributes[key] = value;
      }
      catch (e) { throw "Exception setting '" + key + "' to '" + value + "': " + e; }
    }

    if (object === undefined || object === null) {
      return;
    }
    else if (object.constructor == String) {
      set(object, value);
    }
    else {
      _.each(object, function (value, key) {
        set(key, value);
      });
    }

    this.emit('change', changed);
  }//,

};

// Microeventable
MicroEvent.mixin(MathBox.Attributes);

MathBox.Attributes.mixin = function (klass) {
  _.each(['get', 'set', 'on', 'emit'], function (key) {
    klass.prototype[key] = MathBox.Attributes.prototype[key];
  })
};
