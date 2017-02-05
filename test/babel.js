const path = require('path')
const fs = require('fs')
const test = require('tape')
const babel = require('babel-core')
const stripIndent = require('strip-indent')
const pluginModule = require.resolve('../babel')

function unpad (str) {
  return stripIndent(str).trim()
}

function transform (src, options = {}) {
  delete require.cache[pluginModule]
  const css = require(pluginModule)
  return babel.transform(src, {
    plugins: [
      [css, options]
    ]
  }).code.trim()
}

test('Basic functionality', (t) => {
  t.plan(1)

  t.strictEqual(transform(unpad(`
    import css from 'tagged-css-modules'

    const styles = css\`.header {}\`
  `)), unpad(`
    import css from 'tagged-css-modules/runtime';

    const styles = (css.insert('.header_0 {}'), {
      'header': 'header_0'
    });
  `))
})

test('Output css to separate file', (t) => {
  t.plan(3)

  const output = path.join(__dirname, 'output.css')

  t.strictEqual(transform(unpad(`
    import css from 'tagged-css-modules'

    const styles = css\`.header {}\`
  `), { output }), unpad(`
    import css from 'tagged-css-modules/runtime';

    const styles = {
      'header': 'header_0'
    };
  `))

  fs.readFile(output, 'utf8', (err, result) => {
    if (err) {
      t.fail()
    } else {
      t.strictEqual(result, '.header_0 {}')
    }

    fs.unlink(output, (err) => {
      if (err) {
        t.fail()
      } else {
        t.pass()
      }
    })
  })
})

test('Composing style objects', (t) => {
  t.plan(1)

  const output = path.join(__dirname, 'null.css')

  t.strictEqual(transform(unpad(`
    import css from 'tagged-css-modules'

    const parent = css\`
      .base { background: red }
    \`
    const styles = css\`
      .sub {
        composes: base from \${parent};
        color: white;
      }
    \`
  `), { output }), unpad(`
    import css from 'tagged-css-modules/runtime';

    const parent = {
      'base': 'base_0'
    };
    const styles = {
      'sub': ['sub_1', parent.base].join(' ')
    };
  `))

  fs.unlink(output)
})
