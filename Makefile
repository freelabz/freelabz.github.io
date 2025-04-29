build_dev:
	npx tailwindcss -i ./src/input.css -o ./dist/style.css --watch

build_prod:
	npx tailwindcss -i ./src/input.css -o ./dist/style.css --minify
