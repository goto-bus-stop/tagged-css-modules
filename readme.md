# tagged-css-modules

Use CSS Modules inline in tagged template strings. 

> (Early experimental/wip)

## Example

```js
const bel = require('bel')
const css = require('tagged-css-modules')

const styles = css`
  :global(body) {
    background: #1b1b1b;
  }

  .header {
    background: red;
    padding: 20px;
  }

  .headerText {
    color: yellow;
  }
`

document.body.appendChild(bel`
  <div class="${styles.header}">
    <h1 class="${styles.headerText}"></h1>
  </div>
`)
```

## Installation

Using npm:

```bash
npm install --save tagged-css-modules
```

## API

### ``` const styles = css`` ```

Parse a tagged template string as a css module. Returns an object of names to
mangled names:

```json
{
  "header": "__input_1_header"
}
```

## `composes:` and imports

Because `tagged-css-modules` runs in the browser, it can't load referenced CSS
files from the filesystem like native css-modules. So, composing classnames from
different files is a little different. It uses style objects instead of file
names.

```js
// utilities.js
module.exports = css`
  .centerContents {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`
```

```js
const utilities = require('./utilities')
const styles = css`
  .header {
    composes: centerContents from ${utilities};
    font: 150% Open Sans;
  }
`
```

The classnames used for composition are concatenated at runtime.

## Babel

`tagged-css-modules` uses postcss to transform your css at runtime. When
bundling your app for production, that's a lot of code to include just for CSS.
Instead, you can use the Babel plugin to transform your css ahead of time, and
only include a ~1kb runtime.

```js
// .babelrc
{
  "plugins": [
    "tagged-css-modules/babel"
  ]
}
```

**Input**

```js
// utilities.js
const css = require('tagged-css-modules')
module.exports = css`
  .centerContents {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`
```

```js
// index.js
const css = require('tagged-css-modules')
const utilities = require('./utilities')
const styles = css`
  .header {
    composes: centerContents from ${utilities};
    font: 150% Open Sans;
  }
`
```

**Output**

```js
// utilities.js
const css = require('tagged-css-modules/runtime');
module.exports = (css.insert('\n  .centerContents_0 {\n    display: flex;\n    justify-content: center;\n    align-items: center;\n  }\n'), {
  'centerContents': 'centerContents_0'
});
```

```js
// index.js
const css = require('tagged-css-modules/runtime');
const utilities = require('./utilities');
const styles = (css.insert('.header_0 {\n    font: 150% Open Sans;\n  }\n'), {
  'header': ['header_0', utilities.centerContents].join(' ')
});
```

## License

[ISC](./LICENSE)
