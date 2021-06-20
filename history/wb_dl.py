import urllib.request
import os.path
import json


def gather_json(website):
    response = urllib.request.urlopen('https://web.archive.org/web/timemap/?url='+website +
                                      '/&fl=timestamp,original&matchType=prefix&filter=statuscode:200&output=json')

    print(website, 'Status:', response.status)
    data = json.load(response)
    if not os.path.exists(os.getcwd()+'\\json\\'):
        os.makedirs(os.getcwd()+'\\json\\')
    with open('json\\'+website+'_200.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def determine_path_filename_from(url: str) -> tuple:
    if 'https://' in url:
        url = url[8:]
    elif 'http://' in url:
        url = url[7:]
    dir = url.split('/')[1:]
    dst_dir_names = []
    filename = ''
    for part in dir:
        if '.' in part:
            filename = urllib.parse.quote(part)
        else:
            dst_dir_names.append(urllib.parse.quote(part))
    dst_dir = '\\'.join(dst_dir_names)

    return (dst_dir, filename)


def save_errors(err):
    with open("err.json", "a") as f:
        json.dump(err, f)


def download(timestamp, url, dir, filename):
    if not os.path.exists(os.getcwd()+'\\web\\'+dir+'\\'):
        os.makedirs(os.getcwd()+'\\web\\'+dir+'\\')
    if os.path.exists(os.getcwd()+'\\web\\'+dir+'\\'+filename):
        filename = filename.split('.')[0]+'_' + \
            timestamp+'.'+filename.split('.')[1]
    errors = []

    try:
        response = urllib.request.urlopen(
            'http://web.archive.org/web/'+timestamp+'id_/'+url)
    except urllib.error.HTTPError as e:
        print('STATUS: HTTPError:\ncode: {}'.format(e.code), '\nreaseon: {}'.format(
            e.reason), '\nheaders:{}'.format(e.headers))
        errors.append({'timestamp': timestamp, 'url': url, 'error': 'STATUS: HTTPError: code: {}'.format(
            e.code)+' reaseon: {}'.format(e.reason)+' headers:{}'.format(e.headers)})
        save_errors(errors)
    except urllib.error.URLError as e:
        print('STATUS: URLError: {}'.format(e.reason))
        errors.append({'timestamp': timestamp, 'url': url,
                       'error': 'STATUS: URLError: reason: {}'.format(e.reason)})
        save_errors(errors)
    else:
        print('STATUS: OK')
        with open('web\\'+dir+'\\'+filename, 'wb') as f:
            f.write(response.read())


def main(website, json_path):
    with open(json_path) as json_file:
        data = json.load(json_file)
        current = 0
        max = len(data) - 1
        for item in data:
            if(item[0] == 'timestamp' or item[1] == 'original'):
                continue
            else:
                current += 1
                print(item[0])
                print(item[1])
                dir, filename = determine_path_filename_from(
                    urllib.parse.quote(item[1]))
                if '.' not in filename:
                    filename = filename+'index.html'
                if len(filename) > 128:
                    filename = filename[:64]
                print('Pobieranie '+str(current)+' z '+str(max)+':', item[1])
                download(item[0], urllib.parse.quote(
                    item[1]), website+'\\'+dir, filename)


if __name__ == '__main__':
    urls = ['']
 
    for website in urls:
        gather_json(website)
        main(website, 'json\\'+website+'_200.json')
