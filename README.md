
# Panal 🍯

> [!WARNING]  
> This app is on early Alpha and should not be used in production yet.

<p align="center">
<img src="https://github.com/user-attachments/assets/51dc7c03-43a4-4c7c-9257-e7d216ac9b8f" width="33%" />
</p>

## Docker run

````bash
export STACKS=./stacks
export DATABASE=./db
export PORT=4321
docker run -d --name panal -p $PORT:4321 -v $DATABASE:/data/db -v $STACKS:/data/stacks -v /var/run/docker.sock:/var/run/docker.sock ghcr.io/pablopunk/panal:latest
````

## Docker Compose

````yaml
services:
  panal:
    image: ghcr.io/pablopunk/panal:latest
    container_name: panal
    restart: unless-stopped
    ports:
      - "4321:4321"
    volumes:
      - ./db:/data/db
      - ./stacks:/data/stacks
      - /var/run/docker.sock:/var/run/docker.sock
````
