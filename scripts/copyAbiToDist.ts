const fse = require('fs-extra')

const srcDir = `node_modules/@premia/v3-abi/abi`
const destDir = `abi`

try {
	fse.copySync(srcDir, destDir, { overwrite: true })
} catch (err) {
	console.error(err)
}
