Thoughts on MathBox
=======

After making a couple presentations with it, it's clearer to me what MathBox should be. It's really two things:

1) It's a collection of mathematical transforms and primitives, which are manipulated through parameters that can be tuned like knobs. You build graphs by composing these pieces.

2) It's an interface for feeding live expressions and data into those primitives, and interpolating between that data on the fly.

As a result, MathBox naturally animates in a way that exposes the underlying mathematical relations. For example, when working in polar coordinates, interpolation is done separately for radius and angle, creating spiralling motions rather than straight lines.

Hence an entire slide show can take place in one consistent mathematical space. Or if multiple spaces are involved, you can transform from one to the other and back again.

This doesn't just make for a much more compelling experience, but makes everything more comprehensible. Because the viewer is visually guided through and sees every change happening, they never lose their place. You also get a much more persistent sense of depth from 3D graphs. By slowly building up elements and using parallax and orbits, you can present complex scenes and ideas without visual overload.

The final piece is to hook up live expressions to clocks that move at a constant speed. This can be as simple as spinning an object at a constant speed, but can include pseudo-randomly changing curves and surfaces. Each slide turns into a live diorama that the viewer can examine and interact with for as long as needed.

The viewport can skim and zoom around, a camera can rotate in 3D, and everything can shift and turn underneath as if nothing happened.

Right now, I've been using live expressions in JS to compensate for the limitations of the built-in transforms, doing a lot of number work beforehand. But it's impressive what you can do with it already: I fed in data from a physics engine and textures from a GLSL fractal generator.

With more flexible, comprehensive transforms and more varied primitives, this approach can model many more things, and can do tons of work on the GPU, saving precious battery power.

Making good slides with MathBox is definitely hard, but not for the reasons you might think. Making MathBox animations is easy, the hard part is figuring out which ones to show.

Ideas
-----

 * Static shapes are needlessly recalculated every frame. Manually setting `live: false` is not really appropriate, it needs to detect changes and update only affected objects. Should also move axis/grid adjustments into GLSL.
 * A single viewport transform is too limiting. You should be able to have multiple parallel viewports in one mathbox. The existing polar viewport should be decomposed into its component transforms and allow arbitrary stacking. Essentially, mathbox scenes have to become proper DOM trees, so it's a good thing it's got that CSS-like selector system going already.
 * Need to add an Angle primitive that shows angles as circle segments rather than having to manually contort a Surface to do it.
 * Not being able to change the number of points on curves and vectors live is limiting. Live reallocation won't be smooth, but it's better than not supporting it.

Issues
-------
 * A lot of wasteful processing occurs due to using a normal Mesh + Geometry + ShaderMaterial. None of the built-in three.js lighting / normals / stuff works on it. Should explore BufferGeometry instead and save lots of wasteful processing.
 * Need to replace ArrowHead with ArrowHeads, it's too slow for massive vector fields
 * The Director's rollback generator mangles complicated set/animate combinations. Need to figure out a better way to do this. Perhaps just replying it in reverse at high speed is a better solution than the current one where it tries to do it everything at once.
 * The current approach of on-demand allocation tends to create hiccups if a lot of objects are added simultaneously. This can be hidden by waiting e.g. 100ms before moving anything and should ideally be done for you.
