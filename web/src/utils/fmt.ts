export function sizeFmt(bytes:number, fixed:number = 2):string {
    const symbols = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
        exp = 0;
    }
    const i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);

    let bytesStr:string
    if (bytes.toString().length > bytes.toFixed(fixed).toString().length) {
        bytesStr = bytes.toFixed(fixed);
    } else {
        bytesStr = bytes.toString()
    }
    return bytesStr + ' ' + symbols[i];
}
