SHELL := /bin/bash

APK_DIR := android/app/build/outputs/apk/release
AAB_DIR := android/app/build/outputs/bundle/release

# get latest tag, default to v0.0.0
LAST_TAG := $(shell git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
# strip leading v
LAST_VER := $(LAST_TAG:v%=%)

# parse semver components
MAJOR := $(word 1,$(subst ., ,$(LAST_VER)))
MINOR := $(word 2,$(subst ., ,$(LAST_VER)))
PATCH := $(word 3,$(subst ., ,$(LAST_VER)))

# scan commits since last tag for bump level
# feat = minor, fix = patch, BREAKING CHANGE or !: = major
COMMITS := $(shell git log $(LAST_TAG)..HEAD --pretty=format:"%s" 2>/dev/null)
BUMP := $(shell \
	git log $(LAST_TAG)..HEAD --pretty=format:"%s%n%b" 2>/dev/null | \
	if grep -qE "^[a-z]+(\(.+\))?!:|BREAKING CHANGE"; then \
		echo major; \
	elif grep -qE "^feat"; then \
		echo minor; \
	else \
		echo patch; \
	fi \
)

ifeq ($(BUMP),major)
NEXT_VER := $(shell echo $$(($(MAJOR)+1))).0.0
else ifeq ($(BUMP),minor)
NEXT_VER := $(MAJOR).$(shell echo $$(($(MINOR)+1))).0
else
NEXT_VER := $(MAJOR).$(MINOR).$(shell echo $$(($(PATCH)+1)))
endif

NEXT_TAG := v$(NEXT_VER)

.PHONY: build release tag upload changelog info

info:
	@echo "last tag:  $(LAST_TAG)"
	@echo "bump:      $(BUMP)"
	@echo "next tag:  $(NEXT_TAG)"

build:
	cd android && ./gradlew assembleRelease bundleRelease

changelog:
	$(eval CHANGELOG := $(shell \
		echo "$(NEXT_TAG)"; \
		echo ""; \
		git log $(LAST_TAG)..HEAD --pretty=format:"- %s" 2>/dev/null \
	))

tag: changelog
	git tag -a $(NEXT_TAG) -m "$$(printf '%s\n\n%s' '$(NEXT_TAG)' "$$(git log $(LAST_TAG)..HEAD --pretty=format:'- %s')")"
	git push origin main --tags

upload: build tag
	@for apk in $(APK_DIR)/app-*-release.apk; do \
		base=$$(basename "$$apk" .apk); \
		dest="$(APK_DIR)/$${base}-$(NEXT_TAG).apk"; \
		mv "$$apk" "$$dest"; \
		hut git artifact upload -r rush-hour --rev $(NEXT_TAG) "$$dest"; \
	done
	mv $(AAB_DIR)/app-release.aab $(AAB_DIR)/app-release-$(NEXT_TAG).aab
	hut git artifact upload -r rush-hour --rev $(NEXT_TAG) $(AAB_DIR)/app-release-$(NEXT_TAG).aab

release: upload
	@echo "released $(NEXT_TAG)"
