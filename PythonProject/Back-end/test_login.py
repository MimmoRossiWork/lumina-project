import requests

url='https://lumina-project-b1a9.onrender.com'
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

