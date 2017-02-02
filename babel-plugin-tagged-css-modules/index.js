const fs = require('fs')
const process = require('../core')

module.exports = ({ types: t }) => {
  const cssTagVariables = Symbol('tagged-css-modules variables')

  const opts = {
    plugins: []
  }

  const composingRe = /composes:\s*(.*?)\s+from\s*$/
  const combinedCss = []
  const virtualFiles = []
  let ruleId = 0

  function processCssModule (quasis, expressions) {
    const cssSource = quasis.reduce((full, chunk, i) => {
      const expr = expressions[i]
      if (!expr) {
        return full + chunk
      }
      if (t.isStringLiteral(expr)) {
        // Inline string literals
        return `${full}${chunk}${expr.value}`
      } else if (composingRe.test(chunk)) {
        // When an expression is used as `composes: xyz from $expr`, we need to
        // import a classname from the $expr object at runtime. To make postcss
        // happy we insert some placeholders so it can parse it like an import
        // from a file.
        const virtIndex = virtualFiles.length
        virtualFiles.push({
          // Rewrite composed classnames to a special identifier
          get: (prop) => `\0import:${virtIndex}:${prop}\0`
        })
        return `${full}${chunk}"virt://${virtIndex}"`
      }
      // An expression anywhere else in the file is a value that should be
      // inlined at runtime. (TODO do the inlining and also probably restrict
      // this to property values only.)
      return `${full}${chunk}\0runtime(${JSON.stringify(expr)})\0`
    }, '')

    const result = process(cssSource, {
      virtualFiles,
      generateScopedName: (exportedName) => `${exportedName}_${ruleId++}`,
      plugins: opts.plugins
    })

    combinedCss.push(result.css)

    const exportNames = Object.keys(result.exports).map((name) => {
      const parts = result.exports[name]
        .split(/\s+/g)
        .map((part) => {
          // Resolve imported classnames back to their JavaScript classname
          // objects
          const match = /\0import:(\d+):(.*?)\0/.exec(part)
          if (match) {
            return t.memberExpression(
              expressions[match[1]],
              t.identifier(match[2])
            )
          }
          return t.stringLiteral(part)
        })

      // If we only have string literals, i.e. we know every classname in
      // advance, we can concat it in advance.
      // This is for cases where no imported classnames are used, like:
      //
      //   .red { color: red }
      //   .title { composes: red }
      if (parts.every((part) => t.isStringLiteral(part))) {
        return t.objectProperty(
          t.stringLiteral(name),
          t.stringLiteral(parts.map((part) => part.value).join(' '))
        )
      }

      // Otherwise compose classnames at runtime using [].join
      return t.objectProperty(
        t.stringLiteral(name),
        t.callExpression(
          t.memberExpression(t.arrayExpression(parts), t.identifier('join')),
          [t.stringLiteral(' ')]
        )
      )
    })

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