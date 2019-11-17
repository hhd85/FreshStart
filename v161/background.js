var MAJOR_VERSION = 1.6;
//会话结构  chrome.runtime.reload();
function SessionData(a, b, c, d) {
    this.title = a;
    this.date = b;
    this.urls = [];
    this.tabsCount = c;
    this.folderId = d;
    this.windows = {};
    this.labels = {}
}
SessionData.prototype = {
    addTab: function(a) {
        try {
            this.windows[a.win] = this.windows[a.win] || [];
            var b = {
                title: a.title,
                url: a.url,
				id: a.win
            };
            if (a.pinned) b.pinned = !0;
            this.windows[a.win].push(b);
            this.tabsCount++
        } catch(c) {
            console.error(c)
        }  
    },
    addWinLabel: function(a, b) {
        this.labels[a] = b
    },
    getWinCount: function() {
        var a = 0,
        b;
        for (b in this.windows) a += 1;
        return a
    },
    getCount: function() {
        var a = 0,
        b;
        for (b in this.windows) a += this.windows[b].length;
        return this.tabsCount = a
    },
	//保存
    save: function(a, b) {//
        var c = this;
		var List = [];
		//FreshStart Sessions
		/*chrome.storage.local.set({'LIST': 1}, function() {
			console.log('保存成功');
		});*/
		chrome.storage.local.get('LIST', function(result) {
			if (!result || !result.LIST){
				List.data = []
			}else{
				List = result.LIST;
			}
			console.log('读取:',List);
			var item = {};
			
			item.list = [];
			for (id in c.windows){
				
				c.windows[id].forEach(function(a) {
					item.list.push({
                        title: a.title,
                        url: a.url
                    })
                    chrome.tabs.remove(a.id);//关闭标签
                });
				
			}
			item.title = c.title + " (" + c.date + ")--" + item.list.length + "tabs";
			List.data.push(item);
			console.log('添加:',List);
			chrome.storage.local.set({'LIST': List}, function() {
				console.log('保存成功');
			});
		});
		return
        getSessionFolder(function(d) {
            chrome.bookmarks.create({
                parentId: d,
                index: b || 0,
                title: c.title + " (" + c.date + ")--" + c.getCount() + "tabs"
            },function(b) {
                if (b) {
                    c.folderId = b.id;
                    var b = [],d;
                    for (d in c.windows){
						b.push(d);
					}
                    c.saveWindow(b,function() {
                        bookmarkPositionWorkaround();
                        a && a(!0)
                    })
                } else a && a(!1)
            })
        })
    },
	//保存窗口
    saveWindow: function(a, b) {
        if (a.length == 0) b();
        else {
            var c = this,
            d = a.pop();
            chrome.bookmarks.create({
                parentId: this.folderId,
                index: 0,
                title: "window " + d
            },
            function(e) {
                c.windows[d].forEach(function(a) {
                    chrome.bookmarks.create({
                        parentId: e.id,
                        title: a.title,
                        url: a.url
                    })
                });
                c.saveWindow(a, b)
            })
        }
    },
    update: function(a, b) {
        var c = this;
        chrome.bookmarks.removeTree(this.folderId,
        function() {
            c.save(a, localStorage.editOrder == "false" ? b: 0)
        })
    },
	//删除
    remove: function(id,a) {
		var List = [];
		chrome.storage.local.get('LIST', function(result) {
			if (!result || !result.LIST){
				List.data = []
			}else{
				List = result.LIST;
			}
			List.data.splice(id, 1);
			chrome.storage.local.set({'LIST': List}, function() {
				a();
			});
		});
        //chrome.bookmarks.removeTree(this.folderId, a)
    },
    open: function(a) {
        if (this.getWinCount() == 1 && a == 1) for (var b in this.windows) {
            var c = this.windows[b];
            for (b = 0; b < c.length; b++) chrome.tabs.create({
                url: c[b].url
            })
        } else {
            var d = [];
            for (c in this.windows) d.push(this.windows[c]);
            var e = function(a, b, c, d) {
                if (a.length == 0) d();
                else {
                    var j = a.shift(),
                    g = j.shift();
                    try {
                        chrome.windows.create({
                            url: g.url,
                            width: b,
                            height: c
                        },
                        function(g) {
                            j.forEach(function(a) {
                                chrome.tabs.create({
                                    windowId: g.id,
                                    url: a.url
                                })
                            });
                            e(a, b, c, d)
                        })
                    } catch(k) {
                        console.error("Fail to create window", k)
                    }
                }
            };
            chrome.windows.getAll({
                populate: !1
            },
            function(b) {
                var c = [],
                h,
                i;
                b.forEach(function(a) {
                    if (a.focused) h = a.height,
                    i = a.width;
                    c.push(a.id)
                });
                e(d, i, h,
                function() {
                    a == 1 && c.forEach(function(a) {
                        chrome.windows.remove(a)
                    })
                })
            })
        }
    },
    toJson: function() {
        var a = {
            title: this.title,
            date: this.date,
            tabs: []
        },
        b;
        for (b in this.windows) this.windows[b].forEach(function(c) {
            var d = {
                title: c.title,
                url: c.url,
                win: b
            };
            if (c.pinned) d.pinned = !0;
            a.tabs.push(d)
        });
        a.created = (new Date).getTime();
        return JSON.stringify(a)
    }
};
function openDelayed(a, b) {
    setTimeout(function() {
        a.open(b)
    },
    1E3)
}
function init() {
    try {
        if (console.log("Background version 1.6.1"), localStorage.currentSession && localStorage.prevSession != localStorage.currentSession) {
            for (var a = 3; a >= 0; a--) {
                var b = localStorage["prevSession-" + a];
                b && (localStorage["prevSession-" + (a + 1)] = b)
            }
            localStorage.prevSession && (localStorage["prevSession-0"] = localStorage.prevSession);
            var c = JSON.parse(localStorage.currentSession);
            localStorage.prevSession = JSON.stringify(c)
        }
    } catch(d) {
        console.error(d)
    }
    try {
        if (!localStorage.welcomeshown && !localStorage.updateread) localStorage.welcomeshown = "true",
        localStorage.updateread = MAJOR_VERSION,
        chrome.bookmarks.getTree(function(a) {
            chrome.bookmarks.getChildren(a[0].children[1].id,
            function(a) {
                for (var b, c = 0; c < a.length; ++c) if (a[c].title == "FreshStart Sessions") {
                    b = a[c].id;
                    break
                }
                b || chrome.tabs.create({
                    url: "http://blog.visibotech.com/2010/02/thank-you-for-installing-freshstart.html"
                })
            })
        })
    } catch(e) {}
    changeBackupSetting(); (a = localStorage.popupSize) && a.replace("%", "") > 1 && (localStorage.popupSize = parseInt(a) / 100)
}
var backupTimerId;
function changeBackupSetting() {
    if (localStorage.crashRestore == "true") {
        window.clearInterval(backupTimerId);
        var a = parseInt(localStorage.backupPeriod);
        if (isNaN(a) || a < 1 || a > 1E3) a = 5;
        backupTimerId = window.setInterval(saveBackupSession, 6E4 * a)
    } else try {
        delete localStorage.currentSession,
        window.clearInterval(backupTimerId)
    } catch(b) {
        console.error(b)
    }
}
//初始化
function initSession(a) {
	chrome.storage.local.get('LIST', function(result) {
		if (!result || !result.LIST){
			List.data = []
		}else{
			List = result.LIST;
		}
		var d = []
		List.data.forEach(function(item) {
			var f = item.title.match(/^(.*)\((\d+\/\d+\/\d+)\)--(\d+)tabs$/i);
			sessionData = new SessionData(f[1].trim(), f[2], f[3],0);
			var i = 0;
			item.list.forEach(function(urls) {
				sessionData.addTab({
					id: i,
					url: urls.url,
					title: urls.title,
					win: "_win"
				})
				i++;
			});
            d.push(sessionData)
        });
		a(d);
	});
	return
    getSessionFolder(function(b) {
        chrome.bookmarks.getChildren(b,
        function(b) {
            for (var d = [], e = 0; e < b.length; e++) {
                var f = b[e].title.match(/^(.*)\((\d+\/\d+\/\d+)\)--(\d+)tabs$/i);
                if (b[e].url != null) console.log("Error: Not a sessions folder:" + b[e].title);
                else try {
                    sessionData = new SessionData(f[1].trim(), f[2], f[3], b[e].id),
                    d.push(sessionData)
                } catch(l) {
                    console.log("Error: wrong session format:" + b[e].title)
                }
            }
            a(d)
        })
    })
}
function getSession(a, b) {
    chrome.bookmarks.get(a,
    function(c) {
        var d = c[0].title.match(/^(.*) \((\d+\/\d+\/\d+)\)--(\d+)tabs$/i);
        sessionData = new SessionData(d[1], d[2], d[3], c[0].id);
        chrome.bookmarks.getChildren(a,
        function(a) {
            for (var c = 0; c < a.length; c++) a[c].url && sessionData.urls.push({
                id: a[c].id,
                url: a[c].url,
                title: a[c].title
            });
            b(sessionData)
        })
    })
}
function restoreSession(a, b) {
    chrome.bookmarks.getChildren(a,
    function(a) {
        for (var d = [], e = 0; e < a.length; e++) a[e].url && d.push(a[e].url);
        if (b == 0) chrome.windows.getLastFocused(function(a) {
            chrome.windows.create({
                url: d[0],
                width: a.width,
                height: a.height
            },
            function(a) {
                for (var b = 1; b < d.length; b++) chrome.tabs.create({
                    windowId: a.id,
                    url: d[b]
                })
            })
        });
        else if (b == 1) for (e = 0; e < d.length; e++) chrome.tabs.create({
            url: d[e]
        })
    })
}
function bookmarkPositionWorkaround() {
    setTimeout(function() {
        chrome.bookmarks.getChildren("0",
        function(a) {
            chrome.bookmarks.create({
                parentId: a[0].id,
                url: "http://www.example.com"
            },
            function(a) {
                console.log("Reposition default folder");
                chrome.bookmarks.remove(a.id)
            })
        })
    },
    2E3)
}
function updateSession(a, b) {
    chrome.bookmarks.getChildren(a.folderId,
    function(c) {
        chrome.bookmarks.update(a.folderId, {
            title: a.title + " (" + a.date + ")--" + a.urls.length + "tabs"
        });
        for (var d = 0; d < c.length; ++d) chrome.bookmarks.remove(c[d].id);
        for (d = 0; d < a.urls.length; ++d) chrome.bookmarks.create({
            parentId: a.folderId,
            title: a.urls[d].title,
            url: a.urls[d].url
        });
        bookmarkPositionWorkaround();
        b()
    })
}
//获取会话收藏夹
function getSessionFolder(a) {
    var b, c;
	console.log('会话收藏夹',a);
    chrome.bookmarks.getTree(function(d) {
        c = d[0].children[1].id;
        chrome.bookmarks.getChildren(c,function(d) {
            for (var f = 0; f < d.length; f++) if (d[f].title == "FreshStart Sessions") {
                b = d[f].id;
                break
            }
            if (b == null){
				console.log('会话收藏夹为空，需要新创建');
				chrome.bookmarks.create({
					parentId: c,
					title: "FreshStart Sessions"
				},function(c) {
					if (c){
						b = c.id;
					}
					a(b)
				})
			}else{
				a(b)
			}
        })
    })
}
function saveBackupSession() {
    var a = new Date,
    a = a.getDate() + "/" + (a.getMonth() + 1) + "/" + (a.getYear() + 1900),
    b = new SessionData("currentSession", a);
    chrome.windows.getAll({
        populate: !0
    },
    function(a) {
        a.forEach(function(a) {
            a.tabs.forEach(function(c) {
                b.addTab({
                    url: c.url,
                    title: c.title,
                    win: a.id,
                    pinned: c.pinned
                })
            })
        });
        b.getCount() > 0 && (localStorage.currentSession = b.toJson())
    })
}
init();