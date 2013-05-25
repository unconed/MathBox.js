/**
 * Material manager. Generates custom ShaderMaterials that perform
 * all the right transforms and stylings.
 *
 * Uses ShaderGraph to glue together basic snippets, which can be
 * overridden on a section by section basis.
 */
MathBox.Materials = function (stage) {
  this.stage = stage;
  this.cache = {};
}

MathBox.Materials.prototype = {

  /**
   * Get material hash
   */
  hash: function (options) {
    // Calculate material hash
    var keys = Object.keys(options);
    var hash = '';
    keys.sort();
    _.each(keys, function (key) {
      hash += key + '/';
      hash += options[key] + '/';
    });

    return hash;
  },

  /**
   * Clone cached material
   */
  clone: function (material) {
    var clone = new THREE.ShaderMaterial({
      vertexShader: material.vertexShader,
      fragmentShader: material.fragmentShader,
    });
    clone.attributes      = material.attributes ? {} : null;
    clone.uniforms        = {};
    clone.wireframe       = material.wireframe;
    clone.applyUniforms   = material.applyUniforms;
    clone.applyAttributes = material.applyAttributes;

    _.each(material.uniforms, function (uniform, key) {
      clone.uniforms[key] = {
        type: uniform.type,
        value: (uniform.value && uniform.value.clone) ? uniform.value.clone() : uniform.value,
      };
    });
    _.each(material.attributes, function (attributes, key) {
      clone.attributes[key] = {
        type: attributes.type,
        value: attributes.value,
      };
    });

    return clone;
  },

  /**
   * Return a generic material.
   */
  generic: function (options) {
    options = options || {};

    // Check for cached instance if not using custom shader
    if (!options.shaders || !Object.keys(options.shaders).length) {
      var hash = this.hash(options);
      if (this.cache[hash]) {
        return this.clone(this.cache[hash]);
      }
    }

    // Prepare new shadergraph factory.
    var factory = this.factory();
    var shaders = options.shaders || {};

    // Read out vertex position.
    if (shaders.position) {
      shaders.position(factory, this);
    }
    else {
      this.position(factory, options);

      // Apply viewport transform
      if (!options.absolute) {
        if (options.shaded && options.smooth) {
          // Viewport transform for position + DU/DV
          factory.group();
          this.viewport(factory);
          factory.next();
          this.viewport(factory);
          factory.next();
          this.viewport(factory);
          factory.combine();
        }
        else {
          // Viewport transform for position
          this.viewport(factory);
        }
      }
    }

    // Apply finalizing shaders.
    var material = this.finalize(factory, options);

    if (hash) {
      // Cache material
      this.cache[hash] = material;
    }
    return material;
  },

  /**
   * Insert the position snippet into a shadergraph factory.
   */
  position: function (factory, options) {
    options = options || {};

    // Default position snippet
    var position = (options.shaded && options.smooth) ? 'getPositionDUDV' : 'getPosition';

    // Fetch vertex position from three.js attributes
    factory
      .snippet(position);

    // Apply math transform
    if (!options.absolute) {
      if (options.shaded && options.smooth) {
        // Transform position + DU/DV offset positions
        factory
          .group()
            .snippet('mathTransform')
          .next()
            .snippet('mathTransform')
          .next()
            .snippet('mathTransform')
          .combine();
      }
      else {
        // Transform just position
        factory.snippet('mathTransform');
      }
    }

    return factory;
  },

  /**
   * New factory
   */
  factory: function () {
    return new ShaderGraph.Factory();
  },

  /**
   * Finalize a shadergraph by adding on final transforms and a material shader.
   */
  finalize: function (factory, options) {
    // Read out shaders
    options = options || {};
    var shaders = options.shaders || {};

    // Transform point to view.
    if (options.shaded) {
      if (options.smooth) {
        factory
          .snippet('projectToViewDUDV')
      }
      else {
        factory
          .snippet('projectToViewNormal')
      }
    }
    else {
      factory
        .snippet('projectToView')
    }

    if (shaders.material) {
      // Override material shader
      shaders.material(factory, this);
    }
    else {
      // Add default fragment shader
      var fragment = {
        points: 'fragmentSolidPoint',
        mesh: options.shaded
              ? 'fragmentShaded'
              : 'fragmentSolid',
      }[options.type] || 'fragmentSolid';

      factory.material('vertexOutput', fragment);
    }

    // Finish graph and compile program
    var graph = factory.end(),
        program = graph.compile();

    // Create Three.js material
    var material = new THREE.ShaderMaterial({
      uniforms: program.uniforms,
      attributes: program.attributes,
      vertexShader: program.vertexShader,
      fragmentShader: program.fragmentShader,
    });

    // Set necessary three.js flags
    if (options.wireframe) {
      material.wireframe = true;
    }

    // Add .apply methods to update uniforms/attribs.
    var apply = this.apply.bind(this);
    material.applyUniforms = function (options) {
      apply(this, options, 'uniforms');
    };
    material.applyAttributes = function (options) {
      apply(this, options, 'attributes');
    };

    return material;
  },

  /**
   * Apply uniforms/attributes to a material
   */
  apply: function (material, options, type) {

    var fields = material[type];
    _.each(options, function (value, key) {
      var field = fields[key];
      if (field) {
        if (value instanceof THREE.Color) {
          value.x = value.r;
          value.y = value.g;
          value.z = value.b;
        }
        field.value = value;
        field.needsUpdate = true;
      }
    });

    if (type == 'uniforms') {
      var uniforms = material.uniforms;
      if (options.map) {
        if (uniforms.texture) {
          uniforms.texture.value = options.map;
        }
        if (uniforms.offsetRepeat) {
          var offset = options.map.offset;
          var repeat = options.map.repeat;

          uniforms.offsetRepeat.value.set(offset.x, offset.y, repeat.x, repeat.y);
        }
      }
      if (options.lineWidth !== undefined) {
        material.wireframeLinewidth = material.linewidth = options.lineWidth;
      }
      if (options.opacity !== undefined) {
        material.transparent = options.opacity < 1;
      }
    }

  },

  /**
   * Add viewport transform to a shadergraph factory.
   */
  viewport: function (factory, absolute) {
    this.stage.viewport().shader(factory, absolute);
  },
};
