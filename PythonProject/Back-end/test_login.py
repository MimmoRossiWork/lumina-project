import requests

url='http://127.0.0.1:8000/api/v1/auth/login'
tests=[
    ('autotest+py@example.com','strongpass123'),
    ('autotest+py@example.com','wrongpass'),
    ('noone@example.com','whatever')
]
for email,password in tests:
    r = requests.post(url,json={'email':email,'password':password})
    try:
        body = r.json()
    except Exception:
        body = r.text
    print('TEST', email, password, '->', r.status_code, body)

