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
    if (isOnUserProfile) {
        const quickNav = document.querySelector('[href="misc/quick-navigation-menu"]')
        const embedBtn = quickNav?.cloneNode(true);

        (embedBtn as any).href = `http://skyblock.onl/@${isOnUserProfile[1]}`;
        (embedBtn as any).style.background = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAMUExURR4wUHzP/ycwUAAAABYcaeAAAAAEdFJOU////wBAKqn0AAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAOElEQVQYV3VKSRIAIAii+P+fC7DtkKOyghqgMB9oW80k4acZLHE3D9j1ibukNXsy9kelollmBDkAflsBQjtoK8kAAAAASUVORK5CYII=')`

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

if (settings.responsiveModals) {
    (async function () {
        await waitForElm('.memberCard');

        let prevWidth = 0;
        
        setInterval(() => {
            const width = document.body.clientWidth

            if (between(width, width - 10, width + 10)) {
                const el = document.querySelector('.memberCard')
    
                const nw = ((width / 2) - ((el?.clientWidth ?? 1) / 2)).toString() + 'px'
    
                console.log(el);
    
                (el as any).style.left = nw;

                prevWidth = width
            }
        }, 500);


    })()
}

if (settings.movePoke && isOnUserProfile) {
    const moderatorActions = document.querySelector('div[id="XenForoUniq1"].Menu > ul.secondaryContent.blockLinksList')
    const pokeBtn = moderatorActions?.querySelector('li > a.OverlayTrigger[href^="pokes/"]')
    const clone = pokeBtn?.cloneNode(true)
    
    pokeBtn?.parentElement?.remove()

    let linkElement = document.createElement('li')
    linkElement.appendChild(clone as Node)

    document.querySelector('.followBlock > ul')?.appendChild(linkElement)
    
    if (moderatorActions?.children.length === 0) {
        document.querySelector('.Popup.moderatorToolsPopup')?.remove()
    }
}

if (settings.ratingRatio && isOnUserProfile) {
    (document.querySelector('div[class="mast"]') as HTMLElement).style.width = '230px';
    (document.querySelector('div[class="mainProfileColumn"]') as HTMLElement).style.marginLeft = '240px'

    const table = document.querySelector('div.section > div.primaryContent[style="padding:0"] > table.dark_postrating_member')
    const tbody = table?.querySelector('tbody');
    
    (table as HTMLElement).style.padding = '5px 20px'

    console.log(tbody)

    Array.from(tbody?.children ?? []).forEach(tr => {
        console.log(tr)
        if (tr.querySelector('th')) {
            const new_th = document.createElement('th')
            new_th.innerHTML = 'Ratio:'
            tr.appendChild(new_th)
        } else {
            const given = tr.children[1]
            const received = tr.children[2]

            console.log(given, received)

            const ratio = document.createElement('td');

            ratio.setAttribute('class', received.getAttribute('class') ?? 'dark_postrating_neutral')
            ratio.innerHTML = calculateRatio(
                parseInt(given.innerHTML.replace(/,/g, '')),
                parseInt(received.innerHTML.replace(/,/g, '')),
            )

            tr.appendChild(ratio)
        }
    })
}

if (settings.removeRatingCommas) {
    [
        ...AF(document.querySelectorAll('.dark_postrating_positive')),
        ...AF(document.querySelectorAll('.dark_postrating_neutral')),
        ...AF(document.querySelectorAll('.dark_postrating_negative')),
    ].forEach(x=>{
        x.innerHTML.replace(/,/g, '')
    })
}

if (settings.avatarOnProfileStats && isOnUserProfile) {
    let avatara = document.querySelector('a[class^="Av"].OverlayTrigger[href="account/avatar"]') as HTMLElement
    
    avatara.style.position = 'relative';
    
    (avatara.children[0] as HTMLElement).style.position = 'absolute'
    
}