var background = chrome.extension.getBackgroundPage(),
sessions = [],
editedSession,
editedBlock,
allWindows = [];
function getMessage(a, b) {
    try {
        var c = chrome.i18n.getMessage(a, b);
        if (c) return c
    } catch(d) {}
}
//升级点击连接URL
function openUpdate() {
    localStorage.updateread = background.MAJOR_VERSION;
    chrome.tabs.create({
        url: "http://blog.visibotech.com/search/label/FreshStart",
        selected: !0
    });
    $("#updateNotifier").hide();
    window.close()
}
//显示当前所有标签
function populateWin(a, b, c) {
    var d = $("#" + b),
    f = $("<div/>", {
        "class": "winWrapper",
        winId: a.id,
        id: b + "Wrapper" + a.id
    });
    c ? f.prependTo(d) : f.appendTo(d);
    var d = $("<div/>", {
        "class": "smwinline"
    }).appendTo(f),
    g = $("<input/>", {
        id: b + "_win_" + a.id,
        "class": "smwincheck",
        type: "checkbox",
        checked: c,
        change: function() {
            $(this).prop("checked") == !0 ? f.find(".smcheck").prop("checked", !0) : f.find(".smcheck").prop("checked", !1)
        }
    }).appendTo(d);
    $("<span/>", {
        "class": "smWinblabel",
        text: a.label || (c ? "Current Window": "window(" + a.id + ")")
    }).appendTo(d);
    if (a.tabs){
        a = a.tabs;
    }
    for (d = 0; d < a.length; d++) {
        var e = a[d],
        h = $("<div/>", {
            "class": "smtabline",
            title: e.title == e.url ? e.title: e.title + " : " + e.url
        }).appendTo(f);
        $("<input/>", {
            id: "tabcheck_" + e.id,
            "class": "smcheck",
            type: "checkbox",
            checked: c,
            change: function() {
                $(this).prop("checked") == !0 && g.prop("checked", !0)
            }
        }).appendTo(h)[0].tab = e;
        b == "smlistoriginal" ? $("<span/>", {
            "class": "smtablabel",
            text: e.title,
            link: e.url,
            click: function() {
                chrome.tabs.create({
                    url: $(this).attr("link")
                })
            }
        }).appendTo(h) : $("<span/>", {
            "class": "smtablabel",
            text: e.title
        }).appendTo(h)
    }
    $('#smsavebase input[type="checkbox"]').change(function() {
        var a = $("#smsavebase .smcheck:checked").length == 0;
        $("#smsavebutton").prop("disabled", a)
    })
}
function init() {
    $("#stringUpdatedMessage").html(getMessage("updatedMessage"));
    $("#stringSaveSession").html(getMessage("saveSession"));
    $("#savetitle").val(getMessage("mySession"));
    $("#smsavelist").attr("title", getMessage("smSaveList"));
    $("#smsavetoggle").attr("title", getMessage("smSaveToggle"));
    $("#smeditnewtoggle").attr("title", getMessage("smSaveToggle"));
    $("#smeditsavedtoggle").attr("title", getMessage("smSaveToggle"));
    $("#smrestorelabel").html(getMessage("restoreSession"));
    $("#smrestorelabel2").html(getMessage("restoreSession2"));
    $("#smheadingtitle").html(getMessage("smHeadingTitle"));
    $("#smheadingnew").html(getMessage("smHeadingNew"));
    $("#smheadingnew").attr("title", getMessage("smHeadingNewTitle"));
    $("#smheadingsaved").html(getMessage("smHeadingSaved"));
    $("#smeditsave").attr("value", getMessage("smEditSave"));
    $("#smeditcancel").attr("value", getMessage("smEditCancel"));
    $("#smeditremove").attr("value", getMessage("remove"));
    $("#options").html(getMessage("options"));
    $("#sessionTextBoxCloseBtn").attr("title", getMessage("sessionTextBoxClose"));
    $("#importSessionBtn").attr("title", getMessage("sessionTextBoxImport"));
    $(selectAll).text(getMessage("selectAll"));
    localStorage.lastUsedSessionName && $("#savetitle").val(localStorage.lastUsedSessionName);
    localStorage.getItem("updateread") && localStorage.getItem("updateread") < background.MAJOR_VERSION && $("#updateNotifier").show();
    var a = !1;
    //加载当前页所有标签
    chrome.windows.getLastFocused(function(b) {
        chrome.windows.getAll({
            populate: !0
        },function(d) {
            d.forEach(function(d) {
                b.id == d.id && (a = !0);
                populateWin(d, "smsavelist", b.id == d.id)
            });
            d.length == 1 && $(smsaveToggleH4).hide();
            a || (console.error("Cannot find last focused window"), $("#smsavelistWrapper" + d[0].id + " input[type=checkbox]").prop("checked", !0))
        })
    });
    LoadlocalData();
    
    // background.initSession(function(a) {
    //     sessions = a;
        
    // });
    var b = document.getElementById("savetitle");
    b.focus();
    b.select();
    b.addEventListener("keypress",
    function(a) {
        a.keyCode == 13 && save()
    });
    localStorage.crashRestore == "true" ? ($(smrestorecrash).attr("title", getMessage("restorePreviousSession")), $(smrestorecrashoff).hide()) : ($(smrestorecrash).attr("title", getMessage("enableCrashRecovery")), $(smrestorecrashon).hide());
    b = localStorage.popupSize;
    b < 1 && ($("body").css("zoom", b), $("body").height(480 * b), $("html").height(480 * b))
}
function crashRestore() {
    localStorage.crashRestore == "true" ? chrome.tabs.create({
        url: "v161/crashRestore.html",
        selected: !0
    }) : chrome.tabs.create({
        url: "v161/options.html",
        selected: !0
    });
    window.close()
}
//读取保存的数据
function LoadlocalData() {
    chrome.storage.local.get('LIST', function(result) {
        if (!result || !result.LIST){
            sessions = []
        }else{
            sessions = result.LIST;
        }
        createSessionList();
    });
}
function createSessionList() {
    var a = $("#smrestorelist");
    if (sessions.length == 0) var b = $("<div/>", {
        "class": "nosessionsaved",
        text: getMessage("noSessionSaved")
    }).appendTo(a);
    else for (var i = 0; i < sessions.length; i++) {
        var item = sessions[i],
        b = $("<div/>", {
            id: "session_" + i,
            "class": "smsessionblock",
            title: getMessage("clickToRestore", [item.title]),
            mousedown: stopDragEffect
        }).appendTo(a);
        b[0].sessionId = i;
        var f = $("<div/>", {
            "class": "smsessionlabel",
            mousedown: restoreSession
        }).appendTo(b);
        $("<div/>", {
            "class": "smsessiontitle",
            text: item.title
        }).appendTo(f);
        $("<div/>", {
            "class": "smsessioncount",
            text: getMessage("tabsCount", [item.list.length])
        }).appendTo(f);
        $("<div/>", {
            "class": "smsessiontimelabel",
            text: changeDateFormat(item.date),
            mousedown: restoreSession
        }).appendTo(b);
        b = $("<div/>", {
            "class": "controls"
        }).appendTo(b);
        $("<div/>", {
            "class": "control smsessionremove",
            title: getMessage("remove"),
            click: remove
        }).appendTo(b);
        $("<div/>", {
            "class": "control smsessionedit",
            title: getMessage("edit"),
            click: edit
        }).appendTo(b);
        $("<div/>", {
            "class": "control smsessionexport",
            title: getMessage("export"),
            click: exportSession
        }).appendTo(b)
    }
}
function changeDateFormat(a) {
    var b = a.split("/");
    switch (localStorage.dateFormat) {
    case "1":
        a = b[0] + "/" + b[1] + "/" + b[2];
        break;
    case "2":
        a = b[1] + "/" + b[0] + "/" + b[2];
        break;
    case "3":
        a = b[2] + "-" + b[1] + "-" + b[0];
        break
    }
    return a
}
//新保存
function save(a) {
    if ($("#smsavebutton").prop("disabled")){
        console.log("no tab selected");
    } else {
        var title = $("#savetitle").val() || "My Session";
        localStorage.lastUsedSessionName = title;  //最后使用名称
		//获取所有标签
        chrome.windows.getAll({
            populate: !0
        },function(win) {
            var date = new Date;
            date = date.getDate() + "/" + (date.getMonth() + 1) + "/" + (date.getYear() + 1900);
            var Item   = {};
            Item.date  = date;
            Item.title = title;
            Item.list  = [];

            win.forEach(function(tabs) {
                tabs.tabs.forEach(function(tab) {
                    var item = $("#tabcheck_" + tab.id);
                    if (item && item.prop("checked")){
                        Item.list.push({
                            url: tab.url,
                            title: tab.title,
                            id: tab.id
                        })
                        if (a.ctrlKey || a.metaKey){
                        chrome.tabs.remove(tab.id);//关闭标签
                        }
                    }
                })
            });
            if (Item.list.length > 0){
                sessions.push(Item)
                chrome.storage.local.set({'LIST': sessions}, function() {
                    console.log('保存成功');
                });
            }
            window.close()
        })
    }
}
//恢复打开
function restoreSession(a) {
    //try {
        var b = closest(a.target, "smsessionblock")
        var item = sessions[b.sessionId];
        if (item) {
            var d = a.button;
            if (a.ctrlKey || a.metaKey){ //新窗口
                chrome.windows.create({},function(g) {
                    item.list.forEach(function(tab) {
                        chrome.tabs.create({
                            windowId: g.id,
                            url: tab.url
                        })
                    });
                })
            }else{ //当前窗口
                item.list.forEach(function(tab) {
                    chrome.tabs.create({
                        url: tab.url
                    })
                });
            }
			// c.open(d);
           // loadSessionFromId(c.folderId,
           // function(a) {
           //     d == 1 && a.getWinCount() > 1 ? confirm(getMessage("confirmClose")) && a.open(d) : (background.openDelayed(a, d), window.close())
            //})
        }
    //} catch(f) {
   //     console.error(f)
   // }
}
function stopDragEffect(a) {
    a.preventDefault();
    a.stopPropagation()
}
function showTooltip(a) {
    var b = closest(a.target, "smsessionblock").querySelector(".tooltip");
    b.textContent = a.target.getAttribute("title");
    b.style.marginRight = a.target.parentNode.offsetWidth - a.target.offsetLeft - 16 + "px"
}
function hideTooltip(a) {
    closest(a.target, "smsessionblock").querySelector(".tooltip").textContent = ""
}
function renameChange(a) {
    a.keyCode == 13 && editSave(a)
}
function edit(a) {
    a = closest(a.target, "smsessionblock");
    editedSession = sessions[a.sessionId];
    editedBlock = a;
    $("#smeditlist1").empty();
    chrome.windows.getLastFocused(function(a) {
        chrome.windows.getAll({
            populate: !0
        },function(c) {
            c.forEach(function(c) {
                populateWin(c, "smeditlist1", a.id == c.id)
            });
            $("#smeditlist1 input[type=checkbox]").prop("checked", !1)
        })
    });
    $("#smlistoriginal").empty();
    // loadSessionFromId(editedSession.folderId,function(a) {
        $("#smeditsave").prop("index", a.sessionId);
        // editedSession.list.forEach(function(c) {
            
        // });
        populateWin(editedSession.list, "smlistoriginal", !0)
        // for (var item in editedSession.list) populateWin({
        //     id: item.id,
        //     // tabs: a.windows[c],
        //     label: item.title
        // },
        // "smlistoriginal", !0);
        $("#smlistoriginal input[type=checkbox]").prop("checked", !0);
        $("#smrestorelist").hide();
        $("#smeditsession").show().animate({
            left: "0%"
        },
        250, "swing",
        function() {
            $("#smtitle").val(editedSession.title).focus().select()
        });
        $('#smeditsession input[type="checkbox"]').change(function() {
            var a = $("#smeditsession .smcheck:checked").length == 0;
            $("#smeditsave").prop("disabled", a)
        });
        $(function() {
            $("#smeditlist1, #smlistoriginal").sortable({
                items: ".smtabline",
                connectWith: ".smeditlist"
            }).disableSelection()
        })
    // })
}
function editSave() {
    if (!$("#smeditsave").prop("disabled") && $("#smtitle").val()) {
        console.log($("#smtitle").val())
        var time = new Date,
        time = time.getDate() + "/" + (time.getMonth() + 1) + "/" + (time.getYear() + 1900);
        // b = new background.SessionData($("#smtitle").val(), a, 0, editedSession.folderId);
        var list = [];
        $.each($("#smeditsession .winWrapper"),function(a, c) {
            var g = $(c),
            e = g.attr("winId");
            $.each(g.find(".smcheck"),function(a, c) {
                if (c.checked) {
                    var d = c.tab;
                    if (d){
                        list.push({
                            url: d.url,
                            title: d.title,
                            id: d.id
                        })
                    }
                }
            })
        });
        sessions[editedBlock.sessionId].title = $("#smtitle").val();
        sessions[editedBlock.sessionId].time = time;
        sessions[editedBlock.sessionId].list = list;
        chrome.storage.local.set({'LIST': sessions}, function() {
            console.log('保存成功');
        });
        // $(editedBlock).find(".smsessiontitle").text(title);
        // $(editedBlock)[0].sessionId = b.id;
        // $(editedBlock).find(".smsessioncount").text(getMessage("tabsCount", [c]));
        // var c = b.getCount();
        // c > 0 ? b.update(function(a) {
        //     a ? ($(editedBlock).find(".smsessiontitle").text(b.title), $(editedBlock)[0].sessionId = b.id, $(editedBlock).find(".smsessioncount").text(getMessage("tabsCount", [c])), delete sessions[editedSession.id], sessions[b.sessionId] = b) : alert("Update faile, try again later.")
        // },
        $("#smeditsave").prop("index");
        editCancel();
        window.location.reload()
    }
}
function editCancel() {
    $("#smeditsession").animate({
        left: "100%"
    },
    250, "swing",
    function() {
        $("#smeditsession").hide();
        $("#smrestorelist").show()
    })
}
function editRemove() {
    remove({
        target: editedBlock
    });
    editCancel()
}
function remove(a) {
    var b = "Are you sure to remove this sessions?",
    b = getMessage("confirmDeleteQuestion");
    renderConfirmBox(b,
    function(b) {
        if (b) {
            var d = closest(a.target, "smsessionblock"),
            b = sessions[d.sessionId];
            $("#smrestorelist .smsessionblock").remove();
            // b && b.remove(d.sessionId,function() {
                sessions.splice(d.sessionId, 1);
                chrome.storage.local.set({'LIST': sessions}, function() {
                    createSessionList()
                });
                
            // })
        }
    })
}
function renderConfirmBox(a, b) {
    var c = $("#smrestorebase"),
    d = $("<div>", {
        "class": "confirmBox",
        style: "display:none"
    }).appendTo(c);
    d.fadeIn();
    c = $("<div>", {
        "class": "messageBox"
    });
    c.html(a);
    c.appendTo(d);
    c = $("<div>", {
        "class": "confirmButton"
    });
    c.html(getMessage("confirm"));
    c.click(function() {
        b(!0);
        d.remove()
    });
    c.appendTo(d);
    c = $("<div>", {
        "class": "cancelButton"
    });
    c.html(getMessage("cancel"));
    c.click(function() {
        b(!1);
        d.remove()
    });
    c.appendTo(d)
}
function closest(a, b) {
    for (; a && a.className.indexOf(b) < 0;) a = a.parentNode;
    return a
}
function saveToggle() {
    var a = $('#smsavelist input[type="checkbox"]');
    $(smsavetoggle).prop("checked") ? a.prop("checked", !0) : a.prop("checked", !1);
    $("#smsavebase .smcheck").change()
}
function exportSession(a) {
    // a = closest(a.target, "smsessionblock"); (a = sessions[a.sessionId]) && loadSessionFromId(a.folderId,
    // function(a) {
    //     a = a.toJson();
    //     showExportedSessionAsText(a)
    // })
}
function showExportedSessionAsText(a) {
    $("#sessionTextBoxTips").html(getMessage("exportedSessionCopyTips"));
    $("#importSessionBtn").hide();
    $("#sessionTextBox").fadeIn();
    $("#sessionTextBoxTextArea")[0].value = a;
    $("#sessionTextBoxTextArea")[0].select()
}
function importSession() {
    var a = $("#sessionTextBoxTextArea").val(),
    b;
    try {
        var c = JSON.parse(a);
        b = new background.SessionData(c.title, c.date);
        c.tabs.forEach(function(a) {
            b.addTab(a)
        })
    } catch(d) {
        b = new background.SessionData;
        for (var a = a.split("\n"), c = new Date, c = c.getDate() + "/" + (c.getMonth() + 1) + "/" + (c.getYear() + 1900), f = "", g = "", e = 0; e < a.length; e++) a[e].indexOf("Name: ") > -1 ? b.title = a[e].replace("Name: ", "") || "imported session": a[e].indexOf("Date: ") > -1 ? b.date = a[e].replace("Date: ", "") || c: a[e].indexOf("Title: ") > -1 ? f = a[e].replace("Title: ", "") : a[e].indexOf("Url: ") > -1 && (g = a[e].replace("Url: ", "")),
        f != "" && g != "" && (b.addTab({
            url: g,
            title: f,
            win: "_win"
        }), f = g = "")
    }
    b.save();
    $("#sessionTextBox").fadeOut();
    window.close()
}
function showImportSessionBox() {
    $("#sessionTextBoxTips").html(getMessage("importedSessionTips"));
    $("#importSessionBtn").show();
    $("#sessionTextBoxTextArea").val("");
    $("#sessionTextBox").fadeIn();
    $("#sessionTextBoxTextArea").focus()
}
$(document).ready(function() {
    $(updateNotifier).click(function() {
        openUpdate()
    });
    $(smsavebutton).click(function(e) {
        save(e)
    });
    $(smsavetoggle).click(function() {
        saveToggle()
    });
    $(smtitle).keypress(function(a) {
        renameChange(a)
    });
    $(smeditnewtoggle).click(function() {
        var a = $(this).prop("checked");
        $('#smeditlist1 input[type="checkbox"]').prop("checked", a);
        $("#smeditsession .smcheck").change()
    });
    $(smeditsavedtoggle).click(function() {
        var a = $(this).prop("checked");
        $('#smlistoriginal input[type="checkbox"]').prop("checked", a);
        $("#smeditsession .smcheck").change()
    });
    $(smeditsave).click(function() {
        editSave()
    });
    $(smeditcancel).click(function() {
        editCancel()
    });
    $(smeditremove).click(function() {
        editRemove()
    });
    $(options).click(function() {
        chrome.tabs.create({
            url: "v161/options.html"
        })
    });
    $(importBtn).click(function() {
        showImportSessionBox()
    });
    $(smrestorecrash).click(function() {
        crashRestore()
    });
    $(sessionTextBoxCloseBtn).click(function() {
        $(sessionTextBox).fadeOut()
    });
    $(importSessionBtn).click(function() {
        importSession()
    });
    init()
});