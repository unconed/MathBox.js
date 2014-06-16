// Run tests in PhantomJS
//
// Exits with status code 0 is all tests pass, or 1 if any fail.
// Pipes successful assertions to stdout and errors to stderr
//
// Run with $ phantomjs TestRunner.js
//
var page = require('webpage').create();
page.open('./test.html', function() {

    // get an array, with as the first element the test strings and second the test results
    var testOutput = page.evaluate(function () {
        return document.getElementById('test-output').textContent.split('Tests: ');
    });

    var passed = testOutput[0].match(/✔[^✔✘]*/g) || [];
    for (var i = 0; i < passed.length; i++) {
        console.log(passed[i]);
    }

    var failed = testOutput[0].match(/✘[^✔✘]*/g) || [];
    for (var j = 0; j < failed.length; j++) {
        console.error(failed[j]);
    }

    console.log('Tests: ' + testOutput[1]);
    phantom.exit(failed.length ? 1 : 0);
});

