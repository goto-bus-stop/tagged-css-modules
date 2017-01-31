const defaultInsertCss = require('insert-css')
const postcss = require('postcss')
const postcssValues = require('postcss-modules-values')
const postcssLocalByDefault = require('postcss-modules-local-by-default')
const postcssExtractImports = require('postcss-modules-extract-imports')
const postcssScope = require('postcss-modules-scope')
const replaceSymbols = require('icss-replace-symbols').default

const importRe = /^:import\((.+)\)$/

module.exports = makeCss()

function makeCss (opts) {
  opts = Object.assign({
    insertCss: defaultInsertCss,
    plugins: []
  }, opts)

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
    const translations = {}

    const text = sources.reduce((text, source, i) => {
      const expr = exprs[i] || ''
      if (typeof expr === 'object') {
        // probably composing (TODO maybe add a symbol to identify)
        const virtIndex = virtualFiles.push(expr)
        return `${text}${source}"virt://${virtIndex - 1}"`
      }
      return `${text}${source}${expr}`
    }, '')

    function resolveImport (importNode, importPath) {
      const match = importPath.match(/^"virt:\/\/(\d+)"$/)
      if (!match) {
        return
      }

      const origin = virtualFiles[match[1]]
      importNode.each((decl) => {
        translations[decl.prop] = origin[decl.value]
      })

      importNode.remove()
    }

    function resolveImports (tree) {
      tree.each((node) => {
        if (node.type !== 'rule') {
          return
        }

        let match = node.selector.match(importRe)
        if (match) {
          resolveImport(node, match[1])
        }
      })
    }

    const exportNames = {}

    function handleExport (exportNode) {
      exportNode.each((decl) => {
        if (decl.type === 'decl') {
          exportNames[decl.prop] = decl.value
        }
      })
      exportNode.remove()
    }

    function extractExports (tree) {
      tree.each((node) => {
        if (node.type === 'rule' && node.selector === ':export') {
          handleExport(node)
        }
      })
    }

    const result = postcss([
      postcssValues,
      postcssLocalByDefault,
      postcssExtractImports,
      postcssScope({
        generateScopedName: opts.generateScopedName ||
          ((exportedName) => `${exportedName}_${ruleId++}`)
      }),
      resolveImports,
      (tree) => replaceSymbols(tree, translations),
      extractExports,
      ...opts.plugins
    ]).process(text)

    opts.insertCss(result.css)

    return exportNames
  }

  return css
}
