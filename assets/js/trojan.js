/**
 * Script executed in GitHub page
 */

console.log('HELLO GITHUB');

chrome.runtime.sendMessage({
    action: 'getSource',
    source: document.documentElement.outerHTML,
    url: window.document.location.href
});
