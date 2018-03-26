// Override the settings to dynamically determine the path to the selenium
// server. Without this, we would need to update nightwatch.json every time the
// selenium-server-standalone-jar package is updated.
// http://nightwatchjs.org/gettingstarted#example
module.exports = (function(settings) {
  settings.selenium.server_path = require('selenium-server-standalone-jar').path;
  return settings;
})(require('./nightwatch.json'));
