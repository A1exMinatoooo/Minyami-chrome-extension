import { Playlist } from "../../core/m3u8.js";
import Storage from "../../core/utils/storage.js";
chrome.runtime.onInstalled.addListener((details) => {
    localStorage.removeItem("history");
});
let processMessage = function(message, sender, sendResponse) {
    console.log(message);
    if (message.type === "playlist") {
        const playlist = new Playlist({
            content: message.content,
            url: message.url,
            title: message.title,
            streamName: message.streamName
        });
        if (!Storage.getHistory(sender.tab.url).some((p) => p.url === playlist.url)) {
            Storage.setHistory(sender.tab.url, playlist);
        }
    }
    if (message.type === "playlist_chunklist") {
        const playlist = new Playlist({
            content: message.content,
            url: message.url,
            title: message.title,
            disableAutoParse: true
        });
        playlist.chunkLists = message.chunkLists;
        if (!Storage.getHistory(sender.tab.url).some((p) => p.url === playlist.url)) {
            Storage.setHistory(sender.tab.url, playlist);
        }
    }
    if (message.type === "key") {
        if (!Storage.getHistory(sender.tab.url + "-key").includes(message.key)) {
            Storage.setHistory(sender.tab.url + "-key", message.key);
        }
    }
    if (message.type === "cookies") {
        if (!Storage.getHistory(sender.tab.url + "-cookies").includes(message.cookies)) {
            Storage.setHistory(sender.tab.url + "-cookies", message.cookies);
        }
    }
};
// Chromium
chrome.runtime.onMessageExternal.addListener(processMessage);
// Firefox
chrome.runtime.onMessage.addListener(processMessage);
// 监视页面关闭
const tabToUrl = {};
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    tabToUrl[tabId] = tab.url;
    if (changeInfo.status && changeInfo.status === "loading") {
        // 刷新时移除原有数据
        Storage.removeHistory(tabToUrl[tabId]);
        Storage.removeHistory(tabToUrl[tabId] + "-key");
        Storage.removeHistory(tabToUrl[tabId] + "-cookies");
    }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (tabToUrl[tabId]) {
        Storage.removeHistory(tabToUrl[tabId]);
        Storage.removeHistory(tabToUrl[tabId] + "-key");
        Storage.removeHistory(tabToUrl[tabId] + "-cookies");
        delete tabToUrl[tabId];
    }
});