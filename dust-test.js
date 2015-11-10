var dust = require('dustjs-linkedin');
var fs = require('fs');

var file = fs.readFileSync('event.dust', 'utf-8');
console.log(file);
var compiledTemplate = dust.compile(file, "event");
dust.loadSource(compiledTemplate);

dust.render("event", {name: "Fred"}, function(error, output) {
    if (error) {
      console.log(error);
    } else {
      console.log(output); // output === 'Hello Fred!'
    }
});
