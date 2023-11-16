export function isFalsyStr(str: string) {
  return str === '' || str === '0' || str === 'false' || str === 'null' || str === 'undefined';
}
