Test.Tests.Animator = function (assert, done) {

  var animator = new MathBox.Animator();
  var options = { duration: 250 };

  var klass = function () {};
  MathBox.Attributes.mixin(klass);

  var object = new klass();

  var data = { foo: 0, bar: 10 };
  object.set(data);

  var data2 = { foo: 10, bar: 5 };
  animator.animate(object, data2, options);

  assert(object.get().foo == data.foo, 'Foo unaffected after animate call');
  assert(object.get().bar == data.bar, 'Bar unaffected after animate call');

  animator.update(0);

  animator.update(125);

  assert((object.get().foo > data.foo) && (object.get().foo < data2.foo), 'Foo is at an inbetween value');
  assert((object.get().bar < data.bar) && (object.get().bar > data2.bar), 'Bar is at an inbetween value');

  animator.update(125);

  assert(object.get().foo == data2.foo, 'Foo finished animating');
  assert(object.get().bar == data2.bar, 'Bar finished animating');

  var data3 = { foo: 3 };
  var data4 = { foo: -20 };
  animator.animate(object, data3, options);
  animator.animate(object, data4, options);

  animator.update(0);

  animator.update(125);

  assert((object.get().foo < data2.foo) && (object.get().foo > data3.foo), 'Foo is at an inbetween value (queued animation 1)');

  animator.update(125);

  assert((object.get().foo - data3.foo) < .1, 'Foo is at the first target point');

  animator.update(125);

  assert((object.get().foo < data3.foo) && (object.get().foo > data4.foo), 'Foo is at an inbetween value (queued animation 2)');

  animator.update(125);

  assert(object.get().foo == data4.foo, 'Foo is at the second target point ');

  done();

};