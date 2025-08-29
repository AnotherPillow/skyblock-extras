// ==UserScript==
// @name        Skyblock Extras
// @namespace   anotherpillow
// @description A userscript to improve the skyblock.net forums experience!
// @match       https://skyblock.net/*
// @grant       none
// @version     1.2.1
// @author      AnotherPillow
// @license     GNU GPLv3
// @require     https://cdn.jsdelivr.net/npm/@violentmonkey/dom@2
// @require     https://raw.githubusercontent.com/thdoan/strftime/master/strftime.js
// @grant       GM_addStyle
// @downloadURL https://anotherpillow.github.io/skyblock-extras/build/sbe.min.js
// ==/UserScript==

"use strict";

window.XenForo = XenForo || window.XenForo || {};
globalThis.XenForo = XenForo || globalThis.XenForo || window.XenForo || {};
let SELECTED_VANILLA_THEME = localStorage.getItem('sbe-vanilla-style');
function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
function between(x, min, max) {
    return x >= min && x <= max;
}
// https://www.codespeedy.com/get-the-ratio-of-two-numbers-in-javascript/
function calculateRatio(num_1, num_2) {
    for (var num = num_2; num > 1; num--) {
        if ((num_1 % num) == 0 && (num_2 % num) == 0) {
            num_1 = num_1 / num;
            num_2 = num_2 / num;
        }
    }
    var ratio = num_1 + ":" + num_2;
    return ratio;
}
const AF = Array.from;
const colonNumber = (array, number) => array.filter((_val, index) => index < number).filter(x => x !== '');
const getMonthFromString = (month) => new Date(Date.parse(month + " 1, 2012")).getMonth() + 1;
const getHrefWithoutAnchor = () => window.location.href.replace(new RegExp(`${window.location.hash}$`), '');
const isOnThread = getHrefWithoutAnchor().match(/https\:\/\/skyblock\.net\/threads\/.+\.\d+\/?/);
const isInConversation = getHrefWithoutAnchor().match(/https\:\/\/skyblock\.net\/conversations\/.+\.\d+\/?/);
const isOnUserProfile = window.location.href.match(/https\:\/\/skyblock\.net\/members\/([a-zA-Z0-9_\.]+)\.\d+/) ?? false;
const isOnIndex = window.location.href == 'https://skyblock.net/';
const isOnOriginalTheme = (!document.querySelector('.social-row>[href="https://www.reddit.com/r/SkyBlock"]') &&
    document.querySelector('.pageContent>span>a[href="http://blackcaffeine.com/"]'));
const isOnMiddleTheme = (!document.querySelector('a[href="http://blackcaffeine.com/"]') &&
    !document.querySelector('.social-row>[href="https://www.reddit.com/r/SkyBlock"]'));
const isOnNewTheme = (document.querySelector('.link-row>a[href="/how-to-install-skyblock"]') &&
    document.querySelector('#footer>.top>.container>.col>p'));
/* DEBUGGING FUNCTION - NOT ACTUALLY USED */
const $import = (fn) => {
    alert('If you are seeing this, something has gone very wrong.');
    return '';
};
const xfToken = XenForo._csrfToken;
const ls = localStorage;
GM_addStyle(/*$import*/`.sbe-pointer {    cursor: pointer;}#sbe-settings-modal {    width: 640px;    height: 560px;    border-radius: 1em;    border: medium;    outline: none;    text-align: center;    scrollbar-width: none;}.navTabs {    position: relative;}.navTabs::before {    content: "+";    position: absolute;    z-index: 20;    color: white;    top: -0.7rem;    left: 5px;    font-size: 3em;}.sbe-strikethrough {    text-decoration: line-through !important;    text-decoration-thickness: 2px !important;}.message .messageMeta {    width: 95%;}`);
function patchClass(obj, method, newImplementation) {
    if (typeof obj == 'undefined')
        return console.log(`Cannot patch ${method} of ${obj}.`);
    const originalMethod = obj[method];
    console.log(`Patching ${method}`, originalMethod);
    obj[method] = function (...args) {
        return newImplementation.call(this, originalMethod.bind(this), ...args);
    };
}
// adapted from https://stackoverflow.com/a/9160869
const insert = (fullString, index, subString) => index > 0 ? fullString.substring(0, index) + subString + fullString.substring(index, fullString.length)
    : subString + fullString;
