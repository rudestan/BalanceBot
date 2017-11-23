// run: phantomjs --ssl-protocol=any balance.js -l <login> -p <pin>

var system = require('system');

var loadInProgress = false;
var showStatus = false;
var step = 0;
var entryPointURL = 'https://www.berliner-sparkasse.de/en/home.html';
var userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36';
var page = require('webpage').create();

function getCmdParam(type) {
    var a = '';
    system.args.forEach(function (arg, i) {
        if(arg == type && typeof(system.args[i+1]) !== 'undefined') {
            a = system.args[i+1];
        }
    });
    return a;
}

page.onConsoleMessage = function(msg) {
    console.log(msg);
    system.stderr.writeLine('console: ' + msg);
};

page.onLoadStarted = function() {
    loadInProgress = true;

    if(showStatus)
        console.log("loading started");
};

page.onLoadFinished = function() {
    loadInProgress = false;

    if(showStatus)
        console.log("loading finished");
};


var scenario = [
// load form page
    function() {
        page.settings.userAgent = userAgent;
        page.open(entryPointURL, function(status) {
            var login     = getCmdParam('-l');
            var pin       = getCmdParam('-p');

            if (status == 'success') {
                page.evaluate(function(login, pin) {
                    var fieldsSet = 0;
                    var forms     = document.getElementsByTagName('form');
                    var submitButton = null;

                    for (var i in forms) {
                        var form = forms[i];
                        if (typeof(form) == 'object') {
                            var action = form.getAttribute('action');

                            if (action.indexOf('Login') > 0) {
                                var inputFields = form.getElementsByTagName('input');

                                for (var j in inputFields) {
                                    var inputField = inputFields[j];
                                    if (typeof(inputField) == 'object') {
                                        
                                        var type     = inputField.getAttribute('type');
                                        var disabled = inputField.getAttribute('disabled');

                                        if (type == 'hidden' || disabled != null) {
                                            continue;
                                        }

                                        switch (type) {
                                            case "text":
                                                inputFields[j].setAttribute('value', login);
                                                fieldsSet++;
                                                break;
                                            case "password":
                                                inputFields[j].setAttribute('value', pin);
                                                fieldsSet++;
                                                break;
                                            case "submit":
                                                submitButton = inputFields[j];
                                                fieldsSet++;
                                                break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (fieldsSet == 3 && typeof(submitButton) == 'object') {
                        submitButton.click();
                    }
                }, login, pin);
            }
        });
    },
    
    function () {
        page.evaluate(function() {

            function getFinanceAccountRows() {
                var tables = document.getElementsByTagName('table');

                var filteredRows = [];
                for (var i in tables) {
                    var table     = tables[i];
                    if (typeof(table) == 'object') {
                        var className = table.getAttribute('class');
                        if (className != null && className.indexOf('table_widget_finanzstatus') !== -1) {
                            var rows = table.getElementsByTagName('tr');

                            for (var j in rows) {
                                var row = rows[j];

                                if (typeof(row) == 'object') {
                                    var rowClassName = row.getAttribute('class');
                                    if (rowClassName == 'tablerowodd' ||
                                        rowClassName == 'tableroweven' ||
                                        rowClassName == 'tableheader noborder') {
                                        filteredRows.push(row);
                                    }
                                }
                            }
                        }
                    }
                }

                return filteredRows;
            }

            function getFinanceDataFromRows(rows)
            {
                var records = [];

                if (typeof(rows) == 'object' && rows.length > 0) {
                    for (var i in rows) {
                        var cols = rows[i].getElementsByTagName('td');

                        var obj = {};
                        obj.name = cols[0].innerText;

                        if (cols.length == 4) {
                            obj.account_number = cols[1].innerText;
                            obj.value = cols[2].innerText;
                        } else {
                            obj.value = cols[1].innerText;
                        }

                        for (var fieldName in obj) {
                            obj[fieldName] = obj[fieldName].replace("\n", '');
                        }

                        records.push(obj);
                    }
                }

                return records;
            }

            var rows = getFinanceAccountRows();
            var data = getFinanceDataFromRows(rows);

            var jString = JSON.stringify(data);

            console.log(jString);
        });
    }
];


var controller = setInterval(function() {
    if(loadInProgress) {

        if(showStatus)
            console.log('loading...');

    } else {
        if(typeof scenario[step] == "function") {
            scenario[step]();
            step++;
        } else {
            phantom.exit();
        }
    }
}, 500);
