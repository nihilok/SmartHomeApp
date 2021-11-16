# Nginx Site Config
```
server {
    listen 80;
    server_name smarthome.example.app;
    location / {
        root /home/$USER/apps/smarthome/build;
        index index.html;
        try_files $uri /index.html$is_args$args =404;
    }	

}

server {
    listen 80;
    server_name heating.example.app;
    location / {
        root /home/$USER/apps/heating/build;
        index index.html;
        try_files $uri /index.html$is_args$args =404;
    }	

}

server {
    listen 80;
    server_name api.smarthome.example.app;
    location / {
        proxy_pass http://localhost:8000;
        include /etc/nginx/proxy_params;
        proxy_redirect off;
    }
}
```