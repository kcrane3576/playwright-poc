# playwright-poc

# build -> run
docker build -t slim-playwright:1.54 .
docker run --rm --shm-size=1g -e TMPDIR=/dev/shm slim-playwright:1.54