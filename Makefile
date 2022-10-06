VERSION=$(shell sed -n '/"version"/ s/.*: "\(.*\)",/\1/p' manifest.json)
ADDON=changequote-$(VERSION)-tb.xpi

xpi: $(ADDON)

%.xpi:
	zip -r $@ api background.js chrome.manifest chrome content defaults icon LICENSE manifest.json

clean:
	rm -f -- $(ADDON)

.PHONY: clean
