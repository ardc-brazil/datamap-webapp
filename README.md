# PoliData Webapp

Web application for PoliData a SaaS Data Platform for atmospheric big data and data science research group in Brazil.

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
docker build -t polidata-webapp .
docker run -p 3000:3000 polidata-webapp
```

The output should be `Listening on port 3000`, then the webapp is available locally at <http://localhost:3000/>.

### Visual Studio Code

Use extensions to be productive: https://www.geeksforgeeks.org/top-10-extensions-for-reactjs-in-vscode/

Also install: 

- https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
- https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag
- https://marketplace.visualstudio.com/items?itemName=vitaliymaz.vscode-svg-previewer

### TailwindCSS

Some defaults and components could be visualized in <http://localhost:3000/design-system/>.