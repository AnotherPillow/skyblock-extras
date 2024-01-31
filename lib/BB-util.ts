function waitForElm(selector: string): Promise<Element | null> {
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

const isOnNewTheme = (
    document.querySelector('[data-clipboard-text="play.skyblock.net"]') ||
    document.querySelector('a[href="https://benjdzn.com"]') 
)

/* DEBUGGING FUNCTION - NOT ACTUALLY USED */
const $import = (fn: string): string => {
    alert('If you are seeing this, something has gone very wrong.')
    return ''
}

const xfToken = (document.querySelector('[name="_xfToken"') as HTMLInputElement).value