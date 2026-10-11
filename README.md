# DJHDEV landing page

The landing page is `index.html`. Demo entries live in `catalog.js`; the layout and rendering are in `styles.css` and `app.js`.

## Add a demo

Copy an object inside `window.DJHDEV_CATALOG` in `catalog.js` and set:

- `id`: a unique short name
- `title`, `subtitle`, `description`: text shown on the card and featured panel
- `category`: `Games` or `Tools`
- `href`: the demo URL
- `enabled`: `true` to show it, `false` to hide it
- `featured`: set one item to `true` for the large top feature
- `art`: `racing`, `tetris`, or `phones` for the matching built-in cover illustration
- `image`: optional local screenshot path, such as `images/my-demo.jpg`; leave empty to use the illustration

Keep screenshot files in an `images/` folder beside these files. Only enabled entries appear in search and category filters. Keep one enabled item marked as featured.
