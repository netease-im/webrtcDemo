
/**
 * 简单处理search，
 * @param {String} search 
 */
function _parseQuery(search) {
  if (!search) return null;
  var arr = search.replace(/^\?/, '')
    .split('&')
    .map(function (keyAndValue) {
      return keyAndValue.split('=')
    })
  if (arr.length) {
    var ret = {};
    arr.forEach(function (keyAndValue) {
      ret[keyAndValue[0]] = keyAndValue[1];
    })
    return ret;
  } else {
    return null;
  }
}