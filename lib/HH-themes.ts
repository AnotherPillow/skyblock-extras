type styleType = {
    name: string,
    description: string,
    addCSS?: () => void,
    css?: string,
    basedOnOld: boolean,
}

let themes: styleType[] = [
    {
        name: 'Dark Mode (Pink Accent)',
        description: 'A dark mode & pink accented theme',
        css: $import('darkmode.css'),
        basedOnOld: true,
    },
    {
        name: 'Better New SB',
        description: 'A better version of the new Skyblock theme',
        css: $import('betternewsb.css'),
        basedOnOld: false,
    }
]

if (ls.getItem('customThemes')) {
    const ct = JSON.parse(ls.getItem('customThemes') ?? '[]') as styleType[]
    if (ct.length > 0) {
        ct.map((theme: styleType) => {
            theme.addCSS = () => GM_addStyle(theme.css ?? '')
        })

        themes = [...themes, ...ct]
    }
}

if (localStorage.getItem('customThemeMode') == 'true' && localStorage.getItem('customTheme-SBE')) {
    const theme = JSON.parse(localStorage.getItem('customTheme-SBE') ?? '[]') as styleType
    
    if (theme.css) GM_addStyle(theme.css ?? '')
    else if (theme.addCSS) theme.addCSS();


    (document.querySelector('[title="Style Chooser"]') as HTMLElement)
        .innerHTML = theme.name

}

waitForElm('.xenOverlay.chooserOverlay').then((_overlay: any) => {
    console.log('Overlay found!')
    const overlay = _overlay as HTMLElement
    const ol = overlay.querySelector('ol.twoColumns.primaryContent.chooserColumns') as HTMLElement

    for (const li of AF(ol.querySelectorAll('li'))) {
        const a = li.querySelector('a')
        
        if (/style_id=(6|22)/.test(a?.href ?? ''))
            a?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('customThemeMode', 'false')
                window.location.href = a?.href
            })
    }

    for (const theme of themes) {
        const li = ol.querySelector('li')?.cloneNode(true) as HTMLElement
        const a = li.querySelector('a')
        a?.removeAttribute('href')
        a?.addEventListener('click', (e) => {
            e.preventDefault()

            localStorage.setItem('customThemeMode', 'true')
            localStorage.setItem('customTheme-SBE', JSON.stringify(theme))

            window.location.href = `https://skyblock.net/misc/style?style_id=${
                theme.basedOnOld ? '6' : '22'
            }&_xfToken=${xfToken}&redirect=${encodeURI(window.location.href)}`
            
        })

        const title = li.querySelector('.title') as HTMLElement
        const desc = li.querySelector('.description') as HTMLElement

        title.innerHTML = theme.name
        desc.innerHTML = theme.description

        li.classList.add('sbe-pointer')
        ol.appendChild(li)

    }
})