import json
from urllib import request

url = 'http://127.0.0.1:8000/api/v1/auth/register'
payload = {
    'name': 'AutoTest',
    'surname': 'Script',
    'email': 'AutoTest.UPPER@example.com',
    'password': 'strongpass123'
}

data = json.dumps(payload).encode('utf-8')
req = request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with request.urlopen(req) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode('utf-8'))
except Exception as e:
    # print HTTP error body if available
    if hasattr(e, 'read'):
        try:
            print('ERROR', e.read().decode())
        except Exception:
            print('ERROR', str(e))
    else:
        print('ERROR', str(e))
