const defaultInsertCss = require('insert-css')
const postcss = require('postcss')
const postcssValues = require('postcss-modules-values')
const postcssLocalByDefault = require('postcss-modules-local-by-default')
const postcssExtractImports = require('postcss-modules-extract-imports')
const postcssScope = require('postcss-modules-scope')

module.exports = makeCss()

function makeCss (opts) {
  opts = Object.assign({
    insertCss: defaultInsertCss,
    plugins: []
  }, opts)

  css.make = (overrides) => makeCss(Object.assign({}, opts, overrides))

  function css (sources, ...exprs) {
    const text = sources
      .map((source, i) => source + (exprs[i] || ''))
      .join('')

    const exportNames = {}

    function handleExport (exportNode) {
      exportNode.each((decl) => {
        if (decl.type === 'decl') {
          exportNames[decl.prop] = decl.value
        }
      })
      exportNode.remove()
    }

    function extractExports (css) {
      css.each((node) => {
        if (node.type === 'rule' && node.selector === ':export') {
          handleExport(node)
        }
      })
    }

    let ruleId = 0
    const result = postcss([
      postcssValues,
      postcssLocalByDefault,
      postcssExtractImports,
      postcssScope({
        generateScopedName: opts.generateScopedName ||
          ((exportedName) => `${exportedName}_${ruleId}`)
      }),
      extractExports,
      ...opts.plugins
    ]).process(text)

    opts.insertCss(result.css)

    return exportNames
  }

  return css
}
