const defaultInsertCss = require('insert-css')
const process = require('./core')

module.exports = makeCss()

function makeCss (opts) {
  opts = Object.assign({
    insertCss: defaultInsertCss,
    plugins: []
  }, opts)

  css.insert = (arg) => opts.insertCss(arg)

  // create a new instance with custom config.
  css.make = (overrides) => makeCss(opts).set(overrides)

  // set config of the current instance.
  css.set = (overrides) => {
    Object.assign(opts, overrides)
    return css
  }

  let ruleId = 0

  function css (sources, ...exprs) {
    const virtualFiles = []

    const text = sources.reduce((text, source, i) => {
      const expr = exprs[i] || ''
      if (typeof expr === 'object') {
        // probably composing (TODO maybe add a symbol to identify)
        const virtIndex = virtualFiles.push(expr)
        return `${text}${source}"virt://${virtIndex - 1}"`
      }
      return `${text}${source}${expr}`
    }, '')

    const result = process(text, {
      virtualFiles: virtualFiles,
      generateScopedName: opts.generateScopedName ||
        ((exportedName) => `${exportedName}_${ruleId++}`),
      plugins: opts.plugins
    })

    css.insert(result.css)

    return result.exports
  }

  return css
}
