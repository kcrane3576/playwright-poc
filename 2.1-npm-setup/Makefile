IMAGE_NAME := playwright-npm-setup-2.1
TAG := 1.54

# These targets are actions, not files
.PHONY: build run flush fresh

build:
	docker build -t $(IMAGE_NAME):$(TAG) .

run:
	docker run --rm --shm-size=1g -e TMPDIR=/dev/shm $(IMAGE_NAME):$(TAG)

# Strong cleanup – all unused images/containers/networks
flush:
	docker system prune -a -f

# “Start over from a clean Docker world”
fresh: flush build run