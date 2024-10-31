# E-commerce Mongo, Node JS, docker, React.

This repository was created exclusively to practice **Node.js**, its integration with the frontend **(React)**, **API** creation, **Docker**, and **Firebase Storage**.

## This repository contains the endpoints for the web application.

### Steps to run the project.

1. clone the repository 
```bash
    git clone "repository url"
```

2. get into the folder
```bash
    cd ecommerce-mongo-nodejs-server
```

3. install dependencies
```bash 
    run npm install
```

- This repo needs a .env file to run. Just email me at poncerodrigom@gmail.com to request it.

- Save the .env file at the root of the project. (ecommerce-mongo-nodejs-server/.env)

- I'm using the **Docker Desktop App** to run the containers.
4. run the containers.
```bash
    docker compose up -D
```

5. run the seed to populate the DDBB with products and users.
```bash
    npm run seed
```

6. run the project:
```bash
    npm run dev
```