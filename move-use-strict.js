const fs = require('fs')

fs.writeFileSync('build/sbe.js', (
    fs.readFileSync('build/sbe-unpatched.js', 'utf-8')
        .replace(/^"use strict";/, '')
        .replace(/(\/\/ ==\/UserScript==)/, '$1\n\n"use strict";\n')
        .replace(/^\n/, '')
    )   
)