# DataMap Webapp

Web application for DataMap a SaaS Data Platform for atmospheric big data and data science research group in Brazil.

## Development

### Local

Use <https://asdf-vm.com/> to install nodejs version available in [.tool-versions](.tool-versions).
After install nodejs version, run the npm commands:

```sh
npm install
```

Run the app locally, in development mode, using:`

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

### Icons

We are using https://fonts.google.com/icons for icons through https://www.npmjs.com/package/react-material-symbols.

See examples at https://github.com/ed-software/react-material-symbols?tab=readme-ov-file#readme and try your icons on [this Storybook](https://react-material-symbols.vercel.app/?path=/docs/outlined--docs).

The customization applied into the icons are:

* style: outlined
* Fill: false
* Weight: 200
* Grade: -25
* Optical: depends on the place, but usually 32px

### Unit tests

Use [JEST](https://jestjs.io) for unit tests.

Scripts:

```
# Testing once
npm run test

# Testing with watch option on
npm run testing
``` 

To run tests and open the code coverage report on Google Chrome browser, execute:
 
```
npm run test:coverage
```

But for open last coverage report only, withot run the test, perform:
```
npm run test:coverage:report
```

The jest plugin for vscode could help you to run locally and see the coverage, see more https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest

### E2E Tests

We have a project for this, check: https://github.com/ardc-brazil/datamap-e2e


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

### Deploying

> **WARNING:** The current deployment process causes downtime for services.

```sh
# Connect to USP infra
ssh datamap@143.107.102.162 -p 5010

# Navigate to the project folder
cd datamap-webapp

# Get the last (main) branch version
git pull

# Rebuild the image and deploy the new version
ENV_FILE_PATH=../environment/frontend.prod.env make docker-deployment
```

## Architecture

### RPC

Remote procedure call (RPC) is the way that front-end application communicates with the Backend application.
We perform RPC for two reasons: data changing and data fetching.

#### Data changing

![](./docs/frontnend-rpc/frontendRPC.png)

#### Data fetching
We are using [SWR](https://swr.vercel.app/) directly on page instead of using a BFF Gateway implementation for feching data from Backend for Frontend (BFF). SWR has many benefits when fetching data from BFF, some pros are: realtime, paginantion, retry, caching, auto cache invalidation.

The following diagram demonstrate how to perform a data fetching.

![](./docs/frontnend-rpc-datafetch/frontendRPC-DataFetching.png)

