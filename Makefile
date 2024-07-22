VERSION=$(shell sed -n '/"version"/ s/.*: "\(.*\)",/\1/p' manifest.json)
ADDON=changequote-$(VERSION)-tb.xpi

xpi: $(ADDON)

SRC :=
SRC += $(shell find _locales -type f)
SRC += $(shell find api -type f)
SRC += $(shell find chrome -type f)
SRC += $(shell find icon -type f)
SRC += $(shell find options -type f)
SRC += background.js
SRC += compose.js
SRC += LICENSE
SRC += manifest.json

%.xpi: $(SRC)
	zip -r $@ $^

clean:
	rm -f -- $(ADDON)

.PHONY: clean xpi
