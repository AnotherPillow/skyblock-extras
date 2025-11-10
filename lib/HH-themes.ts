type styleType = {
    name: string,
    description: string,
    addCSS?: () => void,
    css?: string,
    basis: number,
    basedOnOld?: boolean,
}

const THEMES = {
    OLD: 6,
    MIDDLE: 22,
    NEW: 30,
}

let themes: styleType[] = [
    {
        name: 'Dark Mode (Pink Accent)',
        description: 'A dark mode & pink accented theme',
        css: $import('darkmode.css'),
        basis: THEMES.OLD,
    },
    {
        name: 'Nightblock',
        description: 'A dark theme for Skyblock Forums',
        css: $import('nightblock.css'),
        basis: THEMES.OLD,
    },
    {
        name: 'Better New SB',
        description: 'A better version of the new Skyblock theme',
        css: $import('betternewsb.css'),
        basis: THEMES.MIDDLE,
    },
    {
        name: 'True Modern Dark Mode',
        description: 'A true black and modern dark mode theme',
        css: $import('truemoderndarkmode.css'),
        basis: THEMES.NEW,
    }
]

if (ls.getItem('customThemes')) {
    const ct = JSON.parse(ls.getItem('customThemes') ?? '[]') as styleType[]
    if (ct.length > 0) {
        ct.map((theme: styleType) => {
            if (theme.basedOnOld != undefined) {
                theme.basis = theme.basedOnOld ? THEMES.OLD : THEMES.MIDDLE
                delete theme.basedOnOld
            }
            theme.addCSS = () => GM_addStyle(theme.css ?? '')
        })

        themes = [...themes, ...ct]
    }
}

if (localStorage.getItem('customThemeMode') == 'true' && localStorage.getItem('customTheme-SBE')) {
    const theme = JSON.parse(localStorage.getItem('customTheme-SBE') ?? '[]') as styleType
    
    if (theme.css) GM_addStyle(theme.css ?? '')
    else if (theme.addCSS) theme.addCSS();


    (document.querySelector('.pageContent>.choosers>dd>a[href*="misc/style?redirect"]') as HTMLElement)
        .innerHTML = theme.name

}

waitForElm('.section.styleChooser').then((_overlay: any) => {
    console.log('Style chooser opened!')
    document.querySelectorAll('a[href^="misc/style"]').forEach(_elm => {
        const elm = _elm as HTMLAnchorElement
        elm.addEventListener('click', function (event) {
            const styleID = elm.href.match(/style_id=(\d+)/)![1]
            localStorage.setItem('sbe-vanilla-style', styleID.toString())

        })
    })

    console.log('Overlay found!')
    const overlay = _overlay as HTMLElement
    const ol = overlay.querySelector('ol.twoColumns.primaryContent.chooserColumns') as HTMLElement

    for (const li of AF(ol.querySelectorAll('li'))) {
        const a = li.querySelector('a')
        
        if (/style_id=(6|22|30)/.test(a?.href ?? ''))
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
                theme.basis
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


if (isOnNewTheme) {
    const container = document.querySelector('div#footer>div.bottom>div.container') as HTMLElement
    container.innerHTML += `<a href="misc/style?redirect${encodeURIComponent(location.pathname)}" class="changeTheme OverlayTrigger Tooltip" title="Style Chooser" rel="nofollow">Change Theme</a>`
}
