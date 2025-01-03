let SELECTED_VANILLA_THEME = localStorage.getItem('sbe-vanilla-style')

function waitForElm<T>(selector: string): Promise<Element | null | T> {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector) as T);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function between(x: number, min: number, max: number) {
    return x >= min && x <= max;
}

// https://www.codespeedy.com/get-the-ratio-of-two-numbers-in-javascript/
function calculateRatio(num_1: number, num_2: number){
    for(var num=num_2; num>1; num--) {
        if((num_1 % num) == 0 && (num_2 % num) == 0) {
            num_1 = num_1/num;
            num_2 = num_2/num;
        }
    }
    var ratio = num_1+":"+num_2;
    return ratio;
}

const AF = Array.from

const colonNumber = (array: any[], number: number) => array.filter((_val, index) => index < number).filter(x=>x!=='')

const getMonthFromString = (month: string) => new Date(Date.parse(month +" 1, 2012")).getMonth()+1

const getHrefWithoutAnchor = () => window.location.href.replace(new RegExp(`${window.location.hash}$`), '')

const isOnThread = getHrefWithoutAnchor().match(/https\:\/\/skyblock\.net\/threads\/.+\.\d+\/?/)

const isOnUserProfile = window.location.href.match(/https\:\/\/skyblock\.net\/members\/([a-zA-Z0-9_\.]+)\.\d+/) ?? false
const isOnIndex = window.location.href == 'https://skyblock.net/'

const isOnOriginalTheme = (
    !document.querySelector('.social-row>[href="https://www.reddit.com/r/SkyBlock"]') &&
    document.querySelector('.pageContent>span>a[href="http://blackcaffeine.com/"]')
)

const isOnMiddleTheme = (
    !document.querySelector('a[href="http://blackcaffeine.com/"]') &&
    !document.querySelector('.social-row>[href="https://www.reddit.com/r/SkyBlock"]')
)

const isOnNewTheme = (
    document.querySelector('.link-row>a[href="/how-to-install-skyblock"]') &&
    document.querySelector('#footer>.top>.container>.col>p')
)

/* DEBUGGING FUNCTION - NOT ACTUALLY USED */
const $import = (fn: string): string => {
    alert('If you are seeing this, something has gone very wrong.')
    return ''
}

const xfToken = XenForo._csrfToken

const ls = localStorage

GM_addStyle($import('default.css'))

function patchClass(obj: any, method: string, newImplementation: (original: Function, ...args: any) => void) {
    if (typeof obj == 'undefined') return console.log(`Cannot patch ${method} of ${obj}.`)
    const originalMethod = obj[method];
    console.log(`Patching ${method}`, originalMethod)

    obj[method] = function (...args: any) {
        return newImplementation.call(this, originalMethod.bind(this), ...args);
    };
}


// adapted from https://stackoverflow.com/a/9160869
const insert = (fullString: string, index: number, subString: string) => 
    index > 0 ? fullString.substring(0, index) + subString + fullString.substring(index, fullString.length)
              : subString + fullString