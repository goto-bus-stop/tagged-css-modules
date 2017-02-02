const defaultInsertCss = require('insert-css')

module.exports = makeCss()

function makeCss (opts) {
  opts = Object.assign({ insertCss: defaultInsertCss }, opts)

  css.insert = (arg) => opts.insertCss(arg)

  // create a new instance with custom config.
  css.make = (overrides) => makeCss(opts).set(overrides)

  // set config of the current instance.
  css.set = (overrides) => {
    Object.assign(opts, overrides)
    return css
  }

  function css () {}

  return css
}