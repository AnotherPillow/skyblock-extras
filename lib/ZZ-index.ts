if (settings.fontAwesomeUpdate) {
    const newURL = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.2.1/css/fontawesome.min.css'
    const old = document.querySelector('link[href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"]');
    
    (old as any).disabled = true
    console.log(old)
    old?.remove()

    const newEl = document.createElement('link')
    newEl.rel = 'stylesheet'
    newEl.href = newURL

    document.head.appendChild(newEl)

    const outdatedFAs = document.querySelectorAll('[class*="fa"')
    outdatedFAs.forEach(x => {
        x.classList.remove('fa')
        x.classList.add('fa-solid')

        if (x.classList.contains('fa-heart')) x.outerHTML = '❤️'
    })

}

if (document.querySelector('.navTabs')) {
    const style = `
        .navTabs {
            position: relative;
        }

        .navTabs::before {
            content: "+";
            position: absolute;
            z-index: 20;
            color: white;
            top: -0.7rem;
            left: 5px;
            font-size: 3em;
        }
    `
    GM_addStyle(style)

}

if (settings.threadTitleEnabled) 
    document.title = (document.querySelector(".titleBar>h1") ?? document.querySelector('h1.username[itemprop="name"]'))?.textContent + " | Skyblock Forums"

if (settings.hideShopTab) {
    const publicTabs = document.querySelector('ul.publicTabs')

    const downloads = publicTabs?.children[7]
    const shop = publicTabs?.children[6]

    if (downloads) shop?.replaceWith(downloads)
}

if (settings.developerToolsEnabled) {
    const accMenu = document.querySelector('#AccountMenu > .menuColumns.secondaryContent:nth-child(3)')

    const clone = accMenu?.cloneNode(true);
    
    (clone as any).innerHTML = `
        <input id="sbe-devtools-token" disabled value="${(document.querySelector('[name="_xfToken"]') as HTMLInputElement)?.value}" />
        <!--<input id="sbe-devtools-token" disabled value="${(document.querySelector('[name="_xfToken"]') as HTMLInputElement)?.value}" />!-->
    `;


    accMenu?.parentElement?.appendChild(clone as Node)
}

if (settings.strikethroughBannedUsers) {

    const users = document.querySelectorAll('.messageUserBlock')

    const bannedUsers = Array.from(users).filter(x => 
        x.querySelector('[src="styles/default/xenforo/avatars/avatar_banned_m.png"]'))

    const style = `
        .sbe-strikethrough {
            text-decoration: line-through !important;
            text-decoration-thickness: 2px !important;
        }
    `

    GM_addStyle(style)

    bannedUsers.forEach(x=>{
        x.querySelector('.userText > .username')?.classList.add('sbe-strikethrough')
    })
}

if (settings.betterNewSB) {
    const style = `
    div.navTabs {
        background:#2b485c;
        border-radius: 0 !important;
    }
    #landingHero>* {
        display:none !important;
        background: none !important;
    }
    #landingHero {
        height:25px;
        padding:0 !important;
    }
    #content .sidebar .section {
        border-radius: 0px !important;
    }
    #content .section {
        -webkit-box-shadow:none !important;
        box-shadow:none !important;
    }
    .avatar img, .avatarWrap .img.s {
        border-radius: 5px !important;
    }
    .visitorTabs, .navTabs .visitorTabs {
        display: block !important;    
    }
    div#navigation {
        border-bottom: none;
    }
    #content .sidebar .section .secondaryContent {
        padding: 15px !important;
    }
    #footer>.top {
        padding:25px;
    }
    #content {
        background: #d1eef5 !important;
    }
    .newsText {
        color: #113240
    }
    li[id^="thread"]>.title {
        font-size: 12px;
    }
    .sbe-mg-top {
        margin-top: 20px
    }

    a.PreviewTooltip>.prefix {
        margin: 0 !important;
    }
    `
    if (document.querySelector('[data-clipboard-text="play.skyblock.net"]')) {

        GM_addStyle(style)
    
        document.querySelector('[class="pageContent"]')?.classList.add('sbe-mg-top')
    }
    
}

if (settings.SBonlIntegration) {
    const matches = window.location.href.match(/https\:\/\/skyblock\.net\/members\/([a-zA-Z0-9_\.]+)\.\d+/);
    console.log(matches)
    if (matches) {
        const quickNav = document.querySelector('[href="misc/quick-navigation-menu"]')
        const embedBtn = quickNav?.cloneNode(true);

        (embedBtn as any).href = `http://skyblock.onl/@${matches[1]}`;
        (embedBtn as any).style.background = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAMUExURR4wUHzP/ycwUAAAABYcaeAAAAAEdFJOU////wBAKqn0AAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAOElEQVQYV3VKSRIAIAii+P+fC7DtkKOyghqgMB9oW80k4acZLHE3D9j1ibukNXsy9kelollmBDkAflsBQjtoK8kAAAAASUVORK5CYII=')`
        // (embedBtn as any).style.background = 'transparent';

        // (embedBtn as any).innerHTML = '<i class="fa-solid fa-anchor fa-2xs"></i>'

        console.log(embedBtn)

        quickNav?.parentElement?.appendChild(embedBtn as any)
    }
}

if (settings.actualDateOnFrontpage) {
    //@ts-ignore
    const time = (date?: Date) => strftime('%H:%M %d/%m/%Y', date ?? null)

    const dates = document.querySelectorAll('.dateTime .DateTime')
    dates.forEach(x => {
        let dtAttr = x.getAttribute('data-time') ?? null
        if (dtAttr !== null) {
            x.innerHTML = time(new Date(parseInt(dtAttr) * 1000))
        }
    })
}

if (settings.fixBedrockPlayersImages) {

    document.querySelectorAll('a[class="PlayerListLink"][href="javascript:void(0)"]').forEach(x => {
        x.addEventListener('click', (e) => {
            document.querySelectorAll('a.avatar > img[alt^="."]').forEach(y => {    
                if (!y.getAttribute('src')?.startsWith('MHF_'))
                    y.setAttribute('src', 'https://minotar.net/avatar/MHF_Steve/18.png')
            })
        })
    })
}
