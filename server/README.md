

There are various things to change if you want to use this server:

    Open Weather Map url in server.api.utils.concurrent_calls:urls
    Local temperature api url in server.api.utils.concurrent_calls:urls
    Create superuser manually (currently user with id: 1) (in SQLite db: server/api/db/db.sqlite3)
    Edit secret key in server.api.authentication:SECRET_KEY
    Install requirements

