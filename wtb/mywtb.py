import json
import urllib2
import re
from lxml import html

game_start = 3285  # start of games you want to get
game_end = 3304  # last game you want to get

records = []

for game in range(game_start, game_end+1):
    try:
        gameno = str(game)
        data = urllib2.urlopen(
            "https://www.braingle.com/games/wtb/game.php?id="+gameno).read()
        tree = html.fromstring(data)
        print('GAME: ' + gameno)
        players = tree.xpath('//div[@class="boxed"]//table//tr//td//a/text()')
        # print(players)
        if len(players) < 1:
            print("INVALID GAME")
            continue
        roles = tree.xpath(
            '//div[@class="boxed"]//table//tr//td[1]//img[1]/@alt')
        # print(roles)
        rounds = tree.xpath('//div[@class="box_footer space_top"]/text()')
        # print(rounds)
        survived = tree.xpath(
            '//div[@class="boxed"]//table//tr//td[a[img]][last()]')
        # strip non-numeric characters so only round # remains
        gamerds = re.sub("\D", "", rounds[0])

        # print(survived)
        roundsurvived = []
        fate = []
        for res in survived:
            s = html.tostring(res)
            # use images to determine fate
            if "win.png" in s:
                fate.append("Winner")
            elif "cancel.png" in s:
                fate.append("Fired")
            else:
                fate.append("Survived")
            result = re.search(';round=(.*)#end', s)  # find round survived no.
            roundsurvived.append(result.group(1))  # add to array

        #gameresult = gameresult.split(" ")[1]
        for i in range(len(players)):  # prepare for JSON export
            role = roles[i]
            roleList = {
                "player": "Employee",
                "boss": "Boss",
                "rat": "Rat",
            }

            record = {
                "Game #": gameno,
                "Game Rounds": gamerds,
                "Player": players[i],
                "Role": roleList.get(role),
                "Survived Rounds\n": roundsurvived[i],
                "Fate": fate[i]
            }
            records.append(record)
    except Exception as e:
        print(e)
        print('INVALID GAME (Error)')
        continue

# print(json.dumps(records)) # export to JSON
with open('data-wtb.json', 'w') as f:
    json.dump(records, f)
