// ==UserScript==
// @name     Voting List Automate
// @version  2.2.2
// @grant    none
// @include        http://www.braingle.com/games/werewolf/game.php?id=*
// @include        https://www.braingle.com/games/werewolf/game.php?id=*
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

// Custom user settings
const colors = ["red", "blue", "green", "orange", "purple", "brown", "yellow", "lime", "aqua", "lilac", "navy"]
const doInitColors = true;

// utility functions
const $ = window.jQuery;
const count = names => names.reduce((a, b) => ({
    ...a,
    [b]: (a[b] || 0) + 1
}), {}) // don't forget to initialize the accumulator

function fallbackCopyTextToClipboard(text, cb) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed"; //avoid scrolling to bottom
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        let successful = document.execCommand('copy');
        let msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
        cb(successful);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        cb(false);
    }
    document.body.removeChild(textArea);
}

function copyTextToClipboard(text, cb) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text, cb);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
        cb(true);
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
        cb(false);
    });
}
// end utility functions

// on ready, just add color to html
$(function () {
    const isActive = $('input[name="vote"]').length > 0;
    // add button
    if (isActive) { // check if active round
        if (doInitColors) {
            doVLCopy();
        };
        $('#main').find('.boxed_body > h2').eq(0).after('<p> <input id="doVLCopy" type="submit" value="Copy Voting List" class="button_primary t3"> <span id="result"></span></p>');
    };
    $("#doVLCopy").click(function () {
        let vlList = doVLCopy();
        copyTextToClipboard(vlList, function (succ) {
            if (succ) {
                $("#result").html("Successfully copied!")
                $("#result").css('color', 'green');
            } else {
                $("#result").html("You must copy manually")
                $("#result").css('color', 'red');
                $("#result").append('<br/><textarea  onClick="this.select();" rows="4" cols="50">' + vlList + '</textarea>');
            };
        });
    });
});



function doVLCopy() {
    let div_html = $('#main').find('.boxed_body').eq(0).html();
    const isHTML = div_html.indexOf('span') > 0;
    let splits = div_html.split("<br><br>")[1].split('<br>');
    let votes = [];
    let votes_for = [];
    for (let s in splits) {
        if (splits[s].length > 0) {
            let txtSplit = $(splits[s]).text();
            if (txtSplit.length > 0) {
                splits[s] = txtSplit;
            };
            votes.push(splits[s]);
            let voted_for = splits[s].split(" ")[3];
            votes_for.push(voted_for);
        }
    }
    let count_votes = count(votes_for);
    let players = [];
    for (const [key, value] of Object.entries(count_votes)) {
        if (value > 1) {
            let player = { 'name': key, 'num': value };
            players.push(player);
        }
    };
    // sort Players desc by num votes
    players.sort(function (a, b) {
        return parseInt(b.num) - parseInt(a.num);
    });
    let countstr = "";
    let countHtml = "";
    for (let p in players) {
        let player = players[p];
        countstr += "[color=" + colors[p] + "]" + player.name + " : " + player.num + "[/color] \n";
        if (!isHTML) {
            countHtml += '<span style="color:' + colors[p] + '">' + player.name + ' : ' + player.num + "</span> <br/>";
        };
    };
    countstr = (countstr.length > 0) ? "\n \n <b>Totals</b> \n" + countstr : "";
    countHtml = (countHtml.length > 0) ? "<br/><strong>Totals</strong> <br/>" + countHtml : "";
    let htmlvotes = votes;
    for (let v in votes) {
        let vote = votes[v];
        let voted_for = vote.split(" ")[3];
        for (let p in players) {
            if (voted_for === players[p].name) { // add color
                votes[v] = "[color=" + colors[p] + "]" + vote + "[/color]";
                if (!isHTML) {
                    htmlvotes[v] = '<span style="color:' + colors[p] + '">' + vote + '</span>';
                }
            }
        }
    }
    if (!isHTML) {
        let votediv = $('#main').find('.boxed_body').eq(0).html();
        let divparts = votediv.split('<br><br>');
        divparts[1] = '<br/>' + htmlvotes.join('<br/>') + '<br/>' + countHtml;
        $('#main').find('.boxed_body').eq(0).html(divparts.join('<br/>'));
    };
    return votes.join('\n') + countstr;
};