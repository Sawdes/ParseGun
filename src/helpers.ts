export function isEmptyObject(obj: {}): boolean {
    return Object.keys(obj).length === 0;
}

export function generateRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function isValidURL(str: string) {
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

export function isOzonURL(url: string) {
    const hostname = new URL(url).hostname
    if(hostname == 'www.ozon.ru' || hostname == 'ozon.ru') {
        return true
    } else {
        return false
    }
}