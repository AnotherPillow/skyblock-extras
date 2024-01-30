const fs = require('fs')

fs.writeFileSync('build/sbe.js', (
    fs.readFileSync('build/sbe-unpatched.js', 'utf-8')
        .replace(/^"use strict";/, '')
        .replace(/(\/\/ ==\/UserScript==)/, '$1\n\n"use strict";\n')
        .replace(/^\n/, '')
        .replace(/GM_addStyle\(`([^`]*)`\)/gm, (match, styleContent) => {
            console.log(styleContent)
            return `GM_addStyle(\`${styleContent.replace(/(\n|\s{4,})*/gm, '')}\`)`;
        })
    )   
)