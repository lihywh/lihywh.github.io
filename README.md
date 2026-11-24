# lihywh.github.io

## App download pages

List publicly downloadable apps in `download/apps.json`. Each listed path needs an `index.html` with a primary install action and an `icon.png`. The catalogue displays every other listed app, with apps in the same group first.

After adding or removing an app, run `python3 scripts/update-app-catalog.py` and commit the regenerated pages. `python3 scripts/update-app-catalog.py --check` verifies that the committed sections match the catalogue.
