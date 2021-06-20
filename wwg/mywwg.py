import json
import urllib.request as urllib2
# from bs4 import BeautifulSoup
import re
from lxml import html

game_start = 1  # start of games you want to get
game_end = 3433  # last game you want to get

records = []

for game in range(game_start, game_end+1):
# for game in range(3366,3433+1):
    try:
        gameno = str(game)
        data = urllib2.urlopen("https://www.braingle.com/games/werewolf/game.php?id="+gameno).read()
        # soup = BeautifulSoup("https://www.braingle.com/games/werewolf/game.php?id="+gameno, 'html.parser')
        # data = urllib2.urlopen("https://www.braingle.com/games/werewolf/game.php?id="+gameno)
        tree = html.fromstring(data)
        print(tree)
        print('GAME: ' + gameno)
        players = tree.xpath('//div[@class="boxed"]//table//tr//td//a/text()')
        print(players)
        print(len(players))
        # if (len(players) < 1):
        #     print("INVALID GAME")
        #     continue
        roles = tree.xpath(
            '//div[@class="boxed"]//table//tr//td[1]//img[1]/@alt')
        print(roles)
        rounds = tree.xpath('//div[@class="box_footer space_top"]/text()')
        gamerds = re.sub("\D", "", rounds[0])
        print(gamerds)
        print(rounds)
        gameresult = tree.xpath(
            '//div[@class="box_footer space_top"]//b/text()')[0]
        print(gameresult)
        test=7
        finished=None
        survived = []
        roundsurvived = []
        for player in range(1,len(roles)+1):
            print(player)
            print(roles[player-1])
            finished=False
            print(finished)
            for count in range(1,int(gamerds)+1):
                print(count)
                if(not finished):
                    # a=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+1}]//a//img')
                    # a=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+1}]//a//img[@src="images/accept.png" or @src="images/bullet.gif" or @src="images/blood.gif"]')
                    a=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+1}]//a//img//@src')
                    print(a)
                    if(count != gamerds):
                        # b=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+2}]//a//img')
                        # b=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+2}]//a//img[@src="images/accept.png" or @src="images/bullet.gif" or @src="images/blood.gif"]')
                        b=tree.xpath(f'//div[@class="boxed"]//table//tr[{player+1}]//td[{count+2}]//a//img//@src')
                        print(b)
                        if (b==[]):
                            finished=True
                            survived.append(a[0])
                            roundsurvived.append(count+1)
                        elif (b[0]!='images/accept.png'):
                            finished=True
                            survived.append(b[0])
                            roundsurvived.append(count+2)
                    else:
                        survived.append(a[0])
                        roundsurvived.append(count+1)
                        finished=True
                    # print(a.get_attribute('src'))
        print(type(survived))
        print(survived)
        # strip non-numeric characters so only round # remains

        fate = []
        count=1
        for res in survived:
            print(count)
            # use images to determine fate
            if (res=='images/accept.png'):
                fate.append("Survived")
            elif (res=='images/blood.gif'):
                fate.append("Eaten")
            else:
                fate.append("Shot")
            count+=1

        gameresult = gameresult.split(" ")[1]
        for i in range(len(players)):  # prepare for JSON export
            role = roles[i]
            roleList = {
                "h": "Human",
                "w": "Werewolf",
                "s": "Seer",
            }

            record = {
                "Game #": gameno,
                "Game Rounds": gamerds,
                "Winner": gameresult,
                "Player": players[i],
                "Role": roleList.get(role),
                "Survived Rounds\n": roundsurvived[i],
                "Fate": fate[i]
            }
            records.append(record)
    except:
        print('INVALID GAME')
        print('1')
        continue
    print(game)

# print(json.dumps(records)) # export to JSON
with open('data.json', 'w') as f:
    json.dump(records, f)
