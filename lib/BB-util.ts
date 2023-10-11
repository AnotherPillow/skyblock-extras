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

var _listenForChildUpdateObservers = {}

function listenForChildUpdate(selector: string, callback: (elm: ReturnType<Document['querySelector']>) => void) {
    var target = document.querySelector(selector);

    //@ts-ignore
    _listenForChildUpdateObservers[selector] = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            callback(target)
        });    
    });

    // configuration of the observer:
    var config = { attributes: true, childList: true, characterData: true };

    // pass in the target node, as well as the observer options
    //@ts-ignore
    _listenForChildUpdateObservers[selector].observe(target as any, config);

    // later, you can stop observing
    // _listenForChildUpdateObservers[selector].disconnect();
}

function between(x: number, min: number, max: number) {
    return x >= min && x <= max;
}

const isOnUserProfile = window.location.href.match(/https\:\/\/skyblock\.net\/members\/([a-zA-Z0-9_\.]+)\.\d+/) ?? false