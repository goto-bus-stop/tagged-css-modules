var defaultInsertCss = require('insert-css')
var xtend = require('xtend/mutable')

module.exports = makeCss()

function makeCss (opts) {
  opts = xtend({ insertCss: defaultInsertCss }, opts)

  css.insert = function (arg) {
    return opts.insertCss(arg)
  }

  // create a new instance with custom config.
  css.make = function (overrides) {
    return makeCss(opts).set(overrides)
  }

  // set config of the current instance.
  css.set = function (overrides) {
    xtend(opts, overrides)
    return css
  }

  function css () {}

  return css
}
