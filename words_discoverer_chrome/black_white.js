var list_section_names = {'wd_black_list': 'blackListSection', 'wd_white_list': 'whiteListSection', 'wd_user_vocabulary': 'vocabularySection','wd_user_not_handled':'vocabularyNeedLearnSection'};

function process_delete_simple(list_name, key) {
    chrome.storage.local.get([list_name], function(result) {
        var user_list = result[list_name];
        delete user_list[key];
        chrome.storage.local.set({[list_name]: user_list});
        show_user_list(list_name, user_list);
    });
}

function process_delete_vocab_entry(key) {
    chrome.storage.local.get(['wd_user_vocabulary', 'wd_user_vocab_added', 'wd_user_vocab_deleted','wd_user_not_handled'], function(result) {
        var user_vocabulary = result.wd_user_vocabulary;
        var wd_user_vocab_added = result.wd_user_vocab_added;
        var wd_user_vocab_deleted = result.wd_user_vocab_deleted;
        var wd_user_not_handled = result.wd_user_not_handled;

        var new_state = {'wd_user_vocabulary': user_vocabulary};
        delete user_vocabulary[key];
        if (typeof wd_user_vocab_added !== 'undefined') {
            delete wd_user_vocab_added[key];
            new_state['wd_user_vocab_added'] = wd_user_vocab_added;
        }
        if (typeof wd_user_vocab_deleted !== 'undefined') {
            wd_user_vocab_deleted[key] = 1;
            new_state['wd_user_vocab_deleted'] = wd_user_vocab_deleted;
        }
        chrome.storage.local.set(new_state, sync_if_needed);
        show_user_list('wd_user_vocabulary', user_vocabulary);
    });
}

function process_delete_all_entry(listName) {
    chrome.storage.local.get(['wd_user_vocabulary', 'wd_user_not_handled'], function(result) {
        var user_vocabulary = result.wd_user_vocabulary;
        var wd_user_not_handled = result.wd_user_not_handled;

        var new_state = {'wd_user_vocabulary': user_vocabulary};
        if (list_name === 'wd_user_vocabulary') {
            new_state = {'wd_user_vocabulary': {}};
        } else if (list_name === 'wd_user_not_handled') {
            new_state = {'wd_user_not_handled': {}};
        }

        if (list_name === 'wd_user_vocabulary') {
            chrome.storage.local.set(new_state, sync_if_needed);
            show_user_list('wd_user_vocabulary', {});
        } else if (list_name === 'wd_user_not_handled') {
            chrome.storage.local.set(new_state, sync_if_needed);
            show_user_list('wd_user_not_handled', {});
        }
    });
}

// 从没有掌握中删除
function process_delete_user_not_handled_entry(key,text) {
    chrome.storage.local.get(['wd_user_vocabulary','wd_user_not_handled'], function(result) {
        var user_vocabulary = result.wd_user_vocabulary;
        var wd_user_not_handled = result.wd_user_not_handled;

        delete wd_user_not_handled[text];
        var new_state = {'wd_user_not_handled': wd_user_not_handled};

        if (typeof user_vocabulary !== 'undefined') {
            user_vocabulary[text] = 1;
            new_state['wd_user_vocabulary'] = user_vocabulary;
        }
        chrome.storage.local.set(new_state, sync_if_needed);
        show_user_list('wd_user_not_handled', wd_user_not_handled);
    });
}

function create_button(list_name, text) {
    var result = document.createElement("button");
    result.setAttribute("class", "deleteButton");
    result.expression_text = text;
    if (list_name === 'wd_user_vocabulary') {
        result.addEventListener("click", function(){ process_delete_vocab_entry(this.expression_text); });
    } else if (list_name === 'wd_user_not_handled') {
        // 防止误删 改为双击删除事件
        result.addEventListener("dblclick", function(){ process_delete_user_not_handled_entry(list_name, this.expression_text); });
    } else {
        result.addEventListener("click", function(){ process_delete_simple(list_name, this.expression_text); });
    }
    var img = document.createElement("img");
    img.setAttribute("src", "delete.png");
    img.setAttribute("style","max-width: 34px;max-height: 34px")
    result.appendChild(img);
    return result;
}

