const test = require('tape')
const css = require('../')

const stubCss = css.make({
  insertCss: () => {}
})

test('Custom insertCss function', (t) => {
  t.plan(1)

  const styles = css.make({
    insertCss: () => t.pass('Should call custom insertCss')
  })`.header {}`
})

test('Basic functionality', (t) => {
  t.plan(2)

  t.deepEqual(stubCss.make()`.header {}`, {
    header: 'header_0'
  }, 'Should return the className → mangled className map')

  t.deepEqual(stubCss.make()`:global(body) {} .header {}`, {
    header: 'header_0'
  }, 'Should not return global rules')
})

test('Options: generateScopedName', (t) => {
  t.plan(1)

  const custom = stubCss.make({
    generateScopedName: () => 'custom exported name'
  })

  t.deepEqual(custom`.header {}`, {
    header: 'custom exported name'
  }, 'Should generate mangled classNames using generateScopedName option')
})

test('Options: plugins', (t) => {
  t.plan(1)

  let value
  css.make({
    insertCss: (text) => { value = text.replace(/\s+/g, ' ') },
    plugins: [
      (tree) => tree.append('status { it: worked }')
    ]
  })``

  t.equal(value, 'status { it: worked }', 'It uses custom plugins')
})

test('composes style objects', (t) => {
  t.plan(1)
  const inst = stubCss.make()
  const parent = inst`.base { background: red }`
  const styles = inst`
    .sub {
      composes: base from ${parent};
      color: white;
    }
  `

  t.deepEqual(styles, {
    sub: 'sub_0 base_0'
  })
})
