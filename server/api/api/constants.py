TESTING = True      # Uses benign heating system when True
# API will fail if no heating system in place when False

origins = [
    'https://localhost:4000',
    'https://app.example.com'
    'http://localhost:3000'
]

origins = origins + ['*'] if TESTING else origins
SECRET_KEY = "SomeTHiNGsupERsEcReT!!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240
GUEST_IDS = [3]
