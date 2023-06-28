.PHONY: up down clean restart build be db

up:  ## Run Docker Compose services
	docker-compose -f docker-compose.yaml up -d

down:  ## Shutdown Docker Compose services
	docker-compose -f docker-compose.yaml down

clean:
	docker-compose -f docker-compose.yaml down; rm -r database/db_data

restart:
	docker-compose -f docker-compose.yaml down;
	rm -r database/db_data;
	docker-compose -f docker-compose.yaml up -d;

build:
	docker build -t letsmeet-backend ./backend

logs:
	docker-compose -f docker-compose.yaml logs

be:
	docker exec -it sdm-backend bash

db:
	docker exec -it sdm-database psql -U dev database

test:
	cd backend && python -m unittest -v