function create_label(text) {
    var result = document.createElement("span");
    result.setAttribute("class", "wordText");
    result.textContent = text;
    return result;
}


function show_user_list(list_name, user_list) {
    console.log("show user List: "+list_name);

    var keys = []
    for (var key in user_list) {
        if (user_list.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    var section_name = list_section_names[list_name];
    var div_element = document.getElementById(section_name);
    while (div_element.firstChild) {
        div_element.removeChild(div_element.firstChild);
    }
    if (!keys.length) {
        div_element.appendChild(create_label(chrome.i18n.getMessage("emptyListError")));
        div_element.appendChild(document.createElement("br"));
        return;
    }
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf("'") !== -1 || key.indexOf("\"") !== -1) {
            continue;
        }
        div_element.appendChild(create_button(list_name, key));
        div_element.appendChild(create_label(key));
        div_element.appendChild(document.createElement("br"));
    }
}

function process_import_vocab() {
    chrome.tabs.create({'url': chrome.extension.getURL('import.html')}, function (tab) {
    });
}
function process_import_vocab_nothand() {
    chrome.tabs.create({'url': chrome.extension.getURL('importnothand.html')}, function (tab) {
    });
}

/**
 * 导出单词
 */
function exportDict(dict_name) {
    console.log("export dict: "+ dict_name);
    chrome.storage.local.get(['wd_user_vocabulary','wd_user_not_handled'], function (result) {
        var wd_user_not_handled = result.wd_user_not_handled;
        var user_vocabulary = result.wd_user_vocabulary;
        keys = [];
        var textName = "my_vocabulary_"+getTimeStr('yyyyMMdd_hh-mm-ss_S')+"_.txt";
        if (dict_name === 'wd_user_vocabulary') {
            for (var key in user_vocabulary) {
                if (user_vocabulary.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
        }


        if (dict_name === 'wd_user_not_handled') {
            textName = "my_notHandled_vocabulary_"+getTimeStr('yyyyMMdd_hh-mm-ss_S')+"_.txt";
            for (var key in wd_user_not_handled) {
                if (wd_user_not_handled.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
        }

        var file_content = keys.join('\r\n')
        var blob = new Blob([file_content], {type: "text/plain;charset=utf-8"});
        saveAs(blob, textName, true);
    });
}

function process_display() {

    // TODO replace this clumsy logic by adding a special "data-list-name" attribute and renaming all 3 tags to "userListSection"
    if (document.getElementById("blackListSection")) {
        list_name = "wd_black_list";
    } else if (document.getElementById("whiteListSection")) {
        list_name = "wd_white_list";
    } else if (document.getElementById("vocabularyNeedLearnSection")) {
        list_name = "wd_user_not_handled";
    } else {
        list_name = "wd_user_vocabulary";
        
    }

    chrome.storage.local.get([list_name], function(result) {
        var user_list = result[list_name];
        show_user_list(list_name, user_list);
    });
}

function addControlListiner() {
    // deleteAllButtonAction
    var div_allButton = document.getElementById("deleteAllButton");
    div_allButton.addEventListener("dblclick", function(){
        var retVal = confirm("Are you sure delete All Vocabulary ? Cannot restored!!!");
        if( retVal == true ){
            exportDict(list_name);
            process_delete_all_entry(list_name,this.expression_text);
        } else{
        }
    });

    var export_allButton = document.getElementById("exportAllButton");
    export_allButton.addEventListener("click", function(){
        exportDict(list_name);
    });

    var export_allButton = document.getElementById("importAllButton");

    if (list_name === 'wd_user_vocabulary') {
        export_allButton.addEventListener("click", function(){
            process_import_vocab();
        });
    } else if (list_name === 'wd_user_not_handled') {
        export_allButton.addEventListener("click", function(){
            process_import_vocab_nothand();
        });
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("load black_white js");
    process_display();
    addControlListiner();
});
