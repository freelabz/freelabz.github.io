build_dev:
		  npx tailwindcss -i ./src/input.css -o ./assets/style.css --watch
build_prod:
			npx tailwindcss -i ./src/input.css -o ./assets/style.css --minify
