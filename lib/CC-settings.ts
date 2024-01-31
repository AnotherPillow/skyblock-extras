class _Settings {
    threadTitleEnabled = true;
    hideShopTab = true;
    strikethroughBannedUsers = true;
    betterNewSB = true;
    SBonlIntegration = true;
    actualDateOnFrontpage = true;
    fixBedrockPlayersImages = true;
    responsiveModals = true;
    movePoke = true;
    ratingRatio = true;
    removeRatingCommas = true;
    avatarOnProfileStats = false;
    birthdayHatOnPFP = true;
    roundedFriendsOnProfile = true;
    postLinkButton = true;
    minotarNotCrafatar = true;
    noMoreCamo = false;
    fadeInReactions = true;
    darkMode = false;

    _modal: HTMLDialogElement | null;

    addSettingToModal(name: string, value: keyof this) {
        const id = `sbe-setting-${value.toString().replace(/\s/g, '_')}`

        const label = document.createElement('label')
        label.innerHTML = `${name}: `
        label.setAttribute('for', id)

        const input = document.createElement('input')
        input.name = id
        input.id = id
        input.type = 'checkbox'
        input.checked = (this[value] ?? false) as boolean
        
        input.addEventListener('click', (ev: Event) => {
            const checked = //@ts-ignore
                ev.target.checked
            
            this[value] = checked
        })

        this._modal?.appendChild(label)
        this._modal?.appendChild(input)
        this.br()
    }

    br() { this._modal?.appendChild(document.createElement('br')) }
    
    constructor() {
        this.deserialise()

        this._modal = document.createElement('dialog')
        this._modal.id = 'sbe-settings-modal'
        
        const _h1 = document.createElement('h1')
        _h1.innerHTML = 'Skyblock Extras Settings'
        _h1.style.fontSize = '2em'

        this._modal.appendChild(_h1)
        this.br()

        GM_addStyle(`
            #sbe-settings-modal {
                width: 640px;
                height: 560px;
                border-radius: 1em;
                border: medium;
                outline: none;
                text-align: center;
                scrollbar-width: none;
            }
        `)

        this.addSettingToModal('Thread Title as Browser Title', 'threadTitleEnabled')
        this.addSettingToModal('Remove the shop tab', 'hideShopTab')
        this.addSettingToModal("Strike through banned users' names", 'strikethroughBannedUsers')
        this.addSettingToModal('Better New Style Theme', 'betterNewSB')
        this.addSettingToModal('Skyblock.onl Integration', 'SBonlIntegration')
        this.addSettingToModal('Show actual date on threads on the frontpage', 'actualDateOnFrontpage')
        this.addSettingToModal("Fix bedrock players' images", 'fixBedrockPlayersImages')
        this.addSettingToModal("Responsive Modals", 'responsiveModals')
        this.addSettingToModal("Move poking out of moderator tools", 'movePoke')
        this.addSettingToModal("Add given:received ratio for reactions on profile", 'ratingRatio')
        this.addSettingToModal("Remove commas from ratings", 'removeRatingCommas')
        this.addSettingToModal("Avatar on profile stats", 'avatarOnProfileStats')
        this.addSettingToModal("Place birthday hats on birthday peoples' PFPs", 'birthdayHatOnPFP')
        this.addSettingToModal("Round friends' names on profile", 'roundedFriendsOnProfile')
        this.addSettingToModal("Add button to copy link to post on posts", 'postLinkButton')
        this.addSettingToModal("Replace Craftar with Minotar", 'minotarNotCrafatar')
        this.addSettingToModal("Remove Skyblock's image proxy", 'noMoreCamo')
        this.addSettingToModal("Fade in reaction opacity on hover", 'fadeInReactions')
        this.addSettingToModal("Dark Mode (Pink Accent)", 'darkMode')


        const saveBtn = document.createElement('button')

        saveBtn.innerHTML = 'Save'
        saveBtn.style.width = '6em'
        saveBtn.style.height = '2.5em'
        
        saveBtn.addEventListener('click', e => {
            this.serialise()
            window.location.reload()
        })

        this.br()
        this.br()
        this._modal.appendChild(saveBtn)
        
        const closeBtn = document.createElement('button')

        closeBtn.innerHTML = 'Close'
        closeBtn.style.width = '6em'
        closeBtn.style.height = '2.5em'
        
        closeBtn.addEventListener('click', e => {
            this.close()
        })

        this.br()
        this.br()
        this.br()
        this.br()
        this._modal.appendChild(closeBtn)



        document.body.appendChild(this._modal)

        const opener = document.createElement('img')

        opener.src = ' data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADdUAAA3VAT3WWPEAAAEZSURBVEhLxZVBEsIgDEXRe7jphbyIm3qQuvEU7ryQG4/QA2B+aFpAEphprW/mj4TGRPgUnfe+RT0pB3Ol3ERHV6cjncIwAXN4ZnJAlwh84RyGzJOEeODomytJcgTErzAkouV0pIEUgzifiyk9R4xaXNcqvobZH/EAS+zDcFukAfbtFobbEpsMgy8kbSX4Ae8w5BNk5d1Jwehpr+BBP47jgz5LJMZNY80zzMMDzkcyAsvgvHhLE8CNkGihFRfVmvjam4w9X16ab/BMfCnSclWsotagdt9o99QCbdPPTZZkq1HexCrOhUmcv9uLBqHrVqAW1/37KVqPLIVUMg6xZiYoPUc8H4hd/zI1aUcy+aWaWjzQ7pvaPUU49wFpm9dvoGBF4QAAAABJRU5ErkJggg=='
        opener.id = 'sbe-settings-opener-img'

        /* opener.style.marginLeft = '9em' */
        opener.style.marginTop = '2px'
        opener.style.marginLeft = '2em';
        
        opener.height = 20
        opener.width = 20

        opener.addEventListener('click', (e) => {
            this.open()
        })

        document.querySelector('[class="navTabs"]')?.insertBefore(opener, document.querySelector('.visitorTabs'))

    }

    open() {
        this._modal?.showModal()
    }
    
    close() {
        this._modal?.close()
    }

    serialise() {
        localStorage.setItem('sbe-settings', JSON.stringify({
            'threadTitleEnabled': this.threadTitleEnabled,
            'hideShopTab': this.hideShopTab,
            'strikethroughBannedUsers': this.strikethroughBannedUsers,
            'betterNewSB': this.betterNewSB,
            'SBonlIntegration': this.SBonlIntegration,
            'actualDateOnFrontpage': this.actualDateOnFrontpage,
            'fixBedrockPlayersImages': this.fixBedrockPlayersImages,
            'responsiveModals': this.responsiveModals,
            'movePoke': this.movePoke,
            'ratingRatio': this.ratingRatio,
            'removeRatingCommas': this.removeRatingCommas,
            'avatarOnProfileStats': this.avatarOnProfileStats,
            'birthdayHatOnPFP': this.birthdayHatOnPFP,
            'roundedFriendsOnProfile': this.roundedFriendsOnProfile,
            'postLinkButton': this.postLinkButton,
            'minotarNotCrafatar': this.minotarNotCrafatar,
            'noMoreCamo': this.noMoreCamo,
            'fadeInReactions': this.fadeInReactions,
            'darkMode': this.darkMode,
        }))
    }

    deserialise() {
        let settings = JSON.parse(localStorage.getItem('sbe-settings') ?? '{}')
        for (const key of Object.keys(settings)) {
            this[key as keyof typeof this] = settings[key]
        }
    }
}

const settings = new _Settings()