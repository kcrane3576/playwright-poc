IMAGE_NAME := slim-playwright
TAG := 1.54

# These targets are actions, not files
.PHONY: build run up

build:
	docker build -t $(IMAGE_NAME):$(TAG) .

run:
	docker run --rm --shm-size=1g -e TMPDIR=/dev/shm $(IMAGE_NAME):$(TAG)

up: build run