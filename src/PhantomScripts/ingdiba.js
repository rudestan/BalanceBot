// run: phantomjs --ssl-protocol=any ingdiba.js -l <login> -p <pin> -d <diBa key>

var system = require('system');

var loadInProgress = false;
var showStatus = false;
var step = 0;
var entryPointURL = 'https://banking.ing-diba.de/app/login';
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
                    var submitButton = null;
                    var fieldsSet = 0;
                    var allForms = document.getElementsByTagName('form');
                    var form = null;

                    for (var i = 0; i < allForms.length; i++) {

                        var action = allForms[i].getAttribute('action');

                        // skip everything except needed page
                        if (action != 'undefined' && action.indexOf('login') != -1) {
                            var inputFields = allForms[i].getElementsByTagName('input');

                            // search for needed input fields
                            for (var j = 0; j < inputFields.length; j++) {
                                var inputField = inputFields[j];
                                var name = inputField.getAttribute('name');
                                var type = inputField.getAttribute('type');

                                if (type == 'hidden') {
                                    continue;
                                }

                                switch (type) {
                                    case "text":
                                            if (name == "kontonummer:kontonummer") {
                                                inputFields[j].setAttribute('value', login);
                                                fieldsSet++;
                                            }
                                                
                                            break;
                                    case "password":
                                            if (name == "pin:pin") {
                                                inputFields[j].setAttribute('value', pin);
                                                fieldsSet++;
                                            }

                                            break;
                                }
                            }

                            // search for submit button
                            var els = allForms[i].getElementsByTagName('button');
                            if (els.length == 1 && els[0].getAttribute('type') == 'submit') {
                                submitButton = els[0];
                                fieldsSet++;
                            }
                            
                            if (fieldsSet == 3 && typeof(submitButton) == 'object') {
                                submitButton.click();
                            }
                        }                        
                    }
                }, login, pin);
            }       
        });
    },

    function () {
        var diBaKey = getCmdParam('-d');

        var out = page.evaluate(function(diBaKey) {
            var fieldsSet = 0;
            var submitButton = null;

            function getIndex(inputName) {
                var offset = 2;
                var parts  = inputName.split(':');

                return parseInt(parts[parts.length - offset]);
            }

            function getCharByIndex(index, key) {
                return key[index];
            }

            var inputs = document.getElementsByTagName('input');

            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];

                if (typeof(input) != 'object') {
                    continue;
                }

                var type = input.getAttribute('type');

                if (type != 'password') {
                    continue;
                }

                var name = input.getAttribute('name');

                if (name.indexOf('keypadinput') == -1) {
                    continue;
                }

                var keyIndex = getIndex(name);
                var keyChar  = diBaKey[keyIndex];

                var keyLinks = document.getElementsByClassName('diba-keypad__keyboard-key');
                
                for (var k = 0; k < keyLinks.length; k++) {
                    var keyLinkText = keyLinks[k].innerHTML;
                    
                    if (keyLinkText == keyChar) {
                        keyLinks[k].click();
                        fieldsSet++;
                    }
                }                
            }

            // search for submit button
            var els = document.getElementsByTagName('button');
            
            for (var j = 0; j < els.length; j++) {
                var el = els[j];

                if (typeof(el) != 'object') {
                    continue;
                }

                var elName = el.getAttribute('name');
                var elType = el.getAttribute('type');

                if (elType == 'submit' && elName.indexOf('weiter_finish') != -1 && fieldsSet == 2) {
                    els[j].click();
                }

            }
        }, diBaKey);
    },
    function() {
        var data = page.evaluate(function() {
            var data = [];
            var accountRows = document.getElementsByClassName('account-row');

            // balance per account
            for (var i = 0; i < accountRows.length; i++) {
                var accountRow = accountRows[i];

                var tmp = accountRow.getElementsByClassName('account-row__type');
                var name = tmp[0].innerHTML;

                var tmp = accountRow.getElementsByClassName('account-row__saldo');
                var value = tmp[0].innerHTML;

                var record = {
                    'name': name,
                    'value': value
                };

                data.push(record);
            }

            // total balance

            var totalBalanceParentRows = document.getElementsByClassName('account-row--balance');
            var totalBalanceSpanRows   = totalBalanceParentRows[0].getElementsByTagName('span');
            var totalBalanceValueRows = totalBalanceParentRows[0].getElementsByTagName('strong');

            var name  = totalBalanceSpanRows[totalBalanceSpanRows.length - 1].innerHTML;
            var value = totalBalanceValueRows[totalBalanceValueRows.length - 1].innerHTML;

            var record = {
                'name': name,
                'value': value
            };

            data.push(record);
            return data;
        });

        var jString = JSON.stringify(data);

        console.log(jString);
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
