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

## License

[ISC](./LICENSE)