class _Settings {
    threadTitleEnabled = true;
    hideShopTab = true;
    strikethroughBannedUsers = true;
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
    adBlocker = true;
    moreSearchOnCard = true;
    unpinLawsuit = true;
    fixOldLinks = true;
    dontShare = true;
    copyMessageBBCodeButton = true;
    _modal;
    addSettingToModal(name, value) {
        const id = `sbe-setting-${value.toString().replace(/\s/g, '_')}`;
        const label = document.createElement('label');
        label.innerHTML = `${name}: `;
        label.setAttribute('for', id);
        const input = document.createElement('input');
        input.name = id;
        input.id = id;
        input.type = 'checkbox';
        input.checked = (this[value] ?? false);
        input.addEventListener('click', (ev) => {
            const checked = //@ts-ignore
             ev.target.checked;
            this[value] = checked;
        });
        this._modal?.appendChild(label);
        this._modal?.appendChild(input);
        this.br();
    }
    br() { this._modal?.appendChild(document.createElement('br')); }
    constructor() {
        this.deserialise();
        this._modal = document.createElement('dialog');
        this._modal.id = 'sbe-settings-modal';
        const _h1 = document.createElement('h1');
        _h1.innerHTML = 'Skyblock Extras Settings';
        _h1.style.fontSize = '2em';
        this._modal.appendChild(_h1);
        this.br();
        this.addSettingToModal('Thread Title as Browser Title', 'threadTitleEnabled');
        this.addSettingToModal('Remove the shop tab', 'hideShopTab');
        this.addSettingToModal("Strike through banned users' names", 'strikethroughBannedUsers');
        this.addSettingToModal('Skyblock.onl Integration', 'SBonlIntegration');
        this.addSettingToModal('Show actual date on threads on the frontpage', 'actualDateOnFrontpage');
        this.addSettingToModal("Fix bedrock players' images", 'fixBedrockPlayersImages');
        this.addSettingToModal("Responsive Modals", 'responsiveModals');
        this.addSettingToModal("Move poking out of moderator tools", 'movePoke');
        this.addSettingToModal("Add given:received ratio for reactions on profile", 'ratingRatio');
        this.addSettingToModal("Remove commas from ratings", 'removeRatingCommas');
        this.addSettingToModal("Avatar on profile stats", 'avatarOnProfileStats');
        this.addSettingToModal("Place birthday hats on birthday peoples' PFPs", 'birthdayHatOnPFP');
        this.addSettingToModal("Round friends' icons on profile", 'roundedFriendsOnProfile');
        this.addSettingToModal("Add button to copy link to post on posts", 'postLinkButton');
        this.addSettingToModal("Replace Craftar with Minotar", 'minotarNotCrafatar');
        this.addSettingToModal("Remove Skyblock's image proxy", 'noMoreCamo');
        this.addSettingToModal("Fade in reaction opacity on hover", 'fadeInReactions');
        this.addSettingToModal("Block Ads", 'adBlocker');
        this.addSettingToModal("More search options on member card", 'moreSearchOnCard');
        this.addSettingToModal("Unpin Lawsuit", 'unpinLawsuit');
        this.addSettingToModal("Fix old forum links", 'fixOldLinks');
        this.addSettingToModal("Remove share buttons", 'dontShare');
        this.addSettingToModal("Add a button to copy message BBCode", 'copyMessageBBCodeButton');
        const saveBtn = document.createElement('button');
        saveBtn.innerHTML = 'Save';
        saveBtn.style.width = '6em';
        saveBtn.style.height = '2.5em';
        saveBtn.addEventListener('click', e => {
            this.serialise();
            XenForo.alert("Settings have been saved.", false, 5000, console.log);
            setTimeout(() => {
                window.location.reload();
            }, 4500);
        });
        this.br();
        this.br();
        this._modal.appendChild(saveBtn);
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = 'Close';
        closeBtn.style.width = '6em';
        closeBtn.style.height = '2.5em';
        closeBtn.addEventListener('click', e => {
            this.close();
        });
        this.br();
        this.br();
        this.br();
        this.br();
        this._modal.appendChild(closeBtn);
        document.body.appendChild(this._modal);
        const opener = document.createElement('img');
        opener.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADdUAAA3VAT3WWPEAAAEZSURBVEhLxZVBEsIgDEXRe7jphbyIm3qQuvEU7ryQG4/QA2B+aFpAEphprW/mj4TGRPgUnfe+RT0pB3Ol3ERHV6cjncIwAXN4ZnJAlwh84RyGzJOEeODomytJcgTErzAkouV0pIEUgzifiyk9R4xaXNcqvobZH/EAS+zDcFukAfbtFobbEpsMgy8kbSX4Ae8w5BNk5d1Jwehpr+BBP47jgz5LJMZNY80zzMMDzkcyAsvgvHhLE8CNkGihFRfVmvjam4w9X16ab/BMfCnSclWsotagdt9o99QCbdPPTZZkq1HexCrOhUmcv9uLBqHrVqAW1/37KVqPLIVUMg6xZiYoPUc8H4hd/zI1aUcy+aWaWjzQ7pvaPUU49wFpm9dvoGBF4QAAAABJRU5ErkJggg==';
        opener.id = 'sbe-settings-opener-img';
        /* opener.style.marginLeft = '9em' */
        opener.style.marginTop = '2px';
        opener.style.marginLeft = '2em';
        opener.height = 20;
        opener.width = 20;
        opener.addEventListener('click', (e) => {
            this.open();
        });
        if (isOnMiddleTheme || isOnOriginalTheme)
            document.querySelector('[class="navTabs"]')?.insertBefore(opener, document.querySelector('.visitorTabs'));
        else
            document.querySelector('#topbar>.p-nav-inner>.left')?.appendChild(opener);
    }
    open() {
        this._modal?.showModal();
    }
    close() {
        this._modal?.close();
    }
    serialise() {
        localStorage.setItem('sbe-settings', JSON.stringify({
            'threadTitleEnabled': this.threadTitleEnabled,
            'hideShopTab': this.hideShopTab,
            'strikethroughBannedUsers': this.strikethroughBannedUsers,
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
            'moreSearchOnCard': this.moreSearchOnCard,
            'adBlocker': this.adBlocker,
            'unpinLawsuit': this.unpinLawsuit,
            'fixOldLinks': this.fixOldLinks,
            'dontShare': this.dontShare,
            'copyMessageBBCodeButton': this.copyMessageBBCodeButton,
        }));
    }
    deserialise() {
        let settings = JSON.parse(localStorage.getItem('sbe-settings') ?? '{}');
        for (const key of Object.keys(settings)) {
            this[key] = settings[key];
        }
    }
}
const settings = new _Settings();
const THEMES = {
    OLD: 6,
    MIDDLE: 22,
    NEW: 30,
};
let themes = [
    {
        name: 'Dark Mode (Pink Accent)',
        description: 'A dark mode & pink accented theme',
        css: /*$import*/`#content .pageContent {    background-color: #414141;}    .secondaryContent,    .avatar img,    .avatarCropper,    .recentNews,    .breadBoxTop>nav>fieldset.breadcrumb,    .breadBoxBottom>nav>fieldset.breadcrumb,    .breadcrumb .crust a.crumb,    #searchBar,    .messageUserBlock,    div.section.sectionMain,    div.messageUserBlock>.avatarHolder,    ul.tabs.mainTabs.Tabs li{    background: #2D2D2DBB !important;    color: #c5c5c5;    /* outline: 1px solid lime; */}    .messageContent,    .section.sectionMain.recentNews,    .recentNews>div.primaryContent.leftDate,    fieldset#QuickSearch,    fieldset#QuickSearch>formPopup,    .footer .pageContent,    .navTabs,    div.primaryControls,    input#QuickSearchQuery,    ul.tabs.mainTabs.Tabs,    ul.tabs.mainTabs.Tabs>li,    ul.tabs.mainTabs.Tabs>li>a,    form#ProfilePoster,    li[id^="profile-post-"],    .primaryContent,    #AccountMenu,    .mainContent>ul.tabs{    background: #323232;}.messageInfo>textarea.textCtrl:focus {    background-image: none !important;    background: #665766;}    .messageInfo>textarea.textCtrl ,    #AccountMenu>.menuHeader,    ol#forums,    ol.nodeList,    .mainContent>ul.tabs>li:not(.active)>a{    background-color: #2b2b2b;}    li.node>ol.nodeList>li.node>div.nodeInfo,    div.extraUserInfo{    background-color: #1a1a1a !important;}    .titleBar,    #serverstatus,    .visitorText,    .dark_postrating_neutral,    .sectionFooter>div.continue>a.iconKey.button,    footer>.footerLegal,    footer>.footerLegal>a,    input#QuickSearchQuery,    article>blockquote.ugc.baseHtml,    .tabs>li:not(.active)>a,    div.primaryContent.menuHeader>h3>a.concealed[href^="members/"],    ol.nodeList>li.node>div.nodeInfo,    div#pageNodeContent,    .searchResult.post>.listBlock.main>blockquote>a{    color: white !important;}    a,    .PageNavNext,    [class="PageNavNext "],    a.PreviewTooltip,    .primaryContent a,    ul.Tabs.tabs.mainTabs>li.active>a,    #AccountMenu a,    #AccountMenu .secondaryContent a,    #AccountMenu .AutoValidator label{    color: #c450c6;}    .navTabs .navTab.selected .tabLinks,    .subHeading,    .sectionFooter,    .PageNav>nav a[href^="articles/"],    li.navTab.selected,    li.node.category > div.nodeInfo,    .discord-widget > p.discord-join > a,    .mainContent>ul.tabs>li.active>a,    ul[id^="premium-"].staffTitle{    background-color: #d38fb9;}    #header,     #headerMover #headerProxy,     #content,    .sectionFooter>div.continue>a.iconKey.button,    footer    /* nav span.scrollable>span.items a[href] */{    background: #7d4f77;}    .subHeading,    li.node.category > div.nodeInfo{    border-bottom: none !important;    border-top: none !important;}.PageNav>nav a[href^="articles/"] {    color: black;}a.avatar>img[alt][src^="data/avatars/"] {    filter: brightness(0.8);}    span.arrow,    span.arrow>span{    border-left-color: thistle !important;}.discussionListItems .unread .title a {    background: url(https://static.skyblock.net/sparkles/sparkle-7.gif);}`,
        basis: THEMES.OLD,
    },
    {
        name: 'Nightblock',
        description: 'A dark theme for Skyblock Forums',
        css: /*$import*/`/*This file has been dedicated to the public domain by the original author nightcat (https://nightcat.gg/). Explicit permission for use in skyblock-extras has been received, regardless.All changes from the original (https://github.com/uso-archive/data/blob/flomaster/data/usercss/146532.user.css), are licensed GPL 3.0.*//* ==UserStyle==@name         Nightblock@namespace    USO Archive@author       Nightcat@description  A dark theme for Skyblock Forums.@version      20200211.16.37@license      CC0-1.0@preprocessor uso==/UserStyle== */body,    .button,    .staffTitle li,    .username .style2,    .username .style24,    .dark_postrating_neutral,    span[style="color: #000000"],    span[style="color: rgb(0, 0, 0)"],    .bbCodeQuote .attribution,    .event .content .description em,    .discussionList .sectionFooter .contentSummary {    color: #fff !important;}a {    color: #bb86fc !important;}.formPopup .controlsWrapper,    .subHeading,    .textWithCount.subHeading .text,    .discussionList .sticky .title a,    .DateTime,    .discussionList .sticky .EditControl,    .discussionList .sticky .username,    .discussionList .sticky .pairsJustified dt,    a.username.author,    .postNumber,    .discussionList .sticky .DateTime,    .UnhiddenContent > .attribution.type{    color: #03dac5 !important;}#header,    body,    .pageContent,    .mainContainer,    .navTabs,    .secondaryContent,    .breadcrumb,    .sectionMain,    .primaryContent,    .button,    .profilePage .tabs.mainTabs,    .profilePage .tabs.mainTabs li a,    .nodeInfo.categoryForumNodeInfo,    .discussionListItem .posterAvatar .avatarContainer,    .discussionListItem,    .discussionListItem .posterAvatar,    .discussionListItem .stats,    .dark_postrating_detail,    .bbCodeQuote .quoteContainer,    .bbCodeBlock pre,    .bbCodeBlock .code,    .tabs,    .tabs li a {    background: #121212 !important;}.stackAlertContent,    .navTabs .navTab.selected .tabLinks,    .navTabs .navTab.selected .navLink,    .navPopup .PopupItemLinkActive:hover,    #QuickSearch,    .primaryControls,    .secondaryControls,    .formPopup .controlsWrapper,    a.crumb,    .subHeading,    .sectionFooter,    .avatar img,    .PageNav a,    .nodeList .categoryStrip,    .staffTitle,    .profilePage .tabs.mainTabs li.active a,    .sectionHeaders,    .discussionList .sticky .posterAvatar,    .discussionList .sticky .stats,    .discussionList .sticky,    .messageUserBlock div.avatarHolder,    .messageUserBlock,    .messageUserBlock .extraUserInfo,    .bbCodeQuote .attribution,    .bbCodeBlock .type,    .redactor_toolbar,    .tabs li.active a {    background: #1f1b24 !important;}.breadcrumb .crust .arrow span {    border-left-color: #1f1b24 !important;}.subHeading,    .sectionFooter,    .nodeList .categoryStrip,    .sectionHeaders {    border: 1px solid #d7edfc !important;}.navTabs .navTab.selected .navLink {    text-shadow: 0 0 0 transparent, 0px 0px 3px #000;}.Menu {    border: 1px solid #1f1b24 !important;    border-top: 5px solid #1f1b24 !important;}.discussionList .sticky .title a,    .discussionList .sticky .DateTime,    .discussionList .sticky .EditControl,    .discussionList .sticky .username,    .discussionList .sticky .pairsJustified dt {    text-shadow: none !important;}#friends-mount>.friend {    background-color: inherit;}.UnhiddenContent blockquote {    color: black;}`,
        basis: THEMES.OLD,
    },
    {
        name: 'Better New SB',
        description: 'A better version of the new Skyblock theme',
        css: /*$import*/`div.navTabs {    background:#2b485c;    border-radius: 0 !important;}#landingHero>* {    display:none !important;    background: none !important;}#landingHero {    height:25px;    padding:0 !important;}#content .sidebar .section {    border-radius: 0px !important;}#content .section {    -webkit-box-shadow:none !important;    box-shadow:none !important;}.avatar img, .avatarWrap .img.s {    border-radius: 5px !important;}.visitorTabs, .navTabs .visitorTabs {    display: block !important;    }div#navigation {    border-bottom: none;}#content .sidebar .section .secondaryContent {    padding: 15px !important;}#footer>.top {    padding:25px;}#content {    background: #d1eef5 !important;}.newsText {    color: #113240}li[id^="thread"]>.title {    font-size: 12px;}.sbe-mg-top {    margin-top: 20px}a.PreviewTooltip>.prefix {    margin: 0 !important;}`,
        basis: THEMES.MIDDLE,
    }
];
if (ls.getItem('customThemes')) {
    const ct = JSON.parse(ls.getItem('customThemes') ?? '[]');
    if (ct.length > 0) {
        ct.map((theme) => {
            if (theme.basedOnOld != undefined) {
                theme.basis = theme.basedOnOld ? THEMES.OLD : THEMES.MIDDLE;
                delete theme.basedOnOld;
            }
            theme.addCSS = () => GM_addStyle(theme.css ?? '');
        });
        themes = [...themes, ...ct];
    }
}
if (localStorage.getItem('customThemeMode') == 'true' && localStorage.getItem('customTheme-SBE')) {
    const theme = JSON.parse(localStorage.getItem('customTheme-SBE') ?? '[]');
    if (theme.css)
        GM_addStyle(theme.css ?? '');
    else if (theme.addCSS)
        theme.addCSS();
    document.querySelector('.pageContent>.choosers>dd>a[href*="misc/style?redirect"]')
        .innerHTML = theme.name;
}
waitForElm('.section.styleChooser').then((_overlay) => {
    console.log('Style chooser opened!');
    document.querySelectorAll('a[href^="misc/style"]').forEach(_elm => {
        const elm = _elm;
        elm.addEventListener('click', function (event) {
            const styleID = elm.href.match(/style_id=(\d+)/)[1];
            localStorage.setItem('sbe-vanilla-style', styleID.toString());
        });
    });
    console.log('Overlay found!');
    const overlay = _overlay;
    const ol = overlay.querySelector('ol.twoColumns.primaryContent.chooserColumns');
    for (const li of AF(ol.querySelectorAll('li'))) {
        const a = li.querySelector('a');
        if (/style_id=(6|22|30)/.test(a?.href ?? ''))
            a?.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('customThemeMode', 'false');
                window.location.href = a?.href;
            });
    }
    for (const theme of themes) {
        const li = ol.querySelector('li')?.cloneNode(true);
        const a = li.querySelector('a');
        a?.removeAttribute('href');
        a?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('customThemeMode', 'true');
            localStorage.setItem('customTheme-SBE', JSON.stringify(theme));
            window.location.href = `https://skyblock.net/misc/style?style_id=${theme.basis}&_xfToken=${xfToken}&redirect=${encodeURI(window.location.href)}`;
        });
        const title = li.querySelector('.title');
        const desc = li.querySelector('.description');
        title.innerHTML = theme.name;
        desc.innerHTML = theme.description;
        li.classList.add('sbe-pointer');
        ol.appendChild(li);
    }
});
if (isOnNewTheme) {
    const container = document.querySelector('div#footer>div.bottom>div.container');
    container.innerHTML += `<a href="misc/style?redirect${encodeURIComponent(location.pathname)}" class="changeTheme OverlayTrigger Tooltip" title="Style Chooser" rel="nofollow">Change Theme</a>`;
}
console.log('skyblock extras loaded');
if (settings.threadTitleEnabled) {
    const thTitle = (document.querySelector(".titleBar>h1")
        ?? document.querySelector('h1.username[itemprop="name"]'));
    if (thTitle?.textContent)
        document.title = thTitle.textContent + " | Skyblock Forums";
}
if (settings.adBlocker) {
    document.querySelectorAll('.adsbygoogle').forEach(elm => {
        elm.remove();
    });
}
if (settings.hideShopTab) {
    const publicTabs = document.querySelector('ul.publicTabs');
    const downloads = publicTabs?.children[7];
    const shop = publicTabs?.children[6];
    if (downloads)
        shop?.replaceWith(downloads);
}
if (settings.strikethroughBannedUsers) {
    const users = document.querySelectorAll('.messageUserBlock');
    const bannedUsers = Array.from(users).filter(x => x.querySelector('[src="styles/default/xenforo/avatars/avatar_banned_m.png"]'));
    bannedUsers.forEach(x => {
        x.querySelector('.userText > .username')?.classList.add('sbe-strikethrough');
    });
}
if (settings.SBonlIntegration) {
    if (isOnUserProfile) {
        const quickNav = document.querySelector('[href="misc/quick-navigation-menu"]');
        const embedBtn = quickNav?.cloneNode(true);
        const href = `http://skyblock.onl/@${isOnUserProfile[1]}`;
        embedBtn.href = href;
        embedBtn.style.background = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAMUExURR4wUHzP/ycwUAAAABYcaeAAAAAEdFJOU////wBAKqn0AAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAOElEQVQYV3VKSRIAIAii+P+fC7DtkKOyghqgMB9oW80k4acZLHE3D9j1ibukNXsy9kelollmBDkAflsBQjtoK8kAAAAASUVORK5CYII=')`;
        quickNav?.parentElement?.appendChild(embedBtn);
    }
}
if (settings.actualDateOnFrontpage) {
    //@ts-ignore
    const time = (date) => strftime('%H:%M %d/%m/%Y', date ?? null);
    const dates = document.querySelectorAll('.dateTime .DateTime');
    dates.forEach(x => {
        let dtAttr = x.getAttribute('data-time') ?? null;
        if (dtAttr !== null) {
            x.innerHTML = time(new Date(parseInt(dtAttr) * 1000));
        }
    });
    patchClass(XenForo.TimestampRefresh?.prototype, 'refresh', (original, _a, _b) => {
        return undefined;
    });
}
if (settings.fixBedrockPlayersImages) {
    document.querySelectorAll('a[class="PlayerListLink"][href="javascript:void(0)"]').forEach(x => {
        x.addEventListener('click', (e) => {
            document.querySelectorAll('a.avatar > img[alt^="."]').forEach(y => {
                if (!y.getAttribute('src')?.startsWith('MHF_'))
                    y.setAttribute('src', 'https://minotar.net/avatar/MHF_Steve/18.png');
            });
        });
    });
}
if (settings.responsiveModals) {
    (async function () {
        await waitForElm('.memberCard');
        let prevWidth = 0;
        setInterval(() => {
            const width = document.body.clientWidth;
            if (between(width, width - 10, width + 10)) {
                const el = document.querySelector('.memberCard');
                const nw = ((width / 2) - ((el?.clientWidth ?? 1) / 2)).toString() + 'px';
                el.style.left = nw;
                prevWidth = width;
            }
        }, 500);
    })();
}
if (settings.movePoke && isOnUserProfile) {
    const moderatorActions = document.querySelector('div[id^="XenForoUniq"].Menu > ul.secondaryContent.blockLinksList');
    const pokeBtn = moderatorActions?.querySelector('li > a.OverlayTrigger[href^="pokes/"]');
    const clone = pokeBtn?.cloneNode(true);
    if (moderatorActions?.childElementCount == 1) // remove the dropdown if there's only the one element in the dropdown
        pokeBtn?.parentElement?.remove();
    else
        pokeBtn?.remove(); //otherwise only remove the poke option
    let linkElement = document.createElement('li');
    linkElement.appendChild(clone);
    document.querySelector('.followBlock > ul')?.appendChild(linkElement);
    if (moderatorActions?.children.length === 0) {
        document.querySelector('.Popup.moderatorToolsPopup')?.remove();
    }
}
if (settings.ratingRatio && isOnUserProfile) {
    document.querySelector('div[class="mast"]').style.width = '230px';
    document.querySelector('div[class="mainProfileColumn"]').style.marginLeft = '240px';
    const table = document.querySelector('div.section > div.primaryContent[style="padding:0"] > table.dark_postrating_member');
    const tbody = table?.querySelector('tbody');
    table.style.padding = '5px 20px';
    Array.from(tbody?.children ?? []).forEach(tr => {
        if (tr.querySelector('th')) {
            const new_th = document.createElement('th');
            new_th.innerHTML = 'Ratio:';
            tr.appendChild(new_th);
        }
        else {
            const given = tr.children[1];
            const received = tr.children[2];
            const ratio = document.createElement('td');
            ratio.setAttribute('class', received.getAttribute('class') ?? 'dark_postrating_neutral');
            ratio.innerHTML = calculateRatio(parseInt(given.innerHTML.replace(/,/g, '')), parseInt(received.innerHTML.replace(/,/g, '')));
            tr.appendChild(ratio);
        }
    });
}
if (settings.removeRatingCommas) {
    [
        ...AF(document.querySelectorAll('.dark_postrating_positive')),
        ...AF(document.querySelectorAll('.dark_postrating_neutral')),
        ...AF(document.querySelectorAll('.dark_postrating_negative')),
    ].forEach(x => {
        x.innerHTML.replace(/,/g, '');
    });
}
if (settings.avatarOnProfileStats && isOnUserProfile) {
    let avatara = document.querySelector('a[class^="Av"].OverlayTrigger[href="account/avatar"]');
    avatara.style.position = 'relative';
    avatara.children[0].style.position = 'absolute';
}
if (settings.birthdayHatOnPFP) {
    // https://www.flaticon.com/free-icon/party-hat_2668968
    const partyHatImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7N13nFTV+fjxz522s72w1IVddikLS0d6VUQQBEFFwB57x46afNO/qcZfovkmpprYYmJJYkmMiS1RY4+iSJPeF5ayvc/8/jhoQFj2zj3nzp3Zfd6v17xMYO85zy6zc5977rnPYyGE6KjSgLHAMGAI0BfoDXQHgkAOEAUOAq3AbmArsA1YCawAPgCq4xy3EEIIIWJgAScA3wDeAJpQJ3idV/Ohsb4JjI/ftyKEEEKI9vQFvgZsRv+E395rI/CtQ3MKIYQQwgMTgCdRy/dun/g//2oB/ghMdP27FEIIIQQAI4DniP9Jv63Xs8AoV79jIYQQohPLA36BN1f87b1agZ8Cua5990IIIUQntBgox/sTfXuvcuB0l34GQgghRKeRDvwa70/ssb5+DqS68PMQQgghOrzewHt4fzJ3+nofKDL+UxFCCCE6sEnAHrw/ieu+dgNjDP9shBBCiA7pRKAK70/epl7VwEyTPyAhhBCio5kNNOD9Sdv0qw44yeDPSQihyfI6ACHEZyYB/0DV8O+IqoAZqH0NbipA3XYYhNqD0BfoBqTw359tHVAP7AO2oCocbkTtW9jgcnxCCCHEZ/oD+/H+St3tVznmNwZ2By4Cfg/sNBTj08CtwADDsQohhBCfyUR13/P65Byv13/QX+XIBC4GXsH9wkgfA98GBmvGLERCkVsAQnjvUWCpW4NnhVIY06MXw/K7MSy/OwUZmWSnpJAVCuO3LOpamqnYvoNNW7awsaGW92qreKe2kqrWFrdCAvgt6gQeq77ATcAlQIbBeOx6FVWN8QnUXg0hkpYkAEJ463zgIdODhvx+ZhX1Y37JQKb1LiLk97d7TKRiH62btgLQGo3yZs1Bnjq4h+cPVtAYjZgOEWARqpmRHcXA14FzgIAbwcRoL/D/gJ+gnnIQIulIAiCEd3oCq4FsUwMGfX4Wl5Zx9Ygx9EzPjPn4yJ69tG7ZfsSf7W1u4v6K7Ty6bxcNEaOJQAUwBFXvoC05qBP/VUDI5OSG7AN+BNyL2uQoRNJo/7JACOGWnwFjTQ02uVcfHpizkAX9BpEZSnE0hpWeDq2tRGvrPvuzdL+fKZm5nJbTjW1NDWxurDcVchrQBbXh7ljOAZ4BTiZxP6vSUE82XILaxLkCtW9AiIQnKwBCeGMi8DoGfgfTAkHuGDeFcwcPM/MLHY3Ssm4D0apjr2w/tn833965wdRqQAT1+ONbh/1ZN+CXJGdTobeB6w/9V4iElqhZtRAd3Y+AMt1B8lPTeGDOGcwsKjGXzVsWvuwsIvv2wzFO8kNSM5ie2YWXq/dRG2nVng3oBzxw6P+fCjwPnKA7sEcKgEtRmxXfBGo9jUaI45AVACHizw8cRHMXe1FWDr+dvYDCLGNbCI4QOXCQ1vWb2vz7HU0NXLxxJVubjNwSOAmYDHwD8JkYMAFUovYv3It6VFGIhCIJgBDxVwRs1hmga2oaT56+hIKM2Df6xaJl3QailW3vbdvR1MA5G1awp7lJd6paVOvjjugt1COPq70ORIjDdZRMW4hkonXrLS0Q5JezTnf95A8QKCwAq+3rhIJQmF8WDyXs0/4o6agnf4DxqOJHy5HbriKBSAIgRPxtBxxfMn9j8okMy+9mMJzjCIfx5eUe90tKw+l8pVf/+MSTvMLA91AbP6WioEgIkgAIEX9NqIpyMTuxT1/O6B/f84evZ/fjrgIAnJnXnVOy8+MUUVKT1QCRMCQBEMIbP4n1gIxgiP+dHP+OulZqGF9m+/sVv9irhDSfnNNs+HQ14BXMN0YSwjbZBCiEd54G5tv94runz2Jh/0EuhtO26P4DtGzY3O7X3Vu+hZ+Wb3U/IHs2Aa+hNuFtR1Xtqzj0d3lALtAD9cjheGAYEIxzjAeBK4HH4jyvEJIACOGhDOA5YEp7X3jzCRO5dqSxooGxi0Rp/uAjaD3+02wHW5uZsfod6vTrAzi1Fvg1qsHS9na+9vNSgVmoCoTz0e9YGIv7gWVI3QARR7JeJ4R3moCHgWjA5xsXiUaPuvosysrh7umzWFw6JP7RHc6yiNbUQcPxG+CFfX52Nzeysr4mToF95nlUOd7bURvtnNTlb0ElEE+gnt1fBwxAVSZ02yhUc6R/A7viMJ8QsgIgRCJ4+7zLfvvmrh0Xrd1fQUNLC3nhVEZ178nY7r3wtbMBL14ie/fRurn95f0P6qpYun5FHCIC4CPgNlQC4AYLWADcCYxzaY7DNR2a64dITwHhssT4ZBGik9tw6bL1qJK4CStaX0/LyjXtfx0wY/Xb7GpudDOcJuCLqJLK8brfsADVArgkDnM9A3wB1WBICFfIUwBCeGzTF27MIcFP/gBWOAw2dvlbwPiMHDdD2QycCNxNfEvsPgUMAm4Ejt0pyZz5wAeo8shCuEISACG8ZkVLvQ7BFsvCSrXXZnhsujv9CYDfA8OBN9yaoB3NwD3AEOAPLs/VB3gZuBVZrRUukARACI+1WiRHAgBYKfYSgH7hVDem/3/Aubh/9W3HNmApaiVirYvzBIG7UI+MdnFxHtEJSQIghMcsK9LT6xhsC9p7TL5vitEEIAp8CbiFxNsY90/UDv67gaN7J5szD3gfuSUgDJIEQAiPWfi02gLHkxWw95GR7Q+a/HC5Bfi2ueGMq0ct009FPTrolj6o6oG3I7cEhAGSAAjhsahF0iQAdjYBgjo7pfmNlBn5DuqRuGTwb2AkqsyvW5sTA8B3gX+gqhgK4ZgkAEJ4zIok0e9hDNedPv2L1N+ilv6TST1wB3ASsMXFeU4G3gWmuziH6OCS54NHiA4q4ovEvWyeY632b3PX6pUDfh+4hsS752/Xq6inFR5xcY4C4EXga0hVV+FAwOsAhOjsrKiVNAlANGIvAaiNtNIadXzujgILUVfTAOmo4jt9Ud3zenHkxUsE2IFq/vPp6/g1i+OjCjgfeAlVWjjdhTn8wFdRmwPPB8pdmEN0UJIACOExC/YmzWVuU5OtL9vSWN/+F7WtFtUgadKh/w4ltivcZuBN4IVDrzdxd4d+e+5H9Sf4HTDapTlmogoHXQr81aU5RAcjtwCE8Jzl5s5xo6I2E4CNjXU602Sgls6vBUYQ+/J2ELUj/+uoE+961H35eDT1actaYCKqloFb+V4P4FngJ8S3k6FIUpIACOE1y9VCMkZF6+3V93+/NhFq9XymGPU0wTbgZ3iXCDShHmlcgHs1/i3U3on3gBNcmkN0EJIACOGxkl/dUw7s9jqOdjU2QkuLrS99o+agy8E4EgKuBD5BPUtvr6yhec+gige5Wc540KHx70Q2CIo2SAIgRCKIWi+vP7ifP69fw+/XrOSVbZvZV691H924SI29Zf0NjXW6twDcloV6lv5NYKBHMWxFPcL3A9y7JRBEFVB6GbWBUogjSDUpIbx3Zl449Z79DfW9D/9Dv8/HjD7F3D52MsXZrnbXs6V14xYi+9pfuf7h7s38fM+2OERkRDVwFWqDnlfmoWoeuFnrvwpYBjzg4hwiycjSkBDe8QG/AL5X39KS9fm/jEajbKw8wB/WrmRAbhf65eTFP8L/BkPr1m3QzmOADZEId25bR51eDYB4SgHOQl0tv+RRDOtQXQ7Ho8r9uiEF9WjleOA1oNKleUQSkQRACO/8ELVh67hao1H+tnkD43sWUJBxVJ4QF5GqGqJ7K9r9ut/v28XfKtv/ugQ0DcgDnvdo/krgQSAV9fijW6uzA4DLUI9avkPyFloSBsgeACG8MRm1JGtLayTCrf/8OzXN9h7DMy1Ssa/dr6lubeFnybP0fyzLUCsyXt0abQGWA/OB9n/gzmUA96AekZQnBToxWQEQwhs/BMpiOaC6qYmqxkZmFBa7FNKxRZubiWzZ1u614l27N/FmYu7+j8VoVNGgf3oYwyeoPQnjgEIX5+mNWg3oj0oGal2cSyQgSQCEiD8f8GvUY2kxWVmxh/E9C+idGb9bAZEdu4nWHP/c8GbNQb61c2NHWU8+EVW4Z6WHMVQBD6Hu3U/GvVUJC1Vs6TKgDtWDwcuqiSKO5BaAEPHXB4d14aPATa88z644FdqJNjcTqTj+Pf29zU3cunWtTu3/RGMBvwHGeBxHC6qC4RzcrxORi+pXsAbVU0DODZ2A/CMLEX9av3fldbVc9vdn4rIfoHXbruN2AKxpbeXKzR9T0eLN3gQXhVFX4KleB4LamDgC+Esc5ipBfd8rUE8NyDmiA5NbAELEXz1wGxrNuCrq63h/z25m9+1HyO/Or3G0ppbI1u1t/n1tpJVrtnzMB3UJVfbXpHzUhrm/eR0I6v78o6jNgSfhfiO3bsBSYDHQCKxCrUiIDkQKAQnhjReBGbqDDM7L59ezF9A9zWyn2WgkQuvHa4g2HLv2/76WJq7Y9DEf18e1k/FuVMe77Ydeu1G3UrqhSt9OQy1lmxRBddp72fC4OoahkoEhcZyzHNVk6Deon72XwqjiSQtQjzWGgS2oOg4P4V6fhQ5HEgAhvLEA+LOJgXqmZ/L/TpzFuB4FJoYDoHXT1jYf/XuntpJbt66h3P1bEBHgFVTt/BdRm/KOt9HAj7o6vgE4DXOfb6uB4STWFXAqqozw1cT3czyC+rd4APgTauNgvEwAvgAsAdoqjVmF2jdxX5xiSmqSAAjhnb8Bs00M5LMsLiobwa1jJxH2660OR8orVNW/z6mPtPKT8q38pmKH2xv+dgL3H3ptcjjGdFTnv0GGYroOdQWcaGYBv8TdxwXbUg38A/U+fh7V38AkP2oj5kzgPGBwDMf+AHWbTRyHJABCeKcIdVWbYWrAXhmZXDV8DItLywj6Yt8bED1YRcv6jXDYCb4lGuXpA3v4cfkWdjXbawfs0GZUk57foFrn6spA1dg/y8BYe1HLzYlYQjcLuAu4HG8/01cB/0ZtIFwBfIj9n5cFFKBqEoxE3R6bBmRrxHMu6laJaIMkAEJ463rU41dG9crI5JxBQ5lfMpA+mfY+Q6PV1bSs3QhRtet/d3Mjzx7cy6P7drGjqcF0iIfbC3wZdcXfbHhsC/g56uSo67uo9rqJaiZqNaCvx3EcrhyoQP0b7wEOojYwZh76+2zUib8f6l6+SdtRCYWrWWsykwRACG/5UPe5p7o1wciuPZjUqw/DunZjWH43eqZnHvU1rZXV7Fi9mo11NbxXV8Ub1QdZUVfldkWYVtSy+ldRJwa3+FCbw87VHOcgqnpeIlfMywS+h+pwKJ/vai/IX70OQggh2tIDtYs5Go+X37KiueHUaHF2TrQkOzfaPZwWDft8cZn7sNcqVGe6eElFVbnTjfuqOMas4yRUUZ94/7sm2uvbuj9IIYRw2wjUpiqvPzDj8fop5pd77eiPunrXif2juEftXBC4BbVy4fW/uVev32j/FIUQIg5ORy2Le/2h6darFbjY2E/LmZvQ/z5K4x61nu6o3hMd+b3V1useAz8/IYSIiyvomB/UEeBSgz8np/zo3wq4Me5RmzEWeAPv3wvxfF1i5CcnhBBxshT1GJzXH56mXi3AlUZ/QnpOQe/7+Xv8QzbGAi4AtuH9+8LtVz1q9UMIIZLKXFSVNa8/RHVfDcDZhn82JryE8++phuRvkpOCegR1J96/R9x63W3spyWEEHE2GfUss9cfpE5fuw59D4loCXrf24D4h+yKVNS+iGR+nx3r9S7ebDQVQghj8lG18L3+QI319RqqwEuiSkHviQAT1QUTSQi4EFW9z+v3ju7redruFSCEEEnFQm08a8D7D9f2Xk3A/5AcrcZfwfn3+dX4hxsXFqq/wJMk3z6U91Dti6UAkhCiQ7FQ9dW9/pBt7/UhyfMB/F2cf5+/8CDeeOsB3E5iFxSqQj3iOM6ln4EQQnjuVLz/sLX7OtWln4Fpl+P8e3zGg3i9NBz4BqqCo9fvrzpUK+0lqD0MQgjRoensWo/362WXfgamzcT59/ieB/EmioHA1cATqEY/8XhPrQbuA+YBae5/i51DsizVCdGZjQPe8jqIGE0g8WMeivPSvltIrK57XvEBg4FRh70Go24fONEKbEW1yV6BKtr0OqqroDBMEgAhEt+TwJleBxGjP5L4O+X7oE42TuxBiswcTwpQiPoZdwOyUMv14UP/rQUqD71qUH0wdqD+PUy3hBZtkARAiMQ2ELX86bjwTP/Rs4hEWqnYuZGafduItLYc8+ssn5/0vAIyuxZj+QPsXPmi0ylBlf4tA9bqDOKyLNQJyInqQ8cLkbQCXgcghDiu29A4+WfkdGfp/zxJIBSmrinKnupWmusqaW6ooaWpDgB/MJVQaiaBcCY+v/pIaG1u4PGbB1Jf6Xjl1Qfcitpol6haNY6VzWci6SV7OUshOrIewPk6A0xYsIxASBVESw1ZhPw+Qum5pHfpQ3bPUrJ7lpKRX0goPfezkz+APximbPb1WsGjas730h3ERToroMlQ50CI45IEQIjEdTMa5UxTUjMZM/eKz/6/BWSl2v+VH3zylYTSsp1OD+o+cLJ2zmtP1OsAhNAlCYAQiSkL1RrYsTFzryCcfmRF1PQQ+H32LnyDqVmUnqjdwfcqErcsq84KgCQAIulJAiBEYroacHz5HQimMP70o5fwLQsyY1hTKJu9DH8gxWkYAJmoJCAR6SQAEWNRCOERSQCESDxh4AadAYafdC5ZXY7diyczxcLmIgBpuT3pN/lcnVBAfS+J2JlNJwFoMhaFEB6RBECIxHMR0NPpwZblY+LCm9r8e58FGSn2z31D596MZWl9VPRAdZpLNDpLG7XGohDCI5IACJFY/MAtOgMMmriAroWDj/s1mWH7l7/ZPQdSOHq+Tkigmsok2s55nZKy9caiEMIjkgAIkVjOBAboDDDpzJvb/ZqAzyI9huvf4fOXa0QEQAlwhu4ghqVrHFtnLAohPCIJgBCJRevqv++w6fQZNMHW12aF7f/655eMocfgaU7D+tSXSKzqozorAJIAiKQnCYAQieNkYLzOAFMW3Wb7a4N+SAvaPx8PP83+2G0YCczQHcQgWQEQnZokAEIkjtt1Du7edxj9Rs+K6ZjsVPsJQMHwWXQpGhlrWJ+n9T0aJisAolOTBECIxDAKOEVngMmLbsWyYlthDwUgJWj/64fObfvpAptOQX2viUA2AYpOTRIAIRKD1i67nO5FDJ262NGx2WH7SUPfcYvIyC9yNM9hEmUVQKehj6wAiKQnCYAQ3isBFukMMOmMm49o5hOL1KBFyOahPn+AoXO0VwEWAf11BzFAEgDRqUkCIIT3bkOjNXdaZhdGzrxIK4CsGAoDDZh+EeHMrjrT+VGNjrymkwDILQCR9CQBEMJb3VCV/xwbv+B6QmGdDe2QnmIRsFkfOBBKY/ApV2vNB1yMqhDoJUkARKcmCYAQ3roBjRNRKJzO2LlXGgkkK4Zq/YNPuZpgOENnujBwnc4ABkgCIDo1SQCE8E46oHX2Hj37UtKy8o0Ek5Fi4bf5iZCSnsfA6RfrTnkdGh0PDZAEQHRqkgAI4Z2rgC5OD/YHgkxYsMxYMFaMTYKGzLkJXyCkM2U2cJnOAJpkE6Do1CQBEMIbQUDr7D102lJyumk/kneErBTLdq3e9LwCSiY4e/TwMDcBWlmEBlkBEJ2aJABCeON8oNDx0ZbF5LO02gYck88HGTHUBRg27zbdVsEFwHk6A2iQBEB0apIACBF/FppNfwaOnUu3oiGGwjlSVljdDrAjp9cgeo84VXfK2/Hms0gSANGpSQIgRPwtALTO3rE0/YlVwGeRFoplFeBW3SlLgfm6gzggewBEpyYJgBDxp3X27jN4IoVlk03FckyxlAfuPnAy3QZM1J3Si/LAOnsPmo1FIYRHJAEQIr6mAZN0BphytlbbAFuCflUi2K5hp2mvAkwEpuoOEqOoxrHy2SmSnryJhYgvrSvd/N6lDBw711Qsx5UVQ6vgwlGnkVNQpjtlvFcBIhrHymenSHryJhYifoYBc3QGmHL2ct1d97aFA5Bit0OBZZloFTwXGKk7SAx0EoDY+i4LkYAkARAifpajceLIyu/NsOlLDYZjY84Y9gL0m3QO6V366ExnEd8mQbICIDo1eRMLER+FwBKdASYuvAG/XuW9mKWGLEJ+e1/r8wcZMlu7MuFSwGx1o7bpJAA2fypCJC5JAISIj5tR1f8cSc3IZfTsSw2GY48FZKba/5gYeOIlpKTn6UwZJH6rAK0ax6YZi0IIj0gCIIT78gCts/fYeVeTkpppKJzYpAex3So4GM5g0Ezt7oSXAWY6HB1fjcaxWcaiEMIjkgAI4b5lgOPeuYFQmHGnXW0wnNhYFmTG0Cq47JRr8Yd0auyQBlyrM4BNlRrHetnFUAgjJAEQwl3aJ7PRsy4mI7eHoXCcyUix8NvcDxjO6sqAqRfpTqmVNNmkkwDICoBIepIACOEureVsn8/PhAU3GgzHYRxWbE2Chs69CZ/f7jOEx5QHXKwzgA2SAIhOTRIAIdwTQLW7dWzw5DPJ61liKBw9mSn2PzAyu/al77izdKe8BfUzdItOAqC101GIRCCPsgjhnnOAS3QG2L/zE7Z+/BrNjXXk9igmmKJ1b12Lz7JojURpsrl3Pqt7CWtf/pXOlDnAOuAjnUGOYyDgNEs5ADxgMBYh4k6qWQnhDgv4ABhuasBgKJWh05cwYcEyuvcdZmrYmLREYMdB+4/P//2ueez46B86U36Iqg6oU7e/LbOA5x0euxHoZzAWIeJOVgCEcMccDD/PHmltYffGD3j3uV+wd+squhUNJT07Hk/L/ZfPgpZWaLa5CpCWV8D61x7SmbI78Dbwic4gbQgA1zk8NgP4Nu4kJkLEhSQAQrjj17hY0W7v1lW897dfUle9j8KyyQSCKW5NdZSA36Km0d55L7NrX3Z89A/q9u/QmbIP8FudAdpQB3wRZyuhfuAXQLXRiISII9kEKIR5E1Btf10VaW3hraf/j/uuG8W21W+4Pd1nQjG2Ch46R7tJ0DTUz9S0emCPxvF9DcUhhCdkBUAI8+4FBsdrsobaSla89BD+QIg+ZZOwLPe39vj8UNto72uze5Wy8c3HaKzZrzNlPvAHnQHacDZQ4PDYV1H7PIRISpIACGFWKfBj4rzBNhqNsHHFS1RsW03puHm6z+C3K+izaGiO0mpjP6BlWQSCKWx7/y86U5YCjwN7dQY5hlnAEIfH7gD+ajAWIeJKbgEIYdZyPPy9+vi1J3jka/Npaqh1fa7MWFoFTzmftBytaoYWqi6AaZs1jh1jKgghvCAJgBDmFADnex3Epg9f4eGvnEZTg06vm/alhyyCNj9B/IEUymZdrzvlBagNgSat0Th2BBDf/sxCGCQJgBDm3EiCnBC2rnqdx797DpGITsfb9mXF0Cq4dMblhNK0eugEUT0CTPpQ49gwMNRUIELEm+wBEMKMbOAh1EkhIezfuZ7G2kr6nzDbtTmCfqhpgqiNpwL9wTBNdQfZs+7fOlMOA+4DGnQGOcwB4A6cXwz9B3jPUCxCxJWsAAhhxjUkYIvYN5/+MR++/Ihr41sWZMVQgqBs1vX4A1o1CzJRP2tT6oG1GsdPNRWIEPEmCYAQ+lIA7Rvcbnn2J9exb+d618bPCFv4bO4HTMvpQb8p2tskbgBMNkXQKaIwG/kcFUlK3rhC6PsC0NPpwT7LIuBz71exqaGGZ+69kqiddXoHYm0VPGzuTViW1vfbDbhIZ4DP0UkAuqJ6FQiRdGQPgBB6/MDv0GgPO6tvP55acA4n9elLaV4+jS0t7KgxW2H24J4t5BcMcK2JUMgP1TYLA6VkdOHA9pUc3KmzAZ9BwE8xU4u/AbhW4/hy4BUDcQgRV9INUAg9i9GsUPfk6YsZ2fXIZ+TXHdjHg6tW8Ni6VbRG7HffO57MvF4s+9UagiF3Wgrvq41QYzMJqNj4Ls98bbLulEuAx3QHQX0ObsN5RcBVOC8mJIRnZAVACD0PAL2cHjy+Z2+uHTn2qD/vkprGjMJiTi4sZsXecvbW1+nECEBTfTXpWfn0HjRee6xjCfotqm02CUrL7UX52teo2btZZ8oSVEMeE4bjfCm/K/Aken0FhIg72QMghHMzgRN0Brhq+PEPL+vSlT+fvoTLh43WmeYzrz95Ny3NNi/TYxT0Q1oohr0Ap92qO+UJqH8DE/6hebzJPQlCxIUkAEI4d7vOwYPz8pnau/2OwX6fjzvGTeG2MZN0pgOgev9OVv/7T9rjtCUr1X4CUDDsFPIKR+hOqfVvcJjngRaN4y8kQYpACWGX3AIQwpkTgO/qDPCl8VMZlJdv++vH9OhFaiDA6zu36UxLQ80BRp58odYYbQn4oLEZWmxuWwilZrHlXa2EpAR4FtilMwhQB0w/NJ4T6aiqgqs04xAibmQFQAhnlusc3Cczi9OKB8R83OXDT2BmkdNzlLLpo39SVbFda4zjyYphj2Hx+EVkdivWnVLr3+Iwf9Q8/mYjUQgRJ5IACBG7/sBZOgNcMnQUfgfP/lvA96bOpGd6pvPJo1HWveNeF9vUoEXIZjdiy+dn6Jwbdac8C/VvoutPgE7zhInAFANxCBEXkgAIEbtb0Lh9lhdO5eyBzp8ay0kJc+NovZ38697+i9bx7clKsb8XYMDUiwhnddWZzo+ZVsG7UHsBdJhajRDCdZIACBEb7Sp0XxgyktSAzUvkNpwxYDDF2TmOj9+66t+uVQYESEuxCNpMkfyhVMpO0anDA8DFaFRjPMxvNY+fj1oJECLhSQIgRGy06tCnBYOcN1i/Gp/fsrhk6CjHxzfUHmS/i/0BLCAzhvLAg2ZeSTCcoTOlqX4MTwP7NMf4loE4hHCdJABC2KfdiW7JwCHkpJjpGDyzsESrlOfujR8YiaMtGSELv81PmJT0PAaeeInulFej/o10NAK/0hzjJGCO5hhCuE4SACHsuwpwvO4e8Pm0rto/r1taOoO7OL93fqB8s7FYjsWyIDOGvQBDTr0RX0DrUfoc4EqdAQ75MdCsOca9gJlMTwiXSAIghD0hIMtTtQAAIABJREFU1PK/Y6f3K6VXhu4F6pEm9+rj+NiD5ZsMRnJsmSmW7VWK9LwC+k1cqjvljegX5NkBPKE5Rn/gNs0xhHCVJABC2HM+zpvFYAFXGCrne7iSnFzHx9ZV7TcYybH5fLG1Ch4692a1dOBcAerfStfd6HcavBPVtVCIhCQJgBDts9B8zOzkwhIG5HYxFM5/5YfTHB/b3FhrMJK2ZYfttx3NKRhM4ajTdKdcjv5n23vAM5pjpAKPAEHNcYRwhSQAQrRvAVCmM8AV7TT9cSot6Pzc0txYbzCStvl9VrybBJWi/s10fQ39VYDRqJUAIRKOJABCtE+r4cwJ3XtyQncTj6gfraHFef+aYIrjpxljlh1Dk6BuAybSfeBk3SlNFOR5H1UdUNeXgWkGxhHCKEkAhDi+6cAEnQGuHD7GUChHO6BxFR9KNbsh8XiCfkgLxrAKME97FWAC6t9O1x1Ak+YYAeAPmClUJIQxkgAIcXxaV5IDcrswo1C72U2bNlUedHxsSlr8EgCIrVVwnxFzyO3tvFzyISZWAT4B7jEwTg9UEiD7AUTCkARAiLYNR7Ogy5XDR2sV62nPB3t2Oz42p2uRwUjalxKAsN3Tn2WpJwL0zAVMFF74JvrthgGmAg9gf0+kEK6SBECIti1H48O6Z3om80tKDYZzpPqWFt4rd35e6lIQeztiXbGUBy6ZuIT0Ls7rHBxioklQNaB9T+KQc4CvGhpLCC2SAAhxbEXAEp0BLh02ioCDlr92vbBlIw2tzjcB5veJ/yPqqUH7TYJ8/iBDT9VuFbwE6Ks7CPA7VJ8AE74CXGZoLCEckwRAiGO7BbV5y5GclDBLNFr+2vHImg8dHxsKZ5DfO/4JgAVkxbAKMPDEi0nJ0KqfEAC07yUccjXgfNPFf1nAz4ELDIwlhGOSAAhxtHzgUp0Bzi8brvWMfnve2Lmdd3bvdHx80dAp+APe7EdLD1kEfPaSgEBKOoNnXqU75aWof1NdO9EsB30YH/AbQLv2sRBOSQIgxNGuAxyX2EsNBLiobITBcI7UEonwjTf/qTVG8fCTDEUTO8uCzBja5Aw+5RoCIecVD1H/ltfpDHCYB4GHDY3lBx4CLjQ0nhAxkQRAiCOlAdfqDHD2wCHkhd0rsvPD/7zJugN6LesHjptnKBpnMlIs/DbvBIQz8xkw/SLdKa8HMnQHOeQqYLWhsQLAb5HGQcIDkgAIcaTL0Vgu9htu+ft5f9u8nl98+J7WGL0HjSe/90BDETnjs2JsEjTnJnx+x1syAPLQvK1zmFrUbv4GQ+NZwPeBbyOPCIo4kgRAiP8KAjfpDDC7qB99MrMMhXOkV3ds5eZXnicS1StPP+IkE83y9GWGLWxuBSAjv4ji8WfrTnkT5grxrEDt5NftFXC4O4Hfo3H7SYhYSAIgxH8tRT3+59gr2zbz9Ia1hsL5ryfWreLyvz9DY2ur1jipmXkMn3Geoaj0+C1IT4lrq+AizG66ewR11W7SYuBVQLsAghDtsflErhAdnoXakNVdZ5DmSITnN2/gQGM943oWEPTp/YodbGzgf15/mR9/8Lb2lT/AlEW30X/0KdrjmBL0W1Q32Pu+UrO7U7HhbarKN+hMOQD4mc4An/MKMAwYbHDMnqhbDO8AWwyOK8QRJAEQQjkNzeX/w324t5zH160i4PMxuEt+zAWB6ltaeHj1h1z/0nO8v8dEFVoIp2dz1vKHCYbi1wWwPT4LWlqh2ebCRnpuAetfe0hnym6oE+snOoMcJgr8BTgJs1ftGainA6LAa5i91SAEIBtOhPjUv1C12o3rmprGrL79mNGnmAm9ehNuYzNbQ2sL7+7eyT+2bOTZjes42Ghqj5ky54ofMv50U0/DmdPUCrsqI7a//tmvT2Xvhrd1pnwV8+15c4GXATee/3wROB9w3vhBiGOQBEAImAj8Ox4Tpfj9lGTnUpCZRXogSIQodc3NbKmqZEtVJc0RvXv8belRMoIrfvQWPs1bEm7ZUx2lvtneRe6W957ipXsW6045GfP/5j1QiaQbTRb2oh5PfdyFsUUnJQmAEPBnYIHXQbjFHwhyyV3/omDAGK9DaVNDc5TyansJQDQa4U93jKBy1zqdKZ8CFuoM0IYi1L6Avi6MDfAYKhGocGl80YnIUwCisxsMzPc6CDfN/MJ3EvrkDxAOWqTYfMzfsnwmWgXPx+zGvU9tQd1e0MpOjmMxsPLQf4XQIgmA6OxuowP/HgyasIAJC5Z5HYYtsTQJ6jf5XNJye+pM58O96nvbgOmoE7UbugN/AJ7HndsNopNIzBuCQsRHb+BXdNDfg4KBYznny08SCKZ4HYotQb9FXVOUiI07AT5fgGg0ws6VL+pMOQRVhrdKZ5A21KCW62cAvVwYH6AfcAWQArwJOO8NLTqlDnvlI4QNNwMhr4NwQ17PfpzzlT8RCpsqfx8fWWH7H0mDZlxOKC1HZ7oQBh/9PIZ9wImo/QZuSQH+B3XL4Qo6aDIr3CFvFtFZ5aIK/yTH5XEMuhUN4cJvPU9mntYSuSeCfqhptPfQuz+QQnN9FeXrXteZciiqMJDZZy7/qxm1cz8bmODSHABZqH0N84ANwCYX5xIdhKwAiM7qGiDT6yBMKyybzMXfe5msLgVeh+KIZUFWDHWKymZdhz8YQ2/ho2Wi3gtuagVuBJYd+t9uGg28APwVOMHluUSSkxUA0RmlAo8C6V4HYtIJp17GotseJiU1ufOaoN+ipjFqaxUgGM6gdv8O9m3+j86UQ4Gf4P499LdRVf3m4P57bwCqs+UYVNXDnS7PJ5KQrACIzugLqJKwjvh8fvyBxNk6kJKayVm3Psj86+4jENK6Gk4IPgsyY2oSdBOWXoGjbqj3RDy8hLpKj0fhKQt1S+Ad4FlgXBzmFElEVgBEZ+NHdXHLczpA2ZRFLP7iY+zd8jEHyzcbC8yJgeNO49yv/pmiIVM8jcO0YACqG+19bUpGHge2f8zBHat1pixDrQLYr0nsXDXwIGr/Sbz+4QaiVgROOTT/WqS/QKcnCYDobJagdks7dsZN99O971BGzDif/IKB7N74AQ01Bw2FZ0+P4uEsvOnXTD/nfwina+2ET0g+y6IlEqXJ5h3zrG7FrH351zpT5gKrce/Z/c+LoO7Vvw+cTPxuRxUCZ6N+D5qAj5HHBzstKQUsOpv/AKOcHlwyYgYXfuv5I/6staWJD195lLeeupfdmz7Uje+4eg8az9TFdzBw7GlYVsf+9W2JwM6DEduXqc9/bw47P35JZ8r3Ucvz8dYNVY/Ci4qUe4H7gZ8jTw50Oh37E0SII81CVU9z7IJvPke/UTPb/Putq17nw5d/x6rXnqSuep/OVJ/Jyu/NsOlLGTHjfLoVDTEyZrLYWxOlrsleCrBz5Ys8//25ulPOBv6uO4hDlwE/RLUCjrcI6nfjPtQTBG4/rSASgCQAojN5AbXc6kjPfqO48h57bWgjkVZ2fvIeG99/ge3r3mb3xhVUVWxv9zifz09O9yK6FQ2jePiJFI84ia6FZR3+ar8tTS2wq8r+bfmnvzKBfZvf15nyRaDtDM99fYGfop4U8MpW1KrAQ8BGD+MQLuucnyqiMxqD2g3t2KLbH2HoVOc9WBrrqqis2E5VxXYa66poaWrA5/MTSsskFM4gI6c7eb36JdQTBomgvDpKg81WwZveepxXfnK+7pRjgXd1B9G0BPgRqsWwV6LAq8ADwBO4UzJZeEgSANFZPA4scnpwXs8Srvv5Knx6j5sJB2JqFRxp5cnlQ6neo3Xh+gRqo5zXcoDvonbve/3Idh3wR+D/gLc8jkUY4vWbSoh4GACcoTPAxDNulpO/R8JBi5DNH73l8zN0rnZ5/zNIjC57B4GrUCWEteodG5AGnI9qOvQnNB6jFYlDEgDRGdyKxiOvGTndGTnzQoPhiFhlpdpfrBww9UJSsx3XeQL1XrlVZwDD3gGmom4LbPY2FAAWoioadvE6EKFHEgDR0fUAtM7e4+ZfSzAUQ4F6YVxayCJg89PKHwxTdsp1ulNeiLf33z8vimovPBi4E1XMx0uDUa2URRKTBEB0dDcAjuvjpqRmMva0qwyGI5ywiLFV8MwrCYa1eiKEUe+dRNOA2hdQAtyFujfvlXnASR7OLzRJAiA6sizgap0BTjj1MlIzcg2FI3RkpIDfZ+9WQCgth9KTLtWd8mrUeygRVQDLUYnAPbjXzrg9cm8siUkCIDqyq1B92B3xB0JMWLDMYDhCh2VBZor9rx9y6g349B6pzEa9hxJZOarVcH9U/QCbHRSMGR/n+YRBkgCIjioFzSXc4SeeQ1Z+b0PhCBMywhY2FwFIy+1F99LJulPegHovJbodwLWoQkLfAQ7EaV6t3ZbCW5IAiI7qAqCX04Mty8eksxJpI7gA8FuQYbNVcPXezZSveU13yl6o91Ky2A18ESgCbkZV9XOT15sRhQZJAERH5EPzMa7S8fPo2meQoXCESZlhexXMPnzm+0Ram01MeSvJ91lZjeor0B+VwGhVwTwOrysmCg3J9qYWwo6FQKnOAJMX3WYoFGFawGeR1s6ifE3FVta/9pCpKUtR76lk1Aw8DIw79PoNUG9w/CcNjiXiTBIA0RHdrnNw0dCp9Bk0wVQswgXZ7TwS+NGzdxFpaTI5pdZ7KkG8A1wC9EataqzXHG8FqmyySFKSAIiO5kTUlY5jk+Xef8IL+iE1eOwbAbX7t/PJvx4wPeU4Os4z7/uBu1ErGzNRXf9qHYxxLtBiNjQRT5IAiI5G60qte9+hDBjjZSdWYVd2G+WBP3r2LlpbXHkabrkbg3oogmp/fCHQE7U68C9U1cHjWY9KtFe5GZxwnyQAoiMZAczWGWDSmbdgWdIkMxmkBCAcOPLP6g7sYt0/f+vWlLOBkW4N7rFq1P6A6aiNg18HPkAlCaCu9N8FlgHDgI88iFEYJgmA6EiWo9HiOqdbEUOnLTEYjnDb55sEffSXu2htdq0onkXHWwU4lo3A14BRQCqQD6QDY4Ef413VQWGYJACioygGFusMMPGMm/AHgobCEfEQDlqEDq0C1FeWs/aV+92ecjHQz+1JEkgTsO/Qf0UHIwmA6ChuBQLtflUbUjPzGHXKRQbDEfFgAZmHCgN99Jcf0Npk8gm3Y/IDN7k9iRDxIAmA6Ai6AFpn7/HzryMUzjAUjoin9JBFS+0+1rl/9f+pi4Gu8ZpMCLdIAiA6ghtQ9ygdCaakMW6eVtNA4SHLgtV/u5vmhpp4TZkGXB+vyYRwi+MlUyESRAaqCYpjo2ddTFpWvqFwhNuaG+vYt3M9+w+99u38hJWvPh7vMK4Fvg/ELesQwjRJAESyuxzIc3qwzx9g4hlySzfRtLY0U1WxnQO7N3Jg9yb2bP2YvVtXc2D3Rg6WbyEajbQ/iLvyUO+9H3odiBBOSQIgklkQ1QvdsWHTl5LTrchQOCIWkdYWKvdu++wkf/jJft/2dUQirV6H2J6bgZ8gO+RFkpIEQCSzc4FCx0dbFhMXauUPwob6mgPs3brqsyv4T0/2e7euptn9Xftu6g2cAxivOyxEPEgCIJKVBWi17Btwwqn0KBlhKJzOrbmxjl0bPmDvttXs3/kJ+3asZ9/OdRzYtZGWZlfK8iaK24AHab98rhAJRxIAkazmAUN0BpgiLX+17fzkPV5/8gesfeuZpDzRf/nCwXzzwdU6QwxBvRefMROREPEjCYBIVlolWXsPGk/R0KmmYul0Wpoa+Pv9y3n7Lz+DaHJe/E4b0ZXrz+rPc2/v5t01B3SGuh1JAEQSkjoAIhlNBqboDCBX/841N9bxu68v4O1n70vakz/AbUsHArDszP66Q2m/H4XwgiQAIhlptfzN711K6fj5pmLpdJ7+8VVsXPGS12FomTo8n/Fl6unRWeO6M7C3dhXIztAkSHQwkgCIZPPpPVfHJp91K5Ylb30n1rz5NB+98qjXYWjxWRZ3njfoiP9/rf4qgPaeFCHiTT4FRbK5DY2Wv1ldChh+0rkGw+lcXnnk616HoO3S0/oyZlDuEX921vQCenYJ6wzbWVoFiw5EEgCRTPqgnv13bMKCZfgDIUPhdC67NnzA7k0feh2GltEDc/nSBYOP+vNQwMeVp5foDn8O6j0qRFKQBEAkk5tQ1f8cCafncMKcyw2G07lsSvL7/tNGdOXJb04gLew/5t9fOLuInAzHby9Q782bdQYQIp4kARDJ4tPa646Nm3c1KamZhsLpfCq2r/E6BEfyskL872VD+P1Xx5MebvvJ54zUAF+Y01d3ussB6SwlkoLUARDJ4lpU5z9HAqEw4+ZrNQ3s9Brrk6PxXVpqgH7F2Ywf3Z2TpxYwvSyPwP46W8dePq+Ynz21kYYmx30I0oGrgW86HUCIeJEEQCQD7f7rI0++kIyc7obC6ZxC4XSvQ/hMSshPSVEW/Yqz6V+cRf/ibPr1zaZ/cTYFPY+MM9oapbayHlrbr1nQNSeFpSf34bfPbdYJ73rgbsBe1iGERyQBEMngYqCr04N9Pj+TzrzFYDidU9c+R2+ec1Mw4KOoTyb9irMZUKxO7v2Ks+jXN5vCggx8PnsPg1h+i1B+Ok3l9lYwrllYwkPPb6E14rjIUVfgEuD/nA4gRDxIAiASnR+1+c+xsslnkddTe4d3p1cy8mRXxu3RLY2ygbn0LcyiuCiT4sIsiguzGDwwl3DKsTfsxSrYNZ3mvbVEbZzU+/ZIZ/6knvz5tZ06U94M/Axo0RlECDdJAiAS3WKgn84AkxfdaiiUzq1HyQh69hvFrg3vGxvzjLklPPB/MwgE3N2PbAV9BPLSaK6otfX1153ZXzcBKEa9d3+nM4gQbpKnAEQi0y6u0m/UTHr2G2UoHDHjgm8YHe9Pf93IBde+SFNzxOi4xxLsngaWvdsGw/tlM32k47tOn1qORtEqIdxmZn1NCHecCmhdvs+/7qfk9pDlf1O69OpP9f5d7Fr/H2Njrl1/kBUfV7BwbjEBv3vXJJbfR6S+mUiDvVX5nnlhHnt5u86UPYA3gfU6gwjhFlkBEIlM6+q/V//Rrt237szmXnUvA8edZnTM517cyuLL/k69zZOzU6Ee9p8knToin5H9c3Sn1GpcJYSbJAEQiWoscJLOAFPOltLsbvAHgiz54mMMnnSG0XH/8co2FlzwHDW1zUbHPZwvNUgg034p6OvO1Np+AnAiMFF3ECHcIAmASFR36hyc26OYQRMXmopFfI4/EOLsOx5l+IlmGyu99tYuFl74HNU17iUBge72q0GeNrEnJb206x/ILlSRkGQPgEhEpcCP0dhAdcoXvkPBgDHmIhJHsSwfpRNO52D5FsoNNgnatrOGl17dwRlzS0g9Tulep3wpflqqGona2HjosyyCQR//eKdcZ8pS4HGgQmcQIUyTFQCRiG5D472ZkdOd4TPOMxiOaIvP52fBjb9k1MyLjI77nw/3ctq5f2H/gQaj434q1N3+XoBzZvShe65Wq2Af0iRIJCBZARCJpgfwazRqVExb8kWKh59oLCBxfJblo3T8fOqrK9ix7l1j4+7eU8cLr27njLklpKWaXQnwpQRoOdBAtLX9VQC/36KlNcq/VmhdwA8B7geqdQYRwiRJAESi+Qow3enBKamZnHXbgwRCWldsIkaWZdH/hFNprD3I9rVvGxu3fG89z72whQVzislI12rVeyRLxdxS1Wjry8v6ZvHb57bQ6LxeQQCIAP9wOoAQpkkCIBJJFvAw4PjsPWHB9ZSOm2cuImGbZVn0Gz2Lpvpqtq9509i4FfsbeO7FrZx+al8yM+zv4G+PlRqgZV8d2CgPnBL0caCmiXfWHNCZcjhwH+DOfQ0hYiQJgEgkNwGOHzAPBFNYtPxhUlLt7/IWZlmWRf/Rs4hGImxZ+aqxcfcdaOCvL2zl9FOLyYrhMb7jsSwLohat1TZXAYqy+PVfN9Fqo6tgG1KASuA1pwMIYZIkACJRpACPAo7P3iNPucj4Y2nCmeLhJxIIpbLxgxeNjbn/YCNPPbeJ02YVkZudYmRMX1qA5oo6sHFOT08NsG1PPR9trNSZchjwE6RJkEgAkgCIRHEZcI7Tgy3Lx5m3PEB6dr7BkISOwrLJBFPSjCYBldVNPPP8ZubOLCIvRz8JsCwLWiK02iw+1L8gg9/8dYudfKEtGcBW4D3nQwhhhiQAIhH4gUeALk4HGDxpIePmXW0uImFEYdkkQqmZbHjf3N63quom/vjsRmbP6EPXLqna4/lSAzTvtdclMC8rxMpNlXyyvUZnyiGoVQCNPEIIfVIHQCSCM4EBOgNMOlMes05Uk864iXnX/sR2Jz47yvfWMWfJs6xau197LCvoJ5hnP5G4YZHWWxWgBDBbR1kIByQBEIngNp2D+w6dRp9BE0zFIlwwZs4VzLvm/4wmAXsq6jn9guco31unPVawW4btupOjBuQweajjxapPSZMg4TlJAITXZqAa/zg2eZFW/iDiZMycK1iw7BdYlrmPnZ27azn3yhdocv58PgC+cIBAlv2nT687s7/WfMAYQFpVCk/JHgDhtZ8Djluude87jFmXfl9t5hIJr2e/keT3HsiaN58mGtU7aX9q+84a+vTKYNQwvQ2gvpCf5n31tr62pFc6f3u7nD0H7D1C2IYeqLoXQnhCVgCEl0YAM3UGmLLoNjn5J5mh05Zw1m0P4Q+Yq+z3o1+sIGKjoM/x+NJD+GMoNHTNGdqtgmcBJ+gOIoRTkgAIL92BRse/nO5FDJl6tsFwRLwMmbKIRcsfwR8wU9Tnk42VfLBSv9leLE2CFkzuRZ9uabpTyv0r4RlJAIRXioFFOgNMOuMWfH7z7WJFfAyedAZL/+dJY30bTCQA/qwUfKn2ViYCfotrFpboTrkI0N5QIIQTkgAIr9yKRse/tKx8Rp1itgWtiL8BY05l6ZeeIBjSf55/zScHDUQEoW7ptr/23JmF5GVprWL4kVbBwiOSAAgvdAMu1hlg/PxrCaZoL7+KBND/hNmc89U/EwrbP/EeS6vmHoBPBXJT8aXY2x+dmuLnsnnFulN+AfU7IURcSQIgvLAMcHzJFwqnM1aq/nUoJSNmcN7XntFKAvLzDLWAtiDY1X4cl87tS1pY64GqVNTvhBBxJQmAiLd04CqdAUbPvpS0TO1CLCLBFA2dSmpGnuPjB/bLMRZLoEsaVsDex2NuZojzTynSnfI6IFt3ECFiIQmAiLer0Kj57w8EmbBALpY6oobaSir3bXd8fFlprrFYLJ9FMN/+LaZrzuhHyGbC0IZs4FKdAYSIlSQAIp6CaC51Dp22lJxu2ldbIgHt2fIxRJ3dxw8FffQvNnsBHeqajuW395Rqry5hFk7tpTvlzYCZ5yKFsEESABFP5wOFjo+2LCafdYu5aERC2bt1leNjB/bPIah3BX60gI9Anv1VgGWLBuDTK0pVAJynM4AQsZAEQMSLBWidvUvHnka3oiGGwhGJZs/Wjx0fO6TU+d6B4wl1S7ddqmpg7wxmjtHezH878rks4kTeaCJeTkf1QXdMmv50bHu2OE8ABg80d///cFbITzDH/gMr1+s3CSoF5usOIoQdkgCIeFmuc3Dv0nEUlk0yFYtIQDoJgFsrAADBHvZbBY8vy2PcYO1Yvqg7gBB2SAIg4mEaoHX2nrrkTkOhiERUV1VB7cE9jo93awUAVKtgf2aK7a+/7kztJkHjgKm6gwjRHkkARDzcrnNwfu9SBo6dayoWkYDKN33k+Ni01AB9+2QajOZosTQJmj22B6WF2vFo/c4IYYckAMJtw4A5OgNMOXs5liVv1Y5M9/6/z+duS2h/Rgh/ur0mQZYF1y7UXgWYC4zUHUSI45FWasJtt6HR8jcrvzfDpi81GI5IRDpPAJQZXv5vbonw0ap9bNtRQ8X+Brp3TaWwIJNBvdJprbXXcOjM6QV895E17NzX4DQMC1UX4EKnAwjRHkkAhJsKAa2z98SFNxjrGS8Sl04NgDJDGwA3ba3ilw+t4ndPfsKeivqj/r5PQQZLT+zNBTP70KOdvgOhgI8rF/Tjq/c7T2xQvztfBrboDCJEW2RdVbjpFlT1P0dSM3IZPVuqo3Z00WiUPVucJwC6TwBU7Gvgy995m9EzHudHP//wmCd/gG07arjrkTWMv+olvvTLlVRUNh533ItmF5GbqZW8BpFWwcJFkgAIt+QBl+gMMHbe1aSkuru5S3ivqmIbDTaX1o/FaQ+AAwcb+dYP32PI1Ee5+74PaGxqtXVcfWMrv3x2E2OveIlvPria6rqWY35dWtjPxXO0y1ZfBuTrDiLEsUgCINxyPWB/6/TnBEJhxp0mLX87A52r/5zsFHr1iK2FcG1dC3ff9wFlUx7lWz98j+qaZkdz1za08OMn1zP2yhf58ZPraWyKHPU1l80rJhzSahWcBlyrM4AQbZEEQLhB+0Nr9KyLycjtYSgckcj0CgDZv/pvao5w/+9WM2za7/nyd96msqrJ8byH21/VxDcfXM2Eq1/iwee30NL634ZG+dkpnDOzj+4Uy9BIpoVoiyQAwg2XAV2dHuzz+Zmw4EaD4YhE5vYGwEgkyh//spFRJz3GdXe8yu49dY7nO54dFfXc+tMPmXb9Kzz28nYihzobXruwHwGbXQXbkAdcbCJGIQ4nCYAwLYDmxqUhU88mr2eJoXBEotuzZaXjY4/3CGA0Cn99YQsT5jzJ+Ve/wKatVY7nicX6HTVc96P3OfGGf/L06zsp7J7G/EnarYJvQ2NDrRDHIgmAMG0JoLXzKaeb9sYpkSSi0Qh7t61xfHxbJYBf+Od2psz7I4sueZ6Vq/c7Hl/Hmi3VXPb991jwxX8zvkz7UcU+wGIDYQnxGXfLZ4nOxgI+AIbrDBJOz+aGX39CaoZ79d1FYti/awP3Xj7I8fHbPriQLoc9k//me+V85btv89pbu0yEZ5RlqVUJDR+iqgPqjSLEIbICIEyag+bJH6ChtpK3nv6xgXBEoivf7LwHQPeuaZ+d/FevO8CySkJuAAAgAElEQVT5V7/AyWc+lZAnf9A++YP63dIqqy3E4SQBECYZa2Dy5lP3aj0bLpKD7hMAW7ZXc90drzJu9hP88S8bTZxkE500CRLGSAIgTJmAavtrRENtJW898xNTw4kEtVejBsDKNfsZPu0P3P+71bS2dvwz/yHTUL9rQmiTBECYstz0gG8+dS9bPn5Nq0+8SGw6TYD2VNTT3HJ08Z1OQFYBhBGyCVCYUAqswsWEMhAKk9ujmG6FQ8jtUUxujxJyexTTtbCMzLyebk0rXNTa0sy3F+XQ2mKmIE8nEgWGon7nhHBMugEKE5bj8mpSS1MDe7euZu/W1Uf9XWpG7hFJQW6PEroWDqZb0VDC6dluhiU07NuxTk7+zlioRlvSKUtokRUAoasA2ACkeB3IsWTkdKdLwQDyevWnS68B5PXqR16vAXTp1Z9gSprX4XVqK//1B574/vleh9GmkhEzGHHy+bzzl5+xfe3bXofzeU1ACbDD60BE8pIVAKHrJhL05A9Qc7CcmoPlbPn4taP+7tOVg66FZXQtLPts9SC/dymhcGwNZkTs9miUAHZTwcCxnHzR/1IyYgYAI2ZcwMYPXuTv99/O7o0rPI7uMyHgRlSFQCEckRUAoSMH2AJkeR2ISZblI7dHX3qXTqBsypkMHHsaPr/kyqb9/n8XsebNp7wO4zPdioYw44JvUDp+PpZ19EdjNBrho1ce5eVHvs6B3Zs8iPAo1UAhIM/LCkckARA67gS+7XUQbutSMIA5V/6I/qNneR1Kh3Lv5YPYv2uD12GQ26OYE8/9CsNPOhfLan8rS2tLM//5+/386/ffpnr/zjhEeFxfohP8Dgp3SAIgnAoDm4HuHscRH5bFSed9lelLv+R1JB1CJNLK/y5MJxJp9SyGzLyeTFv6JUbPugR/IPY+O82Ndbz97E957Ym7qK/2pt8AUA70BRq8CkAkL7/XAYikdSmw1Osg4mnzh68QTEmjsGyS16Ekvbqqfbz+5A88mTs1M4+TzvsKZ976AH0GT8Tnc/Yx6A8EKSybxJg5V+ALBNi1/n0vnmrIQG0EfDfeE4vkJysAwgk/sAbo73Ug8ebz+bnkrn/Ru3Sc16Ektca6Kr6zuEtc5wyFM5iwcBmTzrjZlcdDaw/u4dXHvss7z/2C1uZG4+Mfx3pgEODdcopISrICIJw4G7jS6yC8EI1G2bttNaNnXex1KEktEEzh7Wfvo7mxLi5zjZt3DYvv/AOl4+YRCIXbP8iBUDid/ifMZuTJ51NVXc2+rSuJRuNSqTAP+PjQSwjbJAEQTjwA9PI6CK9UVWyndPx8qUCoadvqN6jYvta18X0+PyNPvpAlX3qModMWx+3RznB6NgPHzSd/xCIaqvdycOfRxatcUAL8Ih4TiY5DEgARq5lo1iL/2vKxfLR6P/X1LYZCir/MvJ70HTbd6zCSmmX5WPX6k24MzJApi1h85x8YPesST6pB+n3gS+tCwQlnUjjqNGr3baOq3NUnHnoBrwMb3ZxEdCySAIhY/Qzo5/Tg4UO6cP89M1g4t5gPV+1j644ag6HFT0paFsOmL/E6jKSW32cQH7/6OHVV+4yN2f+E2Sxa/ggTTr+etKx8Y+M6EfBZ1DRGScvpSb9J59Cr7CSqyjdQu2+bW1P2Ah5ya3DR8UgCIGIxGviezgDf+8pEhg7KIzcnhfPPLmXUsHwqq5vYVV6XVJ3dwunZnDBbSrHrsCwfPUpGsuKlh7XvlReWTeLMWx5g2pI7E+bWTMAHjc1RPn1bZ+QXMmDaRXQtGcvBHaupryw3PWUJ8Cywy/TAomOSpwBELP4ALHZ6cHFhFiteWUwgcHSxleaWCCtX72f9pko2bK5k/cZK1m+uZP2mKvYfSLxHnPsMmsClP3jV6zA6hPdfeICn77nCURLQo3g4My78JgPHznUhMn31TVH21ESP/otolE1vP8F/nvw6Vbs/MTnlY4AsTQlbJAEQdvUD1qKxavTDb07myouGxHzcgYONrN9UecRrw+Yq1m+qpKram25yQ6cuZtHtj3gyd0e0+t9/4ql7LqehttLW13fp1Z+Tzv8aQ6aebat6n5d2VUVoamO7S6S1hfWvPsgHf/4Wtfu3m5iuFfVI4HoTg4mOTRIAYdd9wFVOD+7aJZU1b5xDathsTf29FfV88mlSsEmtGKzfXMnGzZXU1rm3yXD2ZXcxceGNro3fGVXv38Urv/sGK156mJamY6/6dO0ziIln3MzIky9Imv4MtU1RKo61CnCY1uYG1rz4Cz585vs0VO/VnfLnaPyuis5DEgBhR3dU2V/HD1B/5dYx3LFstLGA7Ni5u5b1myp54pmN/Ophc53nfD4/y361lpxuRcbGFP/VWFfFxhUvUb7pQ6r37yIQCpPXsz9FQ6bQvXj4MRv1JLIosKsyQrONMj3NDdW89fCtfPKv3+pM2YAqD2x8k4HoWJLrN0l45VvAF50enJEeZO0b55KbE/+uwe+8v4fTL/grlVXmbhUMO/Eczrr1QWPjiY6vqiHKgbrjrwJ8qrF2P4/fNIDmBq0nZL6Dxu+s6BwS++aZSASZwDU6A1x8ziBPTv5vvLub+eeZPfmnZuYx6xKtByFEJ5SZYuG3+Wmbkp7HwBMv0Z3yatTvrhBtkgRAtOdKIMfpwcGAj+svG2YwHHv+9cZOFlzwHFU15k7+gWAKS774WMI8ZiaSh2WpJMCuIafegM8fe4fCw+TQSct1C/skARDHEwSW6Qyw9Iz+9O6VYSgce159cxeLLnmemtpmY2P6AyEW3f47qf4nHMtMsWzfc03P603JRO1mm7egsW9HdHySAIjjuRDo4/Rgy4IbrxxhMJz2/eOVbSy88DmjJ/9gKJVzv/pnBk043diYovPx+WJbBRj+/9m77/ioqrSB47+pmbRJ7yEkISE99N5BpIki0iyIfe2iiG3VLdbdfV131V1117ZWLKgoKiLNQhWQIr2EEkII6T2ZJPP+MViQNnPPnX6+nw+LSu5zzhK455l7z3meiXNFjzjGA5eJBJB8m0wApDPRAHeJBJgwOpWcrhEqTefcFi07xPTrF9PUrN7xP0NAEJc+/BFdeoxWLabkv8yB9u+8DkvIIrn7ONEh70He56UzkH8wpDOZBOSKBLjrJtd9+v/o8/1Mv24xzS3qtUQ3moK57A8LSO8+SrWYkn/TaTUEO/AUoNuF94kOmQVcJBpE8k0yAZDOZK7IxYP6xtO/V5xaczmrDz7dx6xbl6naS8AUHMbMRxeRVjhctZiSBGA22Z8AxHTpS1zXQaJD3i8aQPJNMgGQTmcYMEAkwJybu6s0lbN79+O9XHPHctpUXfzDueLPn9Mpu79qMSXpJwYdBBrsTwIKLrhbdMg+2P5OS9JJZAIgnc69IhdnZ4Rz/nDFewft9to7O7l2trqLf2BIBFc+uojkrL6qxZSk3zIH2p8AdOo2johkx3to/IbQ32nJN8kEQPqtQmCsSIC7b+2BVuvcIpMvv7WDW+//lo4O+6qr2SM4PJarnlxGYmYv1WJK0umY9GCy95i/RkP+eKH9uADjgB6iQSTfIhMA6bfuRaBEdFJCMFMmdlFxOqf6z+vbuf0BdRf/kIh4Zj3+FXGp+arFlKSzcWQvQPqA6YREp4gOOUc0gORbZAIg/VonYKpIgNm/64bR4Lw/Vk+/sJnZD36HVb21n7DoTlz9l+XEpggdepAkh5gMGox2NtfW6gzkjhGqyQUwA1tbb0kCZAIgnewebNX/FIkID2DW9CwVp3Oyp57fxO8fX6tqzLCYFGY9sYSoxAxV40rSuWgAs8n+W3DW8GswhUaLDKkD7hAJIPkWmQBIP4kCrhYJcPPV+YQEC9UvP6PHnt7AQ0+sUzVmeFxnrnpyKZEJ6arGlSR7BRlBb+d+GX1AMNkjbxAd8logRjSI5BtkAiD95DYgWOnFQYF6fnel8E7l03rkqfU89vQGVWNGJ3flmr9+TURcqqpxJckRGg2EOlCtP+f8m9Ebg0SGDAJuEQkg+Q6ZAEigwk1h1oxsoqPU7zuy4Isinnxmo6oxo5OzmPX4V5ijklSNK0lKhARo0Nm5H9AUGkPmsFmiQ94GuLZDl+SRZAIgAVwHKH65qNdruf169Vv+Hj3WyHV3Lld1w198WiFX/2U5oZGJ6gWVJAFaDYQ4cCIgb+xstDq9yJCR2F4FSH5OJgCSAcGmP1MmptM5OVSl6fziuZe30tCoXmOfhC7dufKxLwkOk69AJc8SGmD/zTg0JpXUvlNEh7wbMIoGkbybTACkGUBnpRdrNHCnE1r+Wto6ePmtHarFS87qy6zHvyLILLSLWpKcQqfVEOzAG7SCCXNsf/mUSwamiwSQvJ9MAPybBtvRP8VGD+9EQW6UStP5xY5dVdTWtaoSKyV3IDMf+QJTcLgq8STJGRw5EhiZUkhSgXCL6vuRa4Bfk998/zYeECp9d9eNzmn5u3l7hSpxUguGccWfPyMgyKxKPElyFr0Wgo32f6ovnCDUsBMgB1uJYMlPyQTAvwk1G+/dPZahA5yzma61tV04Rmr+UC77w8cYTXLDs+QdHGkSFJ8zlNgM4Y6VskmQH5MJgP/qBwwWCTD3Fue1/A0OEisolNFrDJf/eaFc/CWvYtTZSgTbK3/8naJDDgEGiQaRvJNMAPzX/SIXd+0SzoTRivcOnlNcbKDia3V6AzN+/wEGo/IYkuQuYQ5sBkzpdSFhCV1FhxR+lyB5J5kA+KdsYKJIgDtv7ObUlr+5XSMUX9veZqGuqlTF2UiS65gMGgLsPOav0WjVaBV8IeCcMp6SR5MJgH+6F4HvfWJ8MJdOzlRxOqeKiwkSqixYdvBHFWcjSa7lSKvgjMFXEByZLDKcBltdAMnPyATA/yQBl4kEuPXaAqe2/P1JbtdIxdeWHdym4kwkybWCjBoMDrQKzjlfuLz/5UCKaBDJu8gEwP/chUAFMHOIkWsuy1ZxOmeWI/Aa4PjB7SrORJJcL9SBugDZI6/HGCRU58KAbBXsd2QC4F8igOtFAtx4VR7mUNdUEBXZByBfAUjeLsQIOjur/RlMoWSPFPqrDfA7bG3BJT8hEwD/cjOguGi/KUDHTVe7bq9QXrbyVwDlxbvoaFevj4AkuZpGA6EOHGTJHXMbOoNQR85gbK8CJD8hEwD/EQjcLhLg8ildiYsR6kXukLws5QlAm6WFipK9Ks5GklwvNECDvYdtAsPiyBg8U3TIyaIBJO8hEwD/cTUQq/RinU7DHTcUqjidcwszG0mMD1Z8vXwNIHk7rQZCAuw/EVAwYQ4arZ27B08vR+RiybvIBMA/6AChkmGTxqWRkRam0nTsl5slsBHwkNwIKHk/c6D9jf9CY9Po3HuSyHABIhdL3kUmAP5hCpAhEuCum85c9re93SoS+qxEXgPIo4CSL9BpNIQ4sO+2YMIckeFkBS0/Yme9KcnLCTX8GDEoiR4F0T//+/HyJuZ9vJePPy+i6FAtx443EhJsoFNSKIP7xXPltCx6FsYITxogVygBkK8AJN8QatJS39KBPal2dFovEvJGcHTbciVDfaPkIsk7yQTA950P9BAJcNfNtpa/JaUNPPHPjbz+7i4sbR0nfU1dvYXtuyrZvquS/7y+nd7dY/njPX0YOThJZGjyBF4BVJbso621Gb1RaGe0JLmdQQeBRg2NrfY9bet24f1KE4AXlFwkeSf5CsD33SNycff8aLrnRfPAY2soGPouL7+145TF/3TWbyrjgss+Y/yMhazbWKZ4/OzMCMU9Bzo62ikv3qV4bEnyJI60Ck7IGUZq30scHeJlYKOjF0neSyYAvq03MEokgNGoJW/wPP7x4haamh0/V79iVQnDJ33MtOsWs31XpcPXBwXqSe2kuHSBfA0g+YwAB1sFD772BWIy+tn75UsRPCYseR+h8yKSx/snkCsS4MjRBlpa24UnsntfNS+9tYN9B2opzI0iIsz+zcYrVpWwe1+1onGjkjJJ7y6UA0mSx9BpoaHVzq81BNBlwAzaWhqoPLwV62kKY2l1+g6rteNJbBVCm1WdrOTxnNfPVXK3TGAHHpjkGfRarro0m/tu70lC3LkLC/3pb9/zl2d/UDRW1z7juewPCxRdK0me6GhNB47m5M115exfNY/qkh00VBzGZI4hOq03XfpdbMmMTQn54zSNnWmF5EvkJkDfNRcPXPwBLG0d/PeN7bz1wW6umpHNvbf1ICb6zDVPRZoClR2SRwEl32IO1FBe79jRW1NoNLljbj3dLxkqrJbHke2A/ZLcA+Cb4gDhmqDO1tjUxr9f/ZG8IfN46Il11Naf/kOISC2A6rJDtDTWKr5ekjxNkFGDXsU7d0sbN6oXTfImMgHwTXcCXnP2rb7BwlPPbyJv8Dyeen4TzS0nP9/smhGO0aDwj6rVyvHDO1WYpSR5Bg1gdqBV8LlY2q3Bt73fLFQ9SPJOMgHwPWZsbT29TkVlMw89sY7CYe/yyts7aDtx3NCg19JFoAyxrAgo+ZqQANApPB57OhaL9n7VgkleQyYAvudGINzdkxBRXFLPrfd9S5/RH/DW/N10dFiFXgMcl/sAJB+j0UCoilX7W9qsUXe813KZehElbyATAN8SANzh7kmoZde+aq6/cwVDJn50xv0B9jh2QNYCkHxPiMn+VsH2aG3nCfWiSd5AJgC+5Uog0d2TUNsPW8tZvPyw4utlV0DJF+kcbBV8Ls0WUm5/p0kWzfAjMgHwHVoEW/76qrrKozTWlrt7GpKkOrNJ3WIubRrdP1QMJ3k4mQD4jouBHHdPwlOVyacAkg/SaTUEqbgXoLnVmn/H2y2F6kWUPJlMAHyHUNMfEZ2y+2M0BbtreLuUHZAbASXfFKbikUAr0KbR/Eu1gJJHkwmAbxgB9HX1oMlZfZn12GKu/b9vmf3KXgZPmeuxrXflSQDJVxl0EOhAk6BzaW6zDnpgvjVBtYCSx5IJgG+415WDxaTkMPW+d7j2/74jrdsIAILM0Zx31ePc9uI2eo29Dq3Ws6oQy1oAki8Lc6BV8Ll0WNHUtra+oFpAyWPJZkDerxvwAy74XkYmdGHE5X8gf9h0NJqz547HD+1g2Zt/YMfqj8HqWN1yZwgMieDeeWXunoYkOU1pbQctjnfsPq2Olrr2d2Z3eaC1oWY8kIXtiPFh4GvgBUBuqvEBMgHwfm8BTi3gYY5KYuiM39Nj9FXo9AaHrj2yZz1L//cg+zctddLs7Hf3G4cJiYh39zQkySmaWq2UOdgk6HQObVzIqldvpqnm2Jm+pAN4Ftu+I9lF0IvJBMC7pQG7cVJXx6DQKAZPvYc+F9yEwXjmbn32KNq8nKVvPETxzrUqzc5xN/xjLYkZPd02viQ5kxVbq2CLg62Cf23fqnf49j/XYu2wK8jHwBRAYETJnTzrRa3kqEeA/moHDQgMZfDUe5h679ukFQ5Hp3PsU//pRMSn0fP8a4hP707ZwW001BxXYaaO6TnmWsxRPlcnSZIA26c5rRYaFX4mrzm6iyV/v5iONrsDZAONwEplI0ruJp8AeK8Y4AAQpFZAvdFE73E3MGTafQSHxagV9hRWawdbV7zD8rf+RFVpkdPG+a3ZL+8hPC7VZeN5KktLI8eKtlJfbXvEGxIeR1x6ofBTHsn9rFYoqbHS1uH4q4Cvn5/F/tXzHL2sHkgHXJ/RS8JkAuC9/gw8pEYgrU5P9/OuZNilDxIW3UmNkHZpb7Ow8cuX+ebdx6mrPOrUsQJDI7nn7VI0Gv/9I79/01LWfPIs+zYupr3NctKv6fQGMnqOod9Ft5HebaSbZiipobbFSlWDYwlAe2sTb90YR3tbi5IhHwEeVnKh5F7+ezf0biHAQUB5izwAjYb8wVMZccUfiUrKVGViSlhaGln76b9YOf//aKqrdMoY3UbO5OK7XnFKbE/XWFvOJ8/cyM41C+z6+pwBk5h4+wsEhUY5eWaSM1itUFzdgSMPAcr2rOazR4YrHbIS6IztaYDkReQeAO90M7bSv4pl9h7H1Hvfpt/EWwgyu/dGr9MbSMkdRO9x16PV6Tm6bxPt9r+HPDeNhovu+A+hkf5X26S2vJhX7xvJ4R2r7L6mvHgnu9Z+QvaASQQEmZ04O8kZNBrbhkBHjgRWHv5RyeP/nwRiewWwRmkAyT1kAuB9DMA8IExpgILhlzL9gfcIjfSsI3F6o4m0biPocf7VtLe1cmz/Zjrs2418Vt1HXUmfCTeqMEPvYmlt4o0HxykqgtRYW0HR5mV0GzXT4aOfkvsZ9BrqW6zY+xCgpb6CPV+/JjJkHvActiOCkpeQCYD3uQKYpfhqjYbJc14jJCJOvRmpzGgKIbPXWApHXk5zQzVlB37EqrCYUFxqAdPun4feoGLHFC+x7PWH2b7yQ8XX11cfA6uV9O5yT4C30WqgvQNa7cyfjYFmti16xt7jf6cTBuwDNisNILmeLAXsXTQINv3J6Hk+8Wne0ewrPLYzk2a/zE3/2kTuoMm2Z5sOSMzsxcxHPvfLx9i15cWs/eRZ4TirP/4HNeWHVZiR5GrmQPv/yhgCzSR3Gys65FzkvjKvIp8AeJeJwB0iAS68/UWvOwoXHBZN3pCpdO0znprjh6g8uu+sX683BDDwkjlMuvMVAkMiXDRLz7L09Qc5vFP8lWxHRzsdbRYye49TYVaSK2k1Gizt2F0YKDAinr3fvi4yZCywAVtxMskLyGzNu3wLDFZ6cXJWX657yvtrdpTu38zmZW9yYOvXVJbspaWpjiBzNLGd88joeT7dz7vSr0v+1lUe5ZnrsrC0NqkST28I4PaXdmGOSlIlnuQ6re226oD2WvjnoRzfK1St8ztgiEgAyXWcUkJWcorBCCz+AIOnCr098Bjx6d2IT+/m7ml4rJUf/E21xR+gzdLCqvlPMfaGv6sWU3INow4CjRqaWu3bQ1M44W6W/nOqyJCDgUHI6oBeQe4B8B5CLX+jk7uS1W+iWnORPFR9VSkbvnxZ9bjrF/2XusoS1eNKzmc22f+gN6XnRMKTckSHdGl7ckk5mQB4hxxgvEiAQZfMPWcLX8n7rZz/FJaWRtXjtrU2s/qjf6geV3I+kx4C7H3Wq9GQP2626JAXAPmiQSTnkyuCd7gPge+VOSqJwhFO7RgseYDG2nI2LHrJafG///xFGqrLnBZfch5HngJ0GXQ5wVFCJcE1wN0iASTXkAmA50sGZogE6H/R7ej0RpWmI3mqlfP/j9Zm51VjtbQ0suqjp50WX3KeQKMGg51nvrQ6A7nn3yo65GVAimgQyblkAuD55gCKV++AIDM9x1yr4nQkT9RYV8H6z//j9HG+/+x5+RTAC2kAs8n+233WiGsxBgsdoTUAwu8SJOeSCYBniwSuEwnQd8JNmIIVVw2WvMTqD5+mpanO6eO0NjewZsEzTh9HUl+wEfRa+14FGEyhZI+6QXTIGwDZUcqDyQTAs92KrfOfInpDAH0n3qLidCRP1FRXybqF/3bZeGs//ReNteUuG09Sh0YDoSb7vz7v/NvQGQNFhgzG1rhM8lAyAfBcQdgSAMW6nzfLLzvg+ZvVC/7pkk//P2ltrmeNCmWGJdcLCdBg50MATOYYMgfPFB3yDmyJgOSBZALgua4BYpRerNXqGHDxnSpOR/JEzQ01rPvUdZ/+f7L2k+doqq9y+biSGK0GQgPsPxGQP/4utDqhenFRwFUiASTnkQmAZ9IhuIEmZ9BkohIzVJqO5KnWLPgnzQ3VLh+3pbFWlWZDkuuFmuy/8YfGptG59yTRIecgq856JJkAeKbpQBeRAIMukcdwfZ1tEX7ObeOvWfCMW5IPSYxOqyHYgb0AhRPvdbgT52+kAUL1hSXnkAmAZxJavdO7jyIxo6dac5E81JpPnnXrY/jmhhrWfvovt40vKWc2ae3uBBeZUkhi3kjRIe9DNp/zODIB8DxjgR4iAQZPmavSVCRP1dpcL/zpf9jARIYOSBSKsWbBMy7dgCipQ6+FIKP963HhBOF7SiFwvmgQSV0yAfA8Qo004tMKSesmnK1LHk6No3j339GT++8Qe1Lk6iOIknocKQ+ckDeCmC59RYeUTYI8jEwAPEsfYLhIgCHT7kMj9r5O8nCtzQ2s+fifQjH694pj6IBEhg1MZHA/saOiripCJKnLqAeTwYETAeJNgkYA/UWDSOqRCYBnuU/k4oj4NHIGXqzWXCQP9f1nz9NQc1woxoNzev/8z/feLvTG6UQZ4heFYkjuEebAZsDOvSdhjhc+WSR3J3sQmQB4jixA6LzNoEvuFj2zK3k4NRry9OsVx8jBST//+6ghyQzsEy8Uc+X8p5zaiEhyDpNBY3erYI1Wp8ZTgIuxtTeXPIBMADzHXAS+H8HhsXQbJVy1S/JwarTk/f3sXqf8t3tvE3wKUFvO+i/+KxRDcg9H9gJkDLmSoHChZFEL3CUSQFKPTAA8QzxwuUiA/hfdjkGsbrfk4dpam1n90T+EYvQoiGbU0ORT/vvo4Z3o3T1WKPaq+U9haWkUiiG5XqBRg8HOlUCnDyBntHB/kZmA2PETSRUyAfAMdwEOvI07WUBgKH3G/07F6UieaP2i/1JXWSIU4+E5vc9Y0+WB2WInAuqrj7Hhy5eFYkiupwHMgfYvBTnn3YgxSKjDaAC2HgGSm8kEwP3CAKHVu9fY6zAFh6s0HckTtVlaWDX/KaEY3fOjOX9Eyhl/fezIFHp1U9x+AoDv3v8rltYmoRiS6wUbbRUCz6WloZLdX7+GVmcUHfJGbPc+yY1kAuB+NwJmpRfr9Eb6T5LJtK/b+OXL1FYcEYrx+zt7nbOiq+hegPqqUn5Y/KpQDMn1ztUquKGymNX/u4N3b09j3dtzaa4TO4WC7Z53o2gQSYxMANxL+FFY4fBLMUclnfsLJa/V3tbKqg//LhSjMC+K8ed1PufXTRidSo+CaKGxvn3vSdpam4ViSK4XeppWwZbmOr5/517m353LzqUv0G5R9ft6B7Z7oOQmOndPwM9dA1ym9LAQcfQAACAASURBVGKNRsvkuW8QHCZ2w5Y8T0PNcY4VbaFo83LWLHiGg9u+FYr3z8eGkJ157tdEGg1ER5qYv3C/4rFam+qpLjtES2MtlpZG9EYTRpNsCe/pNBrosEJLm+3fD25YwFf/N5EjPy7B2tHujCFDgUPARmcEl85NloxzHx2wA8hUGiC7/0XMePAD9WYkuVRzQzWVR/dTVbqfqtKin38uO7iN+qpS1cbJ6RrB94unoLXjHS+A1Qr9xn7AjzsqVZuDKTicyIR0IuLTiYhP+/nnmJRcQiPFKhFK6mnrsHKwtI41b85hzzevuWLIPdjqAjglw5DOTlaNcZ/JCCz+AIMumaPSVCRnabO0UHl0H8cPbT9pkf/pZ1d48K5edi/+YPskeO9tPZl58xLV5tDcUE3J3o2U7D31w15gSMRJSUFEfDoxKTnEpRYQEKR4e4ykQENlMV8+OYWy/S77UJ6JrTiQ/CTjBvIJgPusw1b7X5HO+UO4+sllKk5HUqq9rZXa8iNUle6n7ND2kxf7YwdsH6ndJCczgu+/sv/T/086Oqz0GzufbTvVewqgxK+Tg5iUHGJScomITyc6uStGU4hb5+Zrjuz+nrf+eKFwkykFvgeEOw1JjpNPANxjFAKLP8DgKfeoNBXJHlZrB5Ul+zh+eAeVJXupKNlD5dF9VB7ZS01FsVsX+bO5746eDi/+AFqthntu7cGsW5c6YVb2a6qvomlv1alPDjQawqKSiUzKIDKhC1GJmUQmZhDTKYfIxAzZEMtBB7d9x9t/uoiWxlp3DN8HGAnITzQuJv+WuMdiYLTSi+NS87nx2Y3yJucCJXs2sPbTf7Fr7ac0N1S7ezoOyeoSzoalUxUlAADt7VZ6n/c+u/Z51/9vU3A42f0vpO/EW0jMECtu5A9K9mzgtfvPc3cvh8XAGHdOwB/JUwCu1wP4q0iAMdf+lfi0QpWmI51OS1MdC5+7mc9euJ1jRZtpU/f4k0v87Y8DKciNUny9VqshzGzkk0UH1JuUC7RZmikt2syGL1+muuwAad1GojfI02anU3l0H/97YLQnJLddgE8A9Xa/Suck6wC43r0iF4dFdyJvyDS15iKdRn31MV6ZO5RNS1/32Ef755KZHsbUC7sIx5l2UQYZaV5asM1qZdOS13ll7jDhBkq+qLW5gXmPTBZuLa0i+V7TxWQC4FrpwBSRAAMn34VOb1BpOtJvtbU28/afLuLYgR/dPRUh99zWA51O/BWRTqdh7q1i1QHd7diBrbzx8HhZovg3Pvv3rZQd2u7uafzaVGz3SMlFZALgWncj8NolMDSSHudfpd5spFN8/c6jlOzZ4O5pCMlMD2P6RRmqxbv04gyyM7y710Tp/s18++4T7p6Gx9i55hM2L3vT3dP4LR0gzza7kEwAXCcWuEokQL+Jt8ijT05UX32M1R+Ltdt1N40G/u+PA9Hr1furrddr+fffhineTOgpVn30tHwVADTVVbLwuZudEluFP3VXY7tXSi4gEwDXuQ0IVHqx0RRM3wuc85dWstmy7C3aLC3unoaQe2/ryejhnVSP279XnHCjIHdra232xE+9Lvf1O49SX31MtXgaYEhoBH/tlMXSnL4EaoX2lgdiu1dKLiATANcIBW4RCdDj/KsJMsua/860Z8Mid09ByJybuvPw3b2dFv+hOb155H7vrtey74ev3D0Ft6o8uo/vP39RtXi9gs28l9Gd/6blc2FELAmGAKZGxouGvRnbPVNyMpkAuMb1QITSi3V6AwMmzVZxOtLplHnpxr+czAg+em2sSxbnOTd158PXxnrtngBv39wp6rsP/kp7W6twnACNlkeSM3mrSzcKgk5eq6+OSUIvVqMkEts9U3IyWQnQ+YzAnSIB8oZMIzz23K1cJTGNtRXunoLdkhKCGTUkmfNHdOLCMamqvvM/l7EjUzhvaDIff1HEVysOs/TbI5SUNrhsfBFuKHPrMeoqj7Jl2VvCceINATzbOeeUhf8nCYYAJoTHsKBKaL/FncBzgHi2Ip2RTACc73IgWfHVGg0DLxbKHyQ76Q0BHnVULDwsgIy0MDLSzGSkhZ/4OYyMtDDMoUa3zk2v1zJlYhemTLTVGqipbWVvUQ37DtSwZ7/t571FtewtqqG6xnP2VfhzQaAfFr8qvMclQm/g1fQC0gLOvp3phthOfFpVRofyoZKxtUp/TXkI6VxkAuBcGmxH/xTL7DWW+PRuKk1HOpuI+DSXn4sOMOpI72wmp2sEaSlm0jqHkppiJi0llLQU7+mEF2Y20qtbDL26xZzya9U1LRQdqqPoUK3tx8E6duyuYtvOSmrrXfsBLyI+zaXjeZLNy8U2QAbpDbxkx+IP0CUgiKHmSFbUCjWTmgv8D/DOalxeQCYAzjURyBUJMHjKXJWmIp1LSt4gpyQAgSY9XX769J4aRnqq7Z8z08OIiwlSfTxPEx4WQI+CAHoUnLqJ9djxRvbsr7E9PSiqZd/BX/65qblN9bl0yhmoekxvULJ3IxVH9gjFeKDfEAqMIXRUVNn19dfFJIsmALnY7qGfiASRzkwmAM4lVPY3qWsfOucPUWsu0jnkD5vB+i/+q1o8U4CO914ew6ghyci+TacXFxNEXEwQg/slnPTfrVZY+m0x0679kuaWdtXGKxh+qWqxvMme9V8IXd8/IZkZ2fnQ1Gx3AtA7OIyewWY2Ngh1GHwAmQA4jTwF4DxDAKGPG0OmCeUPkoNS84eSkjtItXjNLe1cN3s5O3YLfQrySzt2V3Ld7OWqLv6d84fQOW+wavG8yb6NixVfqwH+MGAYGkATaEITbv+rqetilG9/OqEftnup5AQyAXAeodU7OjmLrH4T1ZqLZKeJtz6Pwai4XtMpysqbGDN9IVu2ec8JA3fbsq2CMdMXUlau3oZMgzGQC275t2rxvEl7m4WSvRsVXz8kuTNdI37pKqmLj7P72hHmKDJMwq+5ZJMgJ5EJgHPkA+NFAgyaMheNRn57XC0mJYfJc19HK1bN7CQVlc2Mu3QhG7d4TNc1j7Vxy3HGXbqQikr12i9rtTomz32dmE7ZqsX0JscP76CtVfnv58yck1uPa0JD0IQG23WtBrhW/CnABGz3VEllcoVxjnuw/dlXxByVRKGfvqv0BDkDJnHJ3DdU7bpYVd3C+Es/Y+0G9Uqw+pqNW44z8YrPqapW79igVqvjotkvkTNgkmoxvc1xgY2tRp2OgUmnlpbWxdlfrv+C8FjixY5farCdCJBUJhMA9XUCZogEGHDxbHR6957z9nd5Q6Yy/YH3VT03XlvXygWXf8aKVSWqxfQVq74vZfyMz1Rd/HV6A1PufZtuI69QLaY3qi47qPjanrEJmHSn7hXXRISDyWRXDINGw6zoJMVzOOFSQFZDU5lMANQ3B1D80TEwJIKeY65VcTqSUl37TmD6799Hb7TvRmePhsY2ply9iGXfHVEtprf7bu1RJl35hao1AXR6I1Pve4fcQZNVi+mtasuLFV/bLebM7/t1CfY/BZgWFY/5NImEAwwIVlSVTiUTAHVFAkKrd58JNxIQKPtgeIrM3uOY8eB8VTcGNja1cclVi/h8ifJPZr5iydfFXDTzC+obLKrF1BsCmHb/PLL7X6RaTG/W0lin+NqYoDO/69dGRYLRvieVwVodl0UlnPsLz+56QHZEU5FMANR1GxCi9GK90SRb/nqgjJ7nc/mfF2I0Kf7WnqKltZ3LfvcVn355QLWY3mbx8sNMu+5LVQv+GAKCuPThj+UJml9pEyhvHWk6S+Kr0aCNO7Xy45nMjE7CpBVacoKwdQqUVCITAPUEAbeKBOhx3ixCIoRbaUpOkJo/lCv+vFDVpzOtlg5m3ryEBV8UqRbTW3yx9BDTr1+s6jl/oymYyx7+mC49zlMtpi+wdiivyH+69/+/pouJAp19J2ai9AYujrD/COEZ3IbtXiupQCYA6rkWgcdTWq2OARffpeJ0JLWl5A5i1uNfERiiuLPzKVotHVxx8xLe+VCsTKs3+fCz/cy4fjEtrWou/iFc9ocFpHUboVpMX2EUSFobLOfYl6HToYu1/7Z3TUwyOrGymNHANSIBpF/IBEAdekBo9c4dPIXIhHSVpiM5S2JmL2Y+uoig0Khzf7Gd2tut3DBnBW9+sFu1mJ7q/U/2cdVty7C0CfSJ+w1TcDhXPrqI1IJhqsX0JcZA+87sn87Rhvpzfo02LhbsrFnSyWhiTJjwa/x7ENhoLf1CJgDqmA6kigQYdMkcdWYiOV1iRk+ufOxLgszq7Udqb7dy491f8793d6kW09PM+2gv19yxjDYVF//AkAhmPvI5ydn9VIvpawJDIxVfu6fajgqWBj3aaPufiqlQHrgTME00iCQTALUItfzt0mM0CV16qDUXyQXi07tx9V+WExopvLP5Zx0dVm6+52uef/VH1WJ6ilff3sl1dy6nvV29zq7BYTHMemIJSV37qBbTF0UlZii+dt1R+46r6hLsf7efGxjCQPHXaELF1iQbmQCIGwd0FwkwaIpQ/iC5SUynbGY9/hWhkYmqxbRa4e4/ruK5l7eqFtPdXnpzO7fe/w0dHeot/iHhcVz52GLi0wrP/cV+LiopS/G1xxob2F5hRwnrgAC0kfYv6tfHCj8FKATGigbxdzIBECfU9Ccxsxfp3UaqNRfJxaKTs7jqiSWYo4VvaD+zWuGeP63mL8/+oFpMd/nnf7Zw+wPfYVVv7SckIp5Zj39FXKosD2+P6OQsob4i8/fssOvrtA4UBhoQEk5+oPCxWtkkSJBMAMT0BYR2Hg2eIktce7uopEyuemIpYTEpqsb909++55W37bv5eqLnXt7K/Y+uUTVmWEwK1/x1BTEpOarG9WWm4DDi0goUX//erm1UNZ+7loAmKAiN2f4TB9fFntpjwEHDgQGiQfyZTADE3CdycWRCF7L9uEmJL4lMSOfqvywjIj5N1bh3PbSSNV7YQGjpt8Xc94i6i39EXCpXP7mUyIQuqsb1B2mFyo9HNrZZeGHLBru+VutAq+DR5ihSxCtsyk9QAmQCoFw2IFRrdODkOaq2nZXcKzy2M1c/uUxo09VvtVo6uPHur1V9f+5sHR1W7npopapzjkrM4Kq/LCM8LlW1mP4kvfsooetf27bJrr0A2rBQNMH21enRaTRcGyPcJOgiQPkmBz8nEwDl7kbg9y8kIp7uo2aqOB3JE5ijk7n6ryuI7ZynWszd+6pZuNh7+gYsWFTEnv01qsWLTu7KrCeWEBYt/MjYb6V3H0VwmP1le3+rraOD25d/ce7CQIAu3v69AJMi44gW63yqRT4FUEwmAMokAUKrd/+Lble1y5zkOWw71L9UNQn437s7VYvlbG+8p15Bo9jOeVz15DLMUcKfFP2aTm8gf9h0oRhFNdXc8NVCWtvPXsFRExmBxmRfG+0AjZYro4VP0VyJrTaA5CCZACgzG1CctgYEmek97noVpyN5mpDwOK7+y3KSMnurEm/DZjuOYnmIH7aWqxInPr0bsx7/ipBw4frxEtDjvKuEY6w5Wszvliykse3s3Ru1cfY/BZgRlUCInf0EzsCArUeA5CCZADguHLhBJEDvcddjCg5XaTqSpwoMieCKRz4nMbOXcKyy8iYqq5pVmJVzHS9v4tjxRuE4iZm9mPXYYqHH1tLJ4tO7kdHzfOE43xQfZPrCDzhQW33Gr9FGR6ExnL2R0E/MOj3TxAtq/Q7bvVlygEwAHHcTYFZ6sd4QQP+LbldxOpInCwyJ4MpHv6RTdn/hWFqt5xc+a1ShtW9ydj+ufHSRUAlb6fSGTL9flTjbK44z8eN3+O/WjbSdrtugVoMm9tzJmxVYWF3G59XCT7jM2O7NkgNkAuAYE3CHSIDCEZepWjlO8nym4DBmPrpIuFNdcLDn9z+JDBfb15KSO4iZf/5cPiFzks55g1Vrl9xosfDkuu8Y+f7/eH37ZmpaWk76dW1szBlbBbdYO1hQVcb0vZu4+9AuSi0tp/06B92O7R4t2cnzP1J4lt8BLyi9WKPRcsvzW4lO7qrilCRvsXPNAuY9OkXRtbHRgRzY6B2nRlJ7vkFZ+bkLx5zOjAc/ILu/0Ola6Rwqjuzh+Vt70KbOovszo05H/4RkBiQkkx0ZTafQMMwVlbQdK6eq3UJlm4VtTfVsbKhlTX01te3iT4tO40bgRWcE9kX2vaSRAHQINv3J7n+hXPz9WNmBbYqvzc/2nsfheVmRlJXb10Tmt8oObJMJgJNFJWUy8JI5fDPvcVXjtra3803xQb4pduuR1buBl4CzH1WQAPkKwBGXAEIVXgbKlr9+rezQdsXX5nQV7p7mMiJzFfk9kuw3bMaDvtpCOQOY7O5JeAuZANhPqPFEWuFwVTaCSd7r+CHlTwByu3rPE4DcLOUJgMjvkWQ/nd7AlHve8tWNlg8gX2/bRSYA9jkPEDrLNXCy/PTvz9rbLJQXKy+QI7KoulpulvJFpbx4F+1t5642J4kLj+3MpNkv+WI58u6AbLFqB5kA2Eeo6U9cagEZvcaoNRfJC1WU7FG8sGk03vUKIDcrAo3Cz1/tbRYqSvaqOyHpjLL6TeSi2f9F8TfMcwm1afcXMgE4t56AUCeNwVPmovG9v2CSA8oO/qj42k6JIZhDheqlu5Q5xEhyovJe7yK/V5Ljuo2cyXlXPuruaahtNLZ7t3QWMgE4N6FP/xFxqeQNmarWXCQvdfyg8s1tIo/U3UVkziK/V5Iyg6few4SbnkWj8aklQWjflj/wqe+2E3RBcEfpgIvvRKuTpy39XdlB5Zvb8rwwAcgT2LMg8nslKddnwo1MufctDAH2tfP1AlOw3cOlM5AJwNnNxXb+X5Gg0Ci6nzdLxelI3krksXaOF20A/InQUUD5CsBt8gZP4Xf/XKdqJ0s3Eq7d4utkAnBmcYDQ6t3vwlsxmoJVmo7krSytTVSVFim+PtcJGwCPHW9k/aYy1m8qU1y172xEnlpUlRZhaRFvKCQpE52cxXVPraTX2Ot84ZXAVdju5dJpyGfTZyZUV9poCqHPBbI3hQTlh3fS0aGsMJlOpyErQ526+Dt2V/HavJ2889EeyitO7iwYER7AxPNTufnqfArzooTHysoIR6fT0N5udfjajo52jh/eSWKG3MPlLkZTMBNvfZ7u583is3/fSun+zW6ZR1B4PK1NdbS1NCgNYcJ2L/+9erPyHV6f3jlJKHCzSICeY64hKFT8Rip5v2MHtiq+Nr2zmUCTWJ6+a181V9y0hN6j3+fZl7aesvgDVFW38Pp7u+g/bj4XXPYZP+6oFBoz0KQnLUVx00xZEMhDdMruzw3/WMvFd71KTKdsl40bFJFI/5lPM+WpXXQdfrVouJux3dOl35AJwOkJ9ZbW6Q0MmCTUNFDyIccFytuK7KYvLqnn1vu+pc/oD/jws/1Y7fwwvuy7I/QfN58rblrC/oO1iscXKV5UJk8CeAytVke3kVdw8783M+3+d8noeb5zigdpNMR06cuAWc8w5amd5Iy+GZ3BRP7Y2Wh1Qp0ww4EbVJqlT5GvAE5lBGaLBMgfOoOwmBSVpiN5O7ETAI4vohWVzfzjxS3865WtNLcoe/XQ0WHlw8/28+mXB5g5LYsH7+pFfKxju8PzsiL5ZNEBRePLkwCeR6PRkjtoMrmDJlNXeZQfv3mXvRsWc2j7SsV7NjRaHZEphaT2vYS0flMJjUk95WuCozqR1n8a+1a+JTL9O4FnAVlm8ldkAnCqK4AkxVdrNAySTX+kXxH5NJvjQA+A+gYLL76+jb89u4naenXuc5a2Dl55ewfvfryHG2flc/ct3Qkz21eUSOwkgEwAPFloZAIDJs1mwKTZtFlaOLJrHWUHt3H88A4qjuymsbac5oYaWhrrAAgMCccUEkFgaCShEfHEd+lBSHIPTAmF6I3nTiwLJsxh36q3sfsx1qmSgMuBV5UG8EWyPN3JNMCPQK7SAFl9L+DShz9Sb0aSV2tprOWJ6dGKb1wblk4lJ/PsC2ljUxuvvrOTvz77A8cr1N/R/2sR4QHcfHU+t19fSGjI2R/L7thdRa/z3lc2kEbDffPKMAWrswFS8jxtHVZKaqx2/9VY8veLObzpc5Ehd2G7t3eIBPElcg/AySYhsPgDDJoyV6WpSL6g7OA2xYu/0aAlIy3sjL/+06fzgqHzmPvHVU5f/MG2WfCxpzeQN+Qdnnp+Ey2tZ37FkJEehtGg8BZjtXL80A6Fs5S8gV6rIcho/2fQgguEj/RnAReKBvElMgE4mdDqnZzVl5TcgWrNRfIBIo+yu2aEY9Cf+lf0p/fzPUe+x633fcvRY64/M19e0cxDT6yjcNi7vPL2jtMe9zPotWR2Uf4Jvkxg86TkHcwm+xOAuK6DiM0Uvr/eLxrAl8gE4BfDgAEiAYZMl3+2pJOVCRxnyz3N+/9l3x1h4IQPueKmJew7oHyHvloOH/nppMH7pz1pIFLE6LjcB+DzjDoINDjwFGCC8P6qvsBQ0SC+QiYAvxBqHxnTKZuufcarNRfJR4g8Afj1JrrV60s5f+qnXHDZZ2zZVqHG1FS1c6+t1sCwiz5m+cojP/93uRFQOpcwB54CpPSYQHiS0FtakK2CfyYTAJsCYKxIgMFT7/GFspmSykSPAG7YfJxLrl7EqMmf8N3aoyrOzDnWbypjwqWfMWryJ6xcVypUElgmAP4hwAAB9p5H02jIH3+n6JDjge6iQXyBPAVg8ya2IyKKmKOTueOlXej03tOzXXK+hprj/O3yRMXX9+0Zy/c/lAmcfHIvjQb69Ihl3cYyxTHmvlVCcFiMirOSPFGjxcrxOvv+oHe0W/jg7hwaKg6LDPkmMFMkgC+QH1mhEzBNJMDAi++Ui790irIDYl3t1m303sUfbIcfRBZ/kE8B/EWgQYPRzuKCWp2BvDG3iQ45A+gsGsTbyQQA7gEU15kMDI2k55hrVJyO5Cvk4iVO/h76Bw0QGmj/cpQ14joCQoR6reiBu0QC+AJ/TwCiAKFOE30n3ITRFKLSdCRfInICQLKRTYH8R7DBVhvAHvqAYLJHCZf3vw6IFg3izfw9AbgdCFZ6sSEgiL4Tb1FxOpIvEWkC5GwajZaCYTMoGDbDozevyicA/kOjgVAHGrDnjr4FnTFQZMgg4FaRAN7Oc//mO18Qgi1/e4yeJTcoSWfkqR3t0ruP4oZ/rOGSuW9wydw3uOlfP5A3eIrtDuxhyg5uw+rNGyEkh4QEaNDZ+cfQZI4hc8gs0SFvA/z2Ea7n/Y13nduBfyq9WKvTc9uL24mIT1NxSs5jaWmkrrKU5oZqLM0NtLe1EhBkxmAKxhRkJjQqCY0HLgDeqqb8ME9fle7uaZykU84ARs16lNT809dBKd65lqVvPETR5uUuntnZ3fVaEeboZHdPQ3KR6kYrNc32JX11ZUXMvycPa4eyrpcn3AE8IxLAW/lrN0ADghtA8gZP8djFv6WpjkPbVnLwx28o2bOBiiN7qKkoPmtNekNAEFFJmUQnZ5OSO4i0wuHEpOS4cNa+peyA5zy6jkvNZ+iM39s+5Z9FcnY/Zj22mP2blrLkf7+nZM8GF83w7MoObpMJgB8JNUFds30de0Jj00jtewlFa94TGfIu4HnAIhLEG/lrAiB2BESjYdAlwo0pVNXSVMfO1R+zdcU89m9eRkd7m0PXW1oaKd2/mdL9m/nxm3cBCI1MJG/IFLqNvIKELj2cMW2fVXl0n7unQHRyV4ZMu4/CEZc79J4/vfsoru82kt3ff8ay1x/m2IGtTpzluVUe3e/W8SXX0mk1BAVYqW+x7+sLL7hbNAHoDEzHVhvAr/hjAqBBsOlPRo/RxKd3U2k6YqqOHWD1R0/zw1evYWlRtylMXWUJaxY8w5oFzxCXWsCgS+aQP3Q6Wp0//rFxTFOd+8r1hsWkMPzyh+k28gq0WjsPV/+GRqMhq+8FZPYex+Zlb7LirT9Tc/yQyjO1jzt/LyX3CAvUUt9iX9feyJRuJBWM5sjWr0SGvAd4C/CrDSfK7g7ebQIgVEty4m0vEBGXqs5sFKqtOMLnL8zm0+dupHjXWjranfv0qqG6jB2rP2bLircxBYURl1Yo9wycxeGdayjavMylYwaHxzLqyke4+K5XSMrspcrufo1GS0J6d/pMuJHgsBiO7vsBS3ODCrO1X0avMaTkDnLpmJJ7aTXQ1g4WO1/tB0Uksvc7oQ/wccA6YI9IEG/jjwnASwg8/k/K7M2oWY+qOB3HtLe1smr+U7z/5GWU7FmP1WpflqyW5vpqdq75hP0/fEViRi9CIuJdOr63qKssYfvKD10yltEUwoBJdzDtvnmk5g91yhMarU5PclZf+oy/kYAgMyV7NtBmaVZ9nNPpPe4GuR/FD+l1Gupb7PtAHhqTSvHmRTRWlYgM2Ql4TSSAt/G3BGAA8GeRAON+97TbbkYVR/bw1p8uZPOyN2lva3XLHH5SW17Mxi9fxmrtICVvsEefJXcHU3AYqxc4d2OxISCIAZPuYPoD75LV7wL0hgCnjgeg0xtJyR1Er7HXAVC6f5NTnz5pNFrGXv9/BASGOm0MyTPptNDaBm12fsYJCI7kwLoPRIbsDCwGikWCeBN/SwCeA7KVXhyVlMmEm55xy6PvLcvf4p0/T6K67KDLxz4Tq9XKga3fcGj7SjJ6jsYY6LfHaU8REGSmaMtyasrUf2+u0xvoPfZ6pj3wLjkDL8YQIFQMRRFDQCBdepxHj9GzaGtp4ljRFqwd6j+NSi0YSj9ZbMtvaXXQYOdmwLDELPaveY+W+kqRIaOAd0UCeBN/SgCysZ37V7x6j77qCRIzeqo3Izt998Hf+OyF293+qf9Mqo8dYOvX8+jS4zxCwuPcPR2PYY5KZMvyt1SLp9FoKRxxGdPuf5duIy/3iE/FAYGhdO0znsLhl9FUV3micp96+6guvOM/HnvcVnI+g1ZDs8VKux25pUajQW8I4PAPn4kMmQV8ABwXCeIt/CkB+CugePUOjUzgotn/TAgX0wAAE+tJREFUdekOeKu1g0+euYFVHz7lsjGVam2qZ9u379M5fwhh8sw2AJEJXagqLeJY0RbhWFn9JjL1vnn0GX8DgaERKsxOXYEhEeQMnETuoMnUVZZQXrxLOGb3UVcyYNJsFWYneTONBhrt/OwTnpzHnq9fxdJcr3g4wAR8ojSAN/GXBCAeeAWB/79Dpz9AasHpK6g5g9VqZeFzN7Nx8asuG1NUW2sT2755n/TuozBHJbl7Oh4ho9cYDm79mprjynqXpxUOZ8rcNxl0yRxCwmNVnp36gsNjyR86nYyeY6g6VkT1sQOK4qTkDmLKfW+j0ylu1Cn5CINOQ2OLlQ47HixptXqs7e2UbBM6gZOHbbO44izCW/hLAnAHMFrpxabgMCbf/Tp6owOdKgQtfnku6z573mXjqaW9rZWdqxeQ1e9CgsxC7Tp9gk5nIH/odCqP7nOoOVBSZm8m3fkyI674o1dWwTNHJ9N91ExScgdRfngndZX2787OGzyF6Q+8hyEgyIkzlLyF5sT/Nlnse7UUkZzHrmX/od1i5+aBU+mASuA7pQG8hb8kAK8CkUov7n/R7XTtO0HF6ZzdD1+9xpL//d5l46nN0tLI7u8/o9vIK9yyQc3T6PQG8gZfQmznfMqLd9JQXXbGr03K7M34G//B+df9jciELi6cpXNExKfTc8y1xKcXUl1adNZEIC61gAtufo5hlz6ITi8/+Uu/MOqgvvWs1cx/pjOYaG2spmz3KpEhO2HbNO7T/KGSSxawU+nFekMAd7y8h9DIBBWndGZH9qzn1XtH0NbqmjPWzpTVbyIzHpwvCwb9RsnejRRtXk558U5am+oxhYQTnZxNlx7nEds5z93Tc6pjB7ay74clVBTvormhBqMpmOhO2aR1G+mWDbaS96hptlLdaN9TgMbqUj64qyvtbYqfAgBkAntFAng6f6jpep7Ixd1GXuGyxd/S0siHf5vpE4s/wK61n7JmwTMMmHSHu6fiURIzevrtYheXWkBcaoG7pyF5oZAAqGmy7ylAUHg8XQZfwe4VL4sMeR4+ngD4Q/UWxUX7NRotAyfPUXMuZ7X8zT9SUeK8P28BOh1dI6LoE5/IoMROFMbEkRDs3KNky15/iCqFG8EkSZJ+otNoCNDZ/zSxYPydogXKPKPhixP5wxOAXKUXZg+4iKikTDXnckZH921ijcqV4zRAr7hEJqRnMjCxE+lhEWhP8zi+wdLKhmNHWVF8gIX7d1PR1KTaHCytTXzx4mwue/hj1WJKkuSfAvTQbGejU3N8Jim9LuTgesX3HsVrh7fwhwQgRumF3c+7Us15nNXS1x+ko8POzhfnoNVomJjelZu69SYz4tw78YMNRoYmd2Zocmce6DuEBft28dymdRyqrVFlPrvXfcae9YvI7D1WlXiSJPknnVaDI4Wm0vtPE0kAFK8d3sIfXgGEK70wIb27mvM4owM/fsPeDV+qEisjPJL3LpjC34ePsWvx/y29VsslmTksmnwFt/Xoi06rzh+Rb+Y9pkocSZL8l17nWJXJ6PTeIsN5XsUtlflDAqDOx2on+u69v6gS58IuWXx00XR6xIpvWgzQ6Zjdsz9vjZtMVKD4UT5be9zlwnEkSZLsJbgHwM6XDd7LHxIAxS+0j+7fpOY8Tqvy6D72/vCVcJyr8rrz9+FjCFL5/HSf+ETeu2AqiSHimwVXL/inCjOSJMlftXc4dqS48vCPIsOptxnKQ/lDAnBE6YUbv3xFzXmc1vrPX7TvXMtZTO2ay4P9hzqtqEOqOZzXxkwiPECsEuK+jYvPWgRHkiTpbNrsqQf8K7u/FrqHK147vIU/JACKz9XtWvspP377nppzOYnVamXbt0L9q+kWE8cjg0Y4vaJTl/AInh4+5rSnCOzV3mZh6zd+02lTkiSVNbfanwAUrf2AQxuEevrsE7nYG/hDArBe5OKPnrqatZ88p9oO/V8r3b+JmnJlTWLA9p7+78PHYNC6pqLz0OTOXJ4jVsRl5yp5HFCSJMe1W6202HEbtna0s+Orf/Pti9eIDim0dngDfzgG+LXIxe1trXzxnztZ88kzdBs5k/yh04hOzlJlYrvXCfWt5rqCnqSaFR9yUOSuXgP4dN9uqluUVSss3rUWS0ujbPQiSZJD6s5xy6k5uouiNe+zd+Wb1JUVqTGk0NrhDfylSPsuoKtawWJScsgbPIWCYZcKFQp646Hx7FO4ATBIb+Cb6VcRYXJ9s53nfljH0xvXKL5+5iNf0KWHUIVmSZL8SHuHlZKaU1sCN1Qc5uD6BRStm0/ZHqHmP7+1F9uaIbZBy8P5wxMAgLeBP6oV7PihHax4+xFWvP0ISZm9yRs6jbzBlxAWk+JQnKN7Nyqew4UZWW5Z/AEuyyng2U3raOvoUHR98a61MgGQJMluVY38vPg3VBZzYN18ita8z/H93ztryDfx8cUf/CcB+C9wPxCgduAje9ZzZM96Fr9yL52y+5M3ZCo5AycRFt3prNdVHztAY12F4nEv6qLOawglIk2BDE5KYcXhA4quryjere6EJEnyWbVNVspKD3Pw+4858P2HlO1ZjdWq7MOHnVqAl5w5gKfwlwSgBHgVuNFpI1itHN6xmsM7VrPov3NIyuxNzsCLyR00+bR93avLDioeKshgoKcKxX5EDBFIAMqP7FJ3MpIk+Zyq0iJ++Ho+O1Z9ZPukL3hc2gGv4AdHAMF/EgCwvQKYjivKO1qtHNn9PUd2f8+S1x4gLrWAnIGTyBk4mbjUfADqKo8qDp8fFYtepRK9SnWPjVd8bfUx5cmPJEm+6/jhnexY+SHbV31EqQsKsZ1GFfAndwzsDv6UABwD7gX+4/KBD2zl2IGtrHj7ESITupA7aDJN9VWK46WHub9EdZewSMXXtjTWqjgTSZK8ldXaQcmeDexc8wk71yzg+KEd7p7SvdjWCr/gTwkA2PYCDAFmumsClUf38d0HfxOKoUZtflGhRiMGrQ6LgvoI7W2ttFla0BtU35IhSZKHa2tt5tD2lexat5AdKz+itsJjnra/i22N8Bv+lgAA3AwUAK5p9ecERhcV/jmXQL0eS6uyAkmWlkaZAEiSn2isLWf3us/ZtW4h+zYuprW5wd1T+q0fgOvcPQlX88cEoB44H1gB5Lp3KsrUtra4ewq0W63UW1oVXy8LAUmS77JarZTu38zeDYvY/f3nHNm1zinVVFWyHRiDbW3wK/6YAAAcB4YC84Fhbp6Lwyqb3d+kqrK5iQ6Fu3L1RpP89C9JPsbS0sjhHavZtW4hO1ctECpz7kKrgUnY1gS/468JAEAFtqzv78BNeFFVxNVHi/nPlg0MTe5MdmS0W+ZQUl+n+FpTUJiKM5EkyV3KDm1n74Yv2bt+EQe3fUd7m/Kngi5mBf4NzMF27t8v+XMCALZv/C3AAuBfQIZ7p2Of0oZ6/vL9Sv7y/UrigoIZktyZoUkpDEpKEW7Za691pco37oRGubeGgSRJyjRUl7F/01L2bVrCvo1LqKsscfeUlNgD3AosdvdE3M3fE4CfLMa2H+B64C7g1Mo9HupYYwMf7N7OB7u3o9VoyIuKYWBiJwYlpdArLgGTzjnf4tUlyh/vxaTkqTgTSZKcpa21mUM7VrFv41fs37SEo/s3u7Igj9r2AU9hq/JncfNcPIJMAH5hwfZI6AVsmwRnAhOBUHdOyhEdVitby8vYWl7Gi1s2EKDT0TMugYGJnRiY2ImC6Dh0GvE3HeVNjaw5Wqz4+tgUr9x7KUk+r6O9jZI9GyjauoIDW1ZwaPsqLC2N7p6WiHrgE+ANbB/0nFpD2NvIBOBUHcCiEz9MwDhgKrZkIMSN83JYS3s7q0uKWV1SzFOsxmwMoF9CMv0Tkugbn0R2ZDRaBQnBmzu20NKufEdvXFqB4mslSVJPR0c7pfs3c2DLCoq2rODQtu9oaVK+v8dDNAGfA/OAz078u3QaXrPxzQMEAuOxJQMXAMHunY44szGAPvGJ9Im3JQT5UTHozlFiuN7Syoj3/qf4JILeEMA975RiNHlVLiVJPqGjvY2j+zdxaNtKDv74DQd//FaoKqkHacH2Cf9dbJ/4vT6LcQWZACgTBEzAlgxMOPHvXi/YYKRXXAJ94hPpHZdIYUzcKXsIHly5jHd2/qh4jPRuI7nysS9FpypJkh0sLY0U71rHoW3fcWj7Sg7vWENrs88cd28FlgLvAR8D1e6djveRrwCUaQTeP/EjGNsTganYnhC4v06vQg2WVr4pPsg3xbZmPQatjvzoGHrEJtAzNgErVuYJLP4AmX3GqTFVSZJOo76qlOJdazm8YzWHtq2kZO8G2tt8ar9bE/Al8CHwKXLRFyKfAKgrhF+SgbH4yJMBtWh1ema/shdzVJK7pyJJXq+9zULp/k0U71xrW/R3rvbVTpv12N7pzz/xs888wnA3+QRAXfXYNp7Mw/YkYBRwIbYNhMr75/qIrL4XyMVfkhSqPLqPkr0bKNm9nuJdaynZu5G21mZ3T8tZKrBt4PsQ2yd+n/0/6k4yAXCeJmDhiR8AefyygbCXuyblTr3H3+DuKUiSV6irLKFk70aO7t1Iyd6NHNm1joYan69WW4Ttsf6nwNfIs/pOJ18BuEcXfnkyMAQ/ScRSC4YRn1ZIbGoB8WmFxKTkyKZAkl/r6Gin4sgejhVtpnS/7UfJng001lW4e2qu0AGsxbZr/xNsTXkkF5IJgPtFYts8eCG2fQNeU3hIlFarIyIhnbjUQuJS84lNzScutZCI+DQ0KhQskiRP0tJUx7GirRwr2kLp/k2U7t9M2cFtWFr96ph6HbAE2+P9T4Ey907Hv8m7rGcJAIbzSzKQ7tbZuInRFEJsah5xqQUnJQeBIRHunpoknVNrcwPlh3dSdmgbxw/toOzgNo4f3k512SFvLqMrYge2zXtfAN9iO74neQCZAHi2DGwdC8cCI/CB4kMiwqI7EdM5l6jEDKKSuhKZmEFUYiZhsSlotTp3T0/yM411FVQc2UN58S4qinfZFvtD26g+dhCr1a8rzjYCy/ll0S9y73SkM5EJgPcwAoOxJQTnA92Q3z8AdHojEfFpRCVmEpWUSWRiJlGJGUQmdsEc3Um+TpAUa2ttprJ0PxVHdlNxZA8VR3afWPB3+8t7entYga3AVyd+fI3cte8V5J3Re8VjSwbGAKOBaPdOxzMZjIG2JwVJmT8/MYhM6II5phPmqER0eqO7pyi5WV3lUapKi6gq3X/i51/+2Uvb3bpCCb8s+EuBUvdOR1JCJgC+QQsUACOxvSoYCoS5dUbeQKMhNCIec3Qy5qgkzDHJhMWkYI5KxBzdibDYToRGJKB1UktlyfksrU3UlB2mtvwwNeXF1JQdpKbsEDXHD1NTfpia44d9+Sy9muqAb7Bt4PsK2Obe6UhqkAmAb9JhqzUw4sSPwfj5/gGltFodIRHxhMV0whydTGhUIuGxnTFHJxEcHkdQaBRB5igCzVFyH4ILWVqbaKg6Rl3lUeqrSqmtKKG+qpS6Ez/XVhyhvuoYjbXl7p6qt2oAVgIrsL3PXw+0uXNCkvpkAuAfDEA/bMnASKA/tlbHkoqCzNEEmSNP/BxNYGgkweGxJ/496kSyEE1QWDTBYTEEBJndPWWPYGlppKm+iuaGGprrq2iur6apvpLG2grqq47RUFNGY20FjbXlNFQdo6HmOK3NDe6etq9pAlbxy4K/DlmIx+fJBMA/BQIDsL0qGIQtIZD9eV1MpzdiCgknIDAEU3A4xsBQAgJDMQaFYjQFExgSgTEwFL0hgIAgMzqDEUNAEIaAIPSGAIyBoWh1ekzB4SdtdNRotadNLnR6I0aTfQ+COtrbfu4L39Fm+XnBbbO0YGlptP1zazNtJ86wW1qbfn6U3lxfTWtzA5bmBlqb62luqMHS0oilpZHmhhpam+pobqimub6Gpvoq2tvkqTA3qMa24K/EdjRvHbaWupIfkQmABLZXBt2wJQMDsb0ySHbrjCSX0RtNGIyBdHS009JY6+7pSM5xCNtCv+rEz9uwVeKT/JhMAKQzScGWCPyUEORjSxQkSfJsrcAmbGV212Bb8A+7dUaSR5IJgGQvM7bXBgOAPid+xLh1RpIkARwEVmNb8NcCG5GP8yU7yARAEpEK9OWXhKAXci+BJDnTcWwL/AZs7+3XIs/gSwrJBEBSkw7IxpYM9AR6YNtb4DcNjiRJRcewLfQbf/XzIbfOSPIpMgGQnE2Lrf1xj9/8iHXnpCTJg3QA+4DNwJYTP28Eit05Kcn3yQRAcpckoBBbBcN8IA/IRdYnkHxbDbZF/qcfm4H/b+/uWhIIojCO/0WsC62U0opQwYLo+3+VjKiLhJBKetENSiKqi3OGnQS7qdxdfX5wmFEWdm7WeRh3d06xF++ILJQCgORJGVstCKEg1CH2MiORonjCtsE987YPnGM37InkggKAFEEF6AEnwLFX6DcyHJestg/s8bpLrzDJ99GNeVIACgBSdC0sDBxhKwVx1TMclyyPW+CCdKKPSzsJSWEpAMgy2yYNAz1vO0AXaAPr2Q1NcmQMXAGDmTbUS1YDE/lPCgCyqkrAHhYGulgw6GDvNjgA9oFddI0U3Su2TD/E7qoP/WuvARYARFaOftxE5qtgfzG0sTAQty3vt4Ad9PTCoo2BG2Dk7Z1X+G7opf2AReZQABD5GxvYikITCwRNLCA0vOpRP9RWJiPNlzcg8XoEHubUfVQj9KpbkV9TABDJTok0HNSAqlcj6tewoFDFVhnWvF/G9meA9EmITb5v2DT7GT9XfN1/8vMS+BRbRgebrMPz6u/As/cn2N7xiR879X6Y3Kd+bOLnmpBO+rqJTiQjX93qV727oAL9AAAAAElFTkSuQmCC`;
    const avContainer = document.querySelector(`div.profilePage[itemscope="itemscope"][itemtype="http://data-vocabulary.org/Person"] > div.mast > div.avatarScaler > span[class^="Av"]`);
    if (isOnUserProfile) {
        AF(document.querySelectorAll(`li#info.profileContent > div.section > div.primaryContent > div.pairsColumns.aboutPairs > dl`))
            .forEach(_dl => {
            let dl = _dl;
            if (dl.children[0].innerHTML !== "Birthday:")
                return;
            const bday = colonNumber(dl.children[1].innerHTML.split(' '), 2);
            const monthWord = bday[0];
            const day = parseInt(bday[1] ?? 1);
            const month = getMonthFromString(monthWord);
            const currentDate = new Date();
            const [currentMonth, currentDay] = [currentDate.getMonth() + 1, currentDate.getDate()];
            if (day === currentDay && month === currentMonth) {
                avContainer.style.position = 'relative';
                const hat = document.createElement('img');
                hat.src = partyHatImage;
                hat.width = 256;
                hat.height = 256;
                hat.style.width = '256px';
                hat.style.height = '256px';
                hat.style.position = 'absolute';
                hat.style.zIndex = '999';
                hat.style.left = '100px';
                hat.style.top = `-420px`;
                hat.style.rotate = '30deg';
                hat.style.pointerEvents = 'none';
                avContainer.appendChild(hat);
            }
        });
    }
}
if (settings.roundedFriendsOnProfile && isOnUserProfile) {
    GM_addStyle(`.friend>.friend-head>img { border-radius: 7px; };`);
}
if (settings.postLinkButton && isOnThread) {
    AF(document.querySelectorAll(`li[id^="post-"].message[data-author]`))
        .forEach(post => {
        const id = post.id.split('-')[1];
        const publicControls = post.querySelector('.publicControls');
        const a = document.createElement('a');
        a.href = `https://skyblock.net/posts/${id}`;
        a.setAttribute('class', "ReplyQuote item control reply");
        a.title = "Copy link to this message.";
        a.innerHTML = `<span></span>Copy Link`;
        a.onclick = () => window.navigator.clipboard.writeText(a.href);
        publicControls?.appendChild(a);
    });
    // Fix copy link showing up in the selected text hover thing
    patchClass(XenForo.SelectQuotable?.prototype, 'createButton', function (original, _) {
        const ret = original();
        const button = this.$button[0];
        const children = button.children;
        if (children.length >= 3) { // 3 includes copy link, 4 includes copy bbcode
            for (let i = 0; i < children.length - 1; i++) { // loop over higher than expected, delete all extra
                button.removeChild(button.lastElementChild);
            }
        }
        return ret;
    });
}
if (settings.postLinkButton && isOnUserProfile) {
    AF(document.querySelectorAll(`li[id^="profile-post-"].messageSimple[data-author]>.messageInfo>.messageMeta>.publicControls`))
        .forEach(post => {
        /* self-comments won't have like, but for ones with like we still want to insert before like */
        const target = post.querySelector('a.LikeLink.like')
            ?? post.querySelector('a.CommentPoster.postComment');
        const id = target.href.replace('https://skyblock.net/', '').split('/')[1];
        console.log(target, id);
        const a = document.createElement('a');
        a.classList.add('item', 'control', 'copylink');
        a.href = `profile-posts/${id}`;
        a.onclick = () => navigator.clipboard.writeText(a.href);
        const span = document.createElement('span');
        span.innerHTML = 'Copy Link';
        a.appendChild(span);
        target.insertAdjacentElement('beforebegin', a);
    });
}
if (settings.minotarNotCrafatar) {
    setTimeout(() => {
        AF(document.querySelectorAll('img[src^="https://crafatar.com/avatars"]')).forEach(x => {
            console.log(x);
            x.setAttribute('src', (x.getAttribute('src') ?? '')
                .replace(/https\:\/\/crafatar.com\/avatars\/([a-fA-F0-9\-]{32,36})\?size=(\d+)&overlay=true/g, 'https://minotar.net/avatar/$1/$2'));
        });
    }, 1000);
}
if (settings.noMoreCamo) {
    setTimeout(() => {
        AF(document.querySelectorAll('[src*="camo.skyblock.net/"]')).forEach(img => {
            let one = decodeURIComponent(img.getAttribute('src') ?? '').split('?url');
            let two = decodeURIComponent(one.length == 2 ? one[1] : one[2]);
            let three = two.startsWith('=') ? two.slice(1) : two;
            img.setAttribute('src', three);
        });
    }, 1000);
}
if (settings.fadeInReactions) {
    GM_addStyle(`.dark_postrating_inputlist {transition: opacity 0.5s;}.dark_postrating_inputlist:not(:hover) {opacity: 0.1 !important;}`);
}
if (settings.moreSearchOnCard) {
    patchClass(XenForo.OverlayLoader?.prototype, 'createOverlay', (original, data) => {
        if (data.templateHtml) {
            if (data.templateHtml.includes(`<div id="memberCard`)) {
                const userID = (data.templateHtml.match(/<a href="members\/.+\.([0-9]+)\/"\>Profile Page<\/a>/)?.[1]) ?? '1';
                const threadsButtonHTML = `<dt>Threads: </dt><dd><a href="search/member?user_id=${userID}&content=thread" class="concealed" rel="nofollow">Search</a></dd>`;
                data.templateHtml = insert(data.templateHtml, data.templateHtml.indexOf('<!-- slot: pre_likes'), threadsButtonHTML);
            }
        }
        else {
            console.log('createoverlay does not contain templatehtml: ' + data);
        }
        return original(data);
    });
}
if (settings.unpinLawsuit && isOnIndex) {
    document.querySelector('[id="recentNews"]>[id="145369"]')?.remove();
}
if (settings.fixOldLinks) {
    document.querySelectorAll('a[href*="block.net"]').forEach((_a) => {
        console.log;
        const a = _a;
        a.href = a.href
            /* replace a http(s) (or no protocol) url with, or without www. on endblock.net, hellblock.net or skyblock.net to be https://skyblock.net */
            .replace(/^((?:https?:\/\/)?(?:w{3})?\.(?:end|hell|sky)block\.net)/g, 'https://skyblock.net')
            .replaceAll(`skyblock.net/index.php?threads`, `skyblock.net/threads`);
    });
}
if (settings.dontShare) {
    GM_addStyle(`div.sharePage {display: none;}`);
}
if (settings.copyMessageBBCodeButton && isOnThread) {
    [...AF(document.querySelectorAll(`li[id^="post-"].message[data-author]`)), ...AF(document.querySelectorAll(`li[id^="message-"].message[data-author]`))] // #message- is conversations, although it doesn't work because there's a separate post count system for them ???
        .forEach(post => {
        const id = post.id.split('-')[1];
        const publicControls = post.querySelector('.publicControls');
        const a = document.createElement('a');
        a.href = `#`;
        a.setAttribute('class', "ReplyQuote item control reply");
        a.title = "Copy message BBCode.";
        a.innerHTML = `<span></span>Copy BBCode`;
        a.onclick = async (ev) => {
            ev.preventDefault();
            const res = await fetch(`https://skyblock.net/posts/${id}/quote`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `_xfResponseType=json&_xfToken=${xfToken}`,
                method: 'POST',
            });
            const body = await res.json();
            // strip quote element and just get the content
            const quoteUnquoted = !body.quote ? '' : body.quote.trim().match(/^\[QUOTE="[^,]+, post: \d+, member: \d+"\](.+)\[\/QUOTE]$/s);
            if (!body.quote || !quoteUnquoted) {
                console.log('body.quote', body.quote);
                console.log('quoteunquoted', quoteUnquoted);
                return window.navigator.clipboard.writeText('<failed to get content>');
            }
            window.navigator.clipboard.writeText(quoteUnquoted[1]);
        };
        publicControls?.appendChild(a);
    });
}
