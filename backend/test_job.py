import urllib.request, urllib.parse, json, time
data = urllib.parse.urlencode({'repository_url': 'https://github.com/octocat/Hello-World'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8001/repositories/upload', data=data, method='POST')
res = urllib.request.urlopen(req)
job_id = json.loads(res.read())['job_id']
print('Job:', job_id)
status = ''
while status not in ['Completed', 'Failed']:
    time.sleep(2)
    req_stat = urllib.request.Request(f'http://127.0.0.1:8001/repositories/jobs/{job_id}')
    res_stat = urllib.request.urlopen(req_stat)
    status = json.loads(res_stat.read())['status']
    print('Status:', status)
