IMAGE_NAME := playwright-npm-setup-2.2
TAG := 1.54

# These targets are actions, not files
.PHONY: build run flush fresh fscan

build:
	docker build -t $(IMAGE_NAME):$(TAG) .

run:
	docker run --rm --shm-size=1g -e TMPDIR=/dev/shm $(IMAGE_NAME):$(TAG)

# Strong cleanup – all unused images/containers/networks
flush:
	docker system prune -a -f

# “Start over from a clean Docker world”
fresh: flush build run

fscan: flush build
	@echo "========================================"
	@echo " Image Information"
	@echo "========================================"
	@docker image ls $(IMAGE_NAME):$(TAG) --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}"

	@echo ""
	@echo "========================================"
	@echo " CVE Severity Summary"
	@echo "========================================"
	@docker scout cves --format sarif $(IMAGE_NAME):$(TAG) 2>/dev/null \
	  | jq -r ".runs[0].tool.driver.rules \
	    | group_by(.properties.cvssV3_severity) \
	    | map({sev: .[0].properties.cvssV3_severity, count: length}) \
	    | sort_by( \
	        if .sev==\"CRITICAL\" then 0 \
	        elif .sev==\"HIGH\" then 1 \
	        elif .sev==\"MEDIUM\" then 2 \
	        elif .sev==\"LOW\" then 3 \
	        else 4 end \
	      ) \
	    | \"| Severity | Count |\", \
	      \"|----------|-------|\", \
	      (.[] | \"| \" + .sev + \" | \" + (.count|tostring) + \" |\")" || true