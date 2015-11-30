var jss = require('jss');
var loaderUtils = require('loader-utils');
var serialize = require('serialize-javascript');

module.exports = function(content) {
  var sheet, plugins, rules;
  var query = loaderUtils.parseQuery(this.query);
  var configKey = query.config || 'jssLoader';
  var constKey = query.constKey || 'Styles';

  this.cacheable();

  if (this.inputValue) {
    return null, this.inputValue;
  } else {
    plugins = this.options[configKey] && this.options[configKey].plugins || [];

    sheet = jss.create();

    plugins.forEach(function(plugin) {
      sheet = sheet.use(plugin());
    });

    rules = this.exec(content, this.resource);

    var styles = sheet.createStyleSheet(rules[constKey]);

    return "module.exports = " + serialize({
      classes: styles.classes,
      styles: styles.toString()
    }) + ";";
  }
};