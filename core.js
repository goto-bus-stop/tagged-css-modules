const postcss = require('postcss')
const postcssValues = require('postcss-modules-values')
const postcssLocalByDefault = require('postcss-modules-local-by-default')
const postcssExtractImports = require('postcss-modules-extract-imports')
const postcssScope = require('postcss-modules-scope')
const replaceSymbols = require('icss-replace-symbols').default

const importRe = /^:import\((.+)\)$/

module.exports = (text, opts) => {
  const translations = {}

  function resolveImport (importNode, importPath) {
    const match = importPath.match(/^"virt:\/\/(\d+)"$/)
    if (!match) {
      return
    }

    const origin = opts.virtualFiles[match[1]]
    importNode.each((decl) => {
      translations[decl.prop] = origin.get ? origin.get(decl.value) : origin[decl.value]
    })

    importNode.remove()
  }

  function resolveImports (tree) {
    tree.each((node) => {
      if (node.type !== 'rule') {
        return
      }

      const match = node.selector.match(importRe)
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
    postcssScope({ generateScopedName: opts.generateScopedName }),
    resolveImports,
    (tree) => replaceSymbols(tree, translations),
    extractExports,
    ...opts.plugins
  ]).process(text)

  result.exports = exportNames

  return result
}
