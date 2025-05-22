# Panal

## Docker run

````bash
export STACKS=./stacks
export DATABASE=./db
export PORT=4321
docker run -d --name panal -p $PORT:4321 -v $DATABASE:/data/db -v $STACKS:/data/stacks -v /var/run/docker.sock:/var/run/docker.sock pablopunk/panal:latest
````

## Docker Compose

````yaml
services:
  panal:
    image: pablopunk/panal:latest
    container_name: panal
    restart: unless-stopped
    ports:
      - "4321:4321"
    volumes:
      - ./db:/data/db
      - ./stacks:/data/stacks
      - /var/run/docker.sock:/var/run/docker.sock
````
