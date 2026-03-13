import json
from urllib import request, error

url = 'http://127.0.0.1:8000/api/v1/auth/login'
tests = [
    ('autotest+py@example.com','strongpass123'),
    ('autotest+py@example.com','wrongpass'),
    ('noone@example.com','whatever')
]
for email,password in tests:
    payload = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            print('TEST', email, password, '->', resp.status, body)
    except error.HTTPError as e:
        try:
            print('TEST', email, password, '->', e.code, e.read().decode())
        except Exception:
            print('TEST', email, password, '->', e.code, str(e))
    except Exception as e:
        print('TEST', email, password, '-> ERROR', str(e))

