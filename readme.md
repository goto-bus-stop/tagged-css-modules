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

## License

[ISC](./LICENSE)
