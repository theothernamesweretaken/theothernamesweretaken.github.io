// ==UserScript==
// @name         ESPN Active Starter
// @namespace    http://tampermonkey.net/
// @version      0.50
// @description  set active players on ESPN
// @author       You
// @match        http://*fantasy.espn.com/*
// @match        https://*fantasy.espn.com/*
// @grant        none
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// ==/UserScript==

var openslots = [];
var times = 0; // INPUT
var count = 0;

(function () {
    function pageLoad() {
        return setTimeout(function () {
            $('th[title="STARTERS"]').html('<button class="Button Button--alt Button--custom autob" id="startD">Start Day</button>'
                + '<button class="Button Button--alt Button--custom autob" id="startW">Start Week</button>');
            $('#startW').click(function () {
                count = 0;
                times = 8;
                $("tr").removeClass("cantmove");
                $('.autob').hide();
                setTimeout(function () { return setLineup(); }, 2000);
            });
            $('#startD').click(function () {
                count = 0;
                times = 0;
                $("tr").removeClass("cantmove");
                $('.autob').hide();
                setTimeout(function () { return setLineup(); }, 2000);
            });

            $('.Week__wrapper > div').click(function () {
                if ($('.move-action-btn').length > 0) {
                    $('.autob').show();
                } else {
                    $('.autob').hide();
                }
            });
            if ($('.move-action-btn').length > 0) {
                $('.autob').show();
            } else {
                $('.autob').hide();
            }
        }, 2000);
    };

    //  $(window).on('click', function (e) {
    //   pageLoad();
    //  });

    pageLoad();

    function setLineup() {
        $('.custom--day').unbind();
        $('.custom--day').click(function () {
            if (count < times) {
                setTimeout(function () { return setLineup(); }, 2000);
            }
        });
        openslots = [];
        var table = $('div.flex > table.Table');
        var trs = $(table).find('tbody > tr');
        var players = [];
        var inactivePlayers = [];
        var slots = [];
        $(trs).each(function (row, elem) {
            var isActive = ($(elem).find('a.pro-team-link').length > 0)
            var player_div = $(elem).find('.player__column')
            var player_name = $(player_div).attr('title');

            var btnId = $(elem).find('button').parent('div');
            var pos = $(elem).find('div')[0].innerHTML;
            var slot = {
                position: pos,
                index: row,
            }
            if (player_name && player_name.indexOf(' ') > 0) {
                //valid player
                var player_elig = $(player_div).find('span.playerinfo__playerpos')[0].innerHTML;
                var player = {
                    'num': row,
                    'name': player_name,
                    'move_btn_div': btnId,
                    'pos': pos,
                    'elig': player_elig.split(","),
                    'own': parseFloat($('.own').not('.header').eq(row).html()),
                    'active': isActive,
                };
                if (isActive) {
                    players.push(player);
                } else {
                    inactivePlayers.push(player);
                    if (pos !== 'Bench' && pos !== 'IR') {
                        openslots.push(slot);
                    }
                }
            } else {
                if (pos !== 'Bench' && pos !== 'IR') {
                    openslots.push(slot);
                }
            }
            slots.push(pos);
        });

        // sort by own pct
        players.sort(function (a, b) { return b.own - a.own });

        // move all actives WHO ARE UTIL to OPEN slots
        var utilActive = players.filter(elem => (elem.pos && elem.pos === 'UTIL' && !$($(table).find('tbody > tr')[elem.num]).hasClass('cantmove')));
        console.log(utilActive);
        if (utilActive.length > 0) {
            $(utilActive).each(function (x, elem) {
                var index = posInOpen(elem.elig, false);
                var myrow = $(trs)[index];
                if (index > -1) {
                    var btn = $(elem.move_btn_div).find('button');
                    $(btn).click();
                    $(myrow).find('button').click();
                    setTimeout(function () { setLineup(); }, 2000);
                    return false;
                } else {
                    // increment next -- cannot do this one
                    myrow = $(trs)[elem.num];
                    $(myrow).addClass('cantmove');
                    setTimeout(function () { setLineup(); }, 2000);
                    return false;
                }
            });
        } else {
            // move all actives BENCH to open slots
            var benchedActive = players.filter(elem => (elem.pos && elem.pos === 'Bench'));
            if (benchedActive.length < 1 && count + 1 < times) {
                count++;
                $('.custom--day').eq($('.is-current').index('.custom--day') + 1).click();
                return false;
            } else if (count + 1 >= times) {
                $(".autob").show();
            }
            $(benchedActive).each(function (x, elem) {
                var index = posInOpen(elem.elig, true);
                if (index > -1) {
                    var btn = $(elem.move_btn_div).find('button');
                    $(btn).click();
                    var myrow = $(trs)[index];
                    $(myrow).find('button').click();
                    setTimeout(function () { setLineup(); }, 2000);
                    return false;
                } else {
                    if (benchedActive && (x + 1) === benchedActive.length && count + 1 < times) {
                        count++;
                        $('.custom--day').eq($('.is-current').index('.custom--day') + 1).click();
                        return false;
                    } else if (count + 1 >= times) {
                        $(".autob").show();
                    }
                }
            });
        }
    }
})();

function moveToBench(elem) {
    var btn = $(elem.move_btn_div).find('button');
    $(btn).click();
    $('.roster-action-col').find('button').last().click();
}

function posInOpen(posArray, doUtil) {
    for (let [index, slot] of openslots.entries()) {
        if (slot) {
            for (var pos of posArray) {
                if (pos.indexOf(slot.position) > -1) { // slot is valid
                    delete openslots[index];
                    return slot.index;
                }
            }
        }
    }
    if (doUtil) {
        for (let [index, slot] of openslots.entries()) {
            if (slot && slot.position === "UTIL") {
                delete openslots[index];
                return slot.index;
            }
        }
    }
    return -1;
};