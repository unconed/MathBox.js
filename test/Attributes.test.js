Test.Tests.Attributes = function (assert, done) {

  function test(object, assert) {
    // Add validator
    var limit = 10;
    object.validateFoo = function (foo) {
      return Math.max(limit, foo);
    }

    // Prepare test of event firing.
    var fired = false;
    object.on('change', function (changed) {
      fired = changed;
    });
    function didFire() {
      assert(fired, "Attributes change event fired");
      fired = false;
    }

    // Test get/set
    assert(object.get, 'Has get method');
    assert(object.set, 'Has set method');

    var data = { foo: 33, bar: 2 };
    object.set(data);
    didFire();
    assert(object.get().foo == data.foo, 'Multiple set, attr get foo');
    assert(object.get().bar == data.bar, 'Multiple set, attr get bar');

    assert(object.get('foo') == data.foo, 'Multiple set, key get foo');
    assert(object.get('bar') == data.bar, 'Multiple set, key get bar');

    data.foo = 30;
    object.set('foo', data.foo);
    didFire();
    assert(object.get().foo == data.foo, 'Single set, attr get');

    // Test validator
    object.set('foo', limit - 10);
    didFire();
    assert(object.get().foo == limit, 'Validator works');

    // Set random value
    object.set('random', Math.random());
  }

  var klass = function () {};
  MathBox.Attributes.mixin(klass);

  var a, b, c;
  test(a = new MathBox.Attributes(), function (x, msg) { assert(x, 'Stand-alone: ' + msg) });
  test(b = new klass(), function (x, msg) { assert(x, 'Class mixin: ' + msg) });
  test(c = new klass(), function (x, msg) { assert(x, 'Class mixin 2: ' + msg) });

  assert(a.get().random != b.get().random, 'A and B differ');
  assert(b.get().random != c.get().random, 'B and C differ');
  assert(c.get().random != a.get().random, 'C and A differ');

  done();
};