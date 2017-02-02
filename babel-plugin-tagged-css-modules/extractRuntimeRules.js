const postcss = require('postcss')

const RUNTIME_IDENTIFIER = '-tagged-css-modules-runtime'

module.exports = extractRuntimeRules

extractRuntimeRules.RUNTIME_IDENTIFIER = RUNTIME_IDENTIFIER

/**
 * Postcss plugin to extract properties that contain javascript values.
 */
function extractRuntimeRules () {
  const runtimeRules = []

  /**
   * Check if any rules with javascript values were found.
   */
  function exists () {
    return runtimeRules.length > 0
  }

  /**
   * Get CSS source for all rules that contain javascript values, with
   * placeholders.
   */
  function get () {
    return runtimeRules.join('\n')
  }

  /**
   * Run the plugin.
   */
  function plugin (tree, result) {
    let rule
    tree.walkDecls((decl) => {
      if (decl.value.indexOf(RUNTIME_IDENTIFIER) === -1) {
        return
      }

      if (!rule || rule.selector !== decl.parent.selector) {
        rule = postcss.rule({
          selector: decl.parent.selector,
        })
        runtimeRules.push(rule)
      }
      rule.append(decl)
      decl.remove()
    })
  }

  return { exists, get, plugin }
}
