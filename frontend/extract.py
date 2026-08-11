import urllib.request
import re
import json

url = 'https://skiper-ui.com/v1/skiper49'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')

matches = re.findall(r'\"code\":\"(.*?)\"', html)
if matches:
    print('Found code block!')
    code = matches[0].replace('\\n', '\n').replace('\\\"', '\"').replace('\\\\', '\\')
    with open('skiper49_code.txt', 'w', encoding='utf-8') as f:
        f.write(code)
else:
    print('Could not find code directly via regex. Need deeper parsing.')
