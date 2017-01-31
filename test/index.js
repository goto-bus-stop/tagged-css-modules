const test = require('tape')
const css = require('proxyquire')('../', {
  'insert-css': () => {} // stub
})

test('Basic functionality', (t) => {
  t.plan(2)

  t.deepEqual(css.make()`.header {}`, {
    header: 'header_0'
  }, 'Should return the className → mangled className map')

  t.deepEqual(css.make()`:global(body) {} .header {}`, {
    header: 'header_0'
  }, 'Should not return global rules')
})

test('Options: generateScopedName', (t) => {
  t.plan(1)

  const custom = css.make({
    generateScopedName: () => 'custom exported name'
  })

  t.deepEqual(custom`.header {}`, {
    header: 'custom exported name'
  }, 'Should generate mangled classNames using generateScopedName option')
})
