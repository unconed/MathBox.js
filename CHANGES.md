Changes
=======

Sep 15, 2013
* Added `hold` option for animations, which is a delay after it's done. Mostly for internal use.
* Director now properly reverses timings of animations when rolling back.

Aug 23, 2013
* Both Stage and Director treated duration: 0 as duration: 300, which was never really right. This has now been removed. Use `mathbox.transition(300)` to restore this behavior.
* Director.go(true) now actually works instantly.