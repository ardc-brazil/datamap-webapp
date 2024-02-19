# DataMap Webapp

Web application for DataMap a SaaS Data Platform for atmospheric big data and data science research group in Brazil.

## Development

### Local

Use <https://asdf-vm.com/> to install nodejs version available in [.tool-versions](.tool-versions).
After install nodejs version, run the npm commands:

```sh
npm install
```

Run the app locally, in development mode, using:

```sh
npm run dev
```

The webapp will be available at <http://localhost:3000/>.

### Docker

With docker, just run:

```sh
docker build -t datamap-webapp .
docker run -p 3000:3000 datamap-webapp
```

The output should be `Listening on port 3000`, then the webapp is available locally at <http://localhost:3000/>.

### Visual Studio Code

Use extensions to be productive: https://www.geeksforgeeks.org/top-10-extensions-for-reactjs-in-vscode/

Also install: 

- https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
- https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag
- https://marketplace.visualstudio.com/items?itemName=vitaliymaz.vscode-svg-previewer
- https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets

### TailwindCSS

Some defaults and components could be visualized in <http://localhost:3000/design-system/>.
See some components ideas in: <https://flowbite.com/>


### Unit tests

Use [JEST](https://jestjs.io) for unit tests.

Scripts:

```
# Testing once
npm run test

# Testing with watch option on
npm run testing
``` 

To open the code coverage report on Google Chrome browser, execute:

````
npm run test:coverage
``

But for open last coverage report, run:
```
npm run test:coverage:report
```

The jest plugin for vscode could help you to run locally and see the coverage, see more https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest

### e2e tests

Use Cypress for end-to-end tests.

```
# Open cypress screen
npm run cypress
```

### Env Vars

You have to create a `.env.local` file in the project root.

Copy the file [.env.local.template](./.env.local.template) and replace with valid values. 

Some valid values are at the [production environment](https://vercel.com/ardc-brazil/datamap-webapp/settings/environment-variables) from Vercel.

### Formik

We are using Formik to handle all forms in the aplication.
See more <https://formik.org/>

### Constants

We are organizing the constants of the project in a `{Category}Contants.ts` file and well documented, following this idea:
https://dev.to/amirfakour/tips-to-use-constants-file-in-typescript-27je