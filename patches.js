const fs = require('fs')

fs.writeFileSync('build/sbe.js', (
    fs.readFileSync('build/sbe-unpatched.js', 'utf-8')
        .replace(/^"use strict";/, '')
        .replace(/(\/\/ ==\/UserScript==)/, '$1\n\n"use strict";\n')
        .replace(/^\n/, '')
        .replace(/GM_addStyle\(`([^`]*)`\)/gm, (match, styleContent) => {
            return `GM_addStyle(\`${styleContent.replace(/(\n|\s{4,})*/gm, '')}\`)`;
        })
        .replace(/\$import\([`'"](.+)[`'"]\)/g, (match, src) => {
            let imported = fs.readFileSync(`./lib/${src}`).toString()
            // console.log(imported)
            return '`' + 
                imported.replace(/[\n\r]/gm, '')
                + '`'
        })
    )   
)