build_dev:
	npx tailwindcss -i ./src/input.css -o ./dist/style.css --watch

build_prod:
	npx tailwindcss -i ./src/input.css -o ./dist/style.css --minify
	node scripts/build-i18n.js

# Regenerate the English page (en/index.html) from index.html
build_i18n:
	node scripts/build-i18n.js
