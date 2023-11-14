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

const isOnUserProfile = window.location.href.match(/https\:\/\/skyblock\.net\/members\/([a-zA-Z0-9_\.]+)\.\d+/) ?? false

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