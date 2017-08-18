# JSS Loader for Webpack
Create your styles in the [JSS](https://github.com/jsstyles/jss) format and use this loader to load the modules. Used in combination with the JSS-Text-Extractor to extract the generated CSS as a separate bundle (to avoid FOUT).

Based heavily on [the original JSS loader](https://github.com/markdalgleish/jss-loader). However, the original did not allow for a mechanism to extract the generated CSS.

Compatibility with Extract-text-webpack-plugin borrowed heavily from [Styling](https://github.com/andreypopp/styling); Big shout-out to @andreypopp wouldn't have been able to figure out the proper loader order with multiple child compilers without him.

## Install

```bash
$ npm install --save jss-module-loader jss
```

## Usage

In your webpack config:

```
import jssLoader from 'jss-module-loader';

...
loader: jssLoader(/* postLoaders */, /* preloaders */);
...
```

With Extract-text-webpack-plugin:

```
import jssLoader from 'jss-module-loader';

...
loader: jssLoader([ExtractTextWebpackPlugin.loader(), /* postLoaders */], /* preloaders */);
...
```


### JSS Plugins

In order to use [JSS plugins](https://github.com/jsstyles/jss/blob/master/readme.md#plugins), simply define the `jssLoader.plugins` option in your [Webpack config](http://webpack.github.io/docs/configuration.html).

``` javascript
module.exports = {
  module: {
    loaders: [...]
  },
  jssLoader:
    plugins: [
      require('jss-nested'),
      require('jss-extend'),
      require('jss-vendor-prefixer'),
      require('jss-camel-case'),
      require('jss-props-sort'),
      require('jss-px')
    ]
};
```

If required, you can change the options key with the `config` query parameter: `"jss-module-loader?config=jssLoaderCustom"`.

## External Documentation

[JSS](https://github.com/jsstyles/jss)
[Webpack: Using loaders](http://webpack.github.io/docs/using-loaders.html)

## License
[MIT License](http://www.mit-license.org/)
