const fs = require('fs')
const process = require('../core')

module.exports = ({ types: t }) => {
  const cssTagVariables = Symbol('tagged-css-modules variables')

  const opts = {
    plugins: []
  }

  const combinedCss = []
  let ruleId = 0

  function processCssModule (quasis, expressions) {
    const cssSource = quasis.reduce((full, chunk, i) => {
      const expr = expressions[i]
      if (!expr) {
        return full + chunk
      }
      if (t.isStringLiteral(expr)) {
        return expr.value
      }
      return `${full}${chunk}\0runtime(${JSON.stringify(expr)})\0`
    })

    const result = process(cssSource, {
      virtualFiles: [],
      generateScopedName: (exportedName) => `${exportedName}_${ruleId++}`,
      plugins: opts.plugins
    })

    combinedCss.push(result.css)

    const exportNames = Object.keys(result.exports).map(
      (name) => t.objectProperty(
        t.stringLiteral(name),
        t.stringLiteral(result.exports[name])
      ))

    return {
      raw: result.css,
      module: t.objectExpression(exportNames)
    }
  }

  return {
    pre (state) {
      // if (!state.opts.output) {
      //   throw new Error('Must provide an output .css file.')
      // }
    },
    visitor: {
      Program: {
        enter (path, state) {
          Object.assign(opts, state.opts)
          state.file[cssTagVariables] = []
        },
      },

      ImportDeclaration (path, { file }) {
        if (path.node.source.value === 'tagged-css-modules') {
          path.node.specifiers.forEach((specifier) => {
            file[cssTagVariables].push(specifier.local.name)
          })
          path.node.source.value = 'tagged-css-modules/runtime'
        }
      },

      TaggedTemplateExpression (path, state) {
        state.file[cssTagVariables].forEach((variable) => {
          if (path.get('tag').isIdentifier({ name: variable })) {
            const { quasi, tag } = path.node

            const styles = processCssModule(
              quasi.quasis.map((element) => element.value.cooked),
              quasi.expressions
            )

            path.replaceWith(styles.module)
            if (state.opts.inline) {
              path.insertBefore(
                t.callExpression(
                  t.memberExpression(tag, t.identifier('insert')),
                  [t.stringLiteral(styles.raw)]
                )
              )
            }
          }
        })
      }
    },
    post (state) {
      const output = state.opts.output
      if (!output) {
        console.log(combinedCss.join('\n'))
      } else {
        fs.writeFileSync(output, combinedCss.join('\n'))
      }
    }
  }
}