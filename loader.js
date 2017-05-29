var path = require('path');
var Module = require('module');
var jss = require('jss');
var fs = require('fs');
var loaderUtils = require('loader-utils');
var serialize = require('serialize-javascript');

var NodeTemplatePlugin = require("webpack/lib/node/NodeTemplatePlugin");
var NodeTargetPlugin = require("webpack/lib/node/NodeTargetPlugin");
var LibraryTemplatePlugin = require("webpack/lib/LibraryTemplatePlugin");
var SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
var LimitChunkCountPlugin = require("webpack/lib/optimize/LimitChunkCountPlugin");

var extractTextWebpackPluginKey;
try {
  extractTextWebpackPluginKey = path.dirname(require.resolve('extract-jss-webpack-plugin'));
} catch (error) {}

module.exports = function jss(content) {
  this.cacheable();

  if (this[__dirname] === false) {
    return '';
  } else if (typeof this[extractTextWebpackPluginKey] === 'function') {
    return '';
  } else if (this[extractTextWebpackPluginKey] === false) {
    var request = this.request.split('!').slice(this.loaderIndex + 1).join('!');
    produce(this, request, this.async());
  } else {
    return '';
  }
}

module.exports.pitch = function jssPitch(request, precedingRequest, data) {
  this.cacheable();

  if (this[__dirname] === false) {
    //if we are already inside the loader
    return;
  } else if (extractTextWebpackPluginKey in this) {
    // if extract-text-webpack-plugin is active we do all work in a loader phase
    return;
  } else {
    produce(this, request, this.async());
  }
}

function produce(loader, request, callback) {
  var outputFilename = "jss-output-filename";
  var outputOptions = {filename: outputFilename};
  var childCompiler = getRootCompilation(loader).createChildCompiler("jss-compiler", outputOptions);

  childCompiler.apply(new NodeTemplatePlugin(outputOptions));
  childCompiler.apply(new LibraryTemplatePlugin(null, "commonjs2"));
  childCompiler.apply(new NodeTargetPlugin());
  childCompiler.apply(new SingleEntryPlugin(loader.context, "!!" + request));
  childCompiler.apply(new LimitChunkCountPlugin({ maxChunks: 1 }));

  // Fix for "Uncaught TypeError: __webpack_require__(...) is not a function"
  // Hot module replacement requires that every child compiler has its own
  // cache. @see https://github.com/ampedandwired/html-webpack-plugin/pull/179
  var subCache = "subcache " + __dirname + " " + request;
  childCompiler.plugin("compilation", function(compilation) {
    if (compilation.cache) {
      if(!compilation.cache[subCache]) {
        compilation.cache[subCache] = {};
      }
      compilation.cache = compilation.cache[subCache];
    }
  });

  // We set loaderContext[__dirname] = false to indicate we already in
  // a child compiler so we don't spawn another child compilers from there.
  childCompiler.plugin("this-compilation", function(compilation) {
    compilation.plugin("normal-module-loader", function(loaderContext) {
      loaderContext[__dirname] = false;
      if (extractTextWebpackPluginKey in loader) {
        loaderContext[extractTextWebpackPluginKey] = loader[extractTextWebpackPluginKey];
      }
    });
  });

  var source;
  childCompiler.plugin("after-compile", function(compilation, callback) {
    source = compilation.assets[outputFilename] && compilation.assets[outputFilename].source();

    // Remove all chunk assets
    compilation.chunks.forEach(function(chunk) {
      chunk.files.forEach(function(file) {
        delete compilation.assets[file];
      });
    });

    callback();
  });

  var query = loaderUtils.parseQuery(this.query);
  var configKey = query.config || 'jssLoader';
  var useDefault = query.useDefault || true;
  var constKey = useDefault ? 'default' : (query.constKey || 'Styles');
  var jssPlugins = loader.options[configKey] && loader.options[configKey].plugins || [];

  childCompiler.runAsChild(function(error, entries, compilation) {
    if (error) {
      return callback(error);
    }

    if (compilation.errors.length > 0) {
      return callback(compilation.errors[0]);
    }

    if (!source) {
      return callback(new Error("Didn't get a result from child compiler"));
    }

    compilation.fileDependencies.forEach(function(dep) {
      loader.addDependency(dep);
    });

    compilation.contextDependencies.forEach(function(dep) {
      loader.addContextDependency(dep);
    });

    var sheet = jss.create();

    jssPlugins.forEach(function(plugin) {
      sheet = sheet.use(plugin());
    });

    var rules = loader.exec(source, request);
    var styles = sheet.createStyleSheet(rules[constKey]);

    var result = "module.exports = " + serialize({
      classes: styles.classes,
      styles: styles.toString()
    }) + ";";

    return callback(null, result);
  })
};

function getRootCompilation(loader) {
  var compiler = loader._compiler;
  var compilation = loader._compilation;
  while (compiler.parentCompilation) {
    compilation = compiler.parentCompilation;
    compiler = compilation.compiler;
  }
  return compilation;
}
