# Wallbox project

This repo is the answer of Joel Barenco to task given by Wallbox for the recruitment process.

See `instructions.md` for the requirements.

## Quick start

In order to set up the architecture locally, follow the below instructions:

```bash
cd docker/
docker-compose up --build
```

Then, in 2 other seperate shell windows, run:

```bash
npm run start:charger
```

and

```bash
npm run start:widget
```

## Infrastructure

When considering the server, the following infrastructure based on AWS services could be used:
- A VPC with both public (for the ELB/Fargate) and private (for the DB) subnets
- AWS ECS Fargate to host the dockerized server in front of an ELB
- AWS CloudPipeline + AWS CloudFormation + AWS CodeBuild to build a CI/CD pipeline to automatically deploy the server to the cloud when changes are pushed to GitHub
- AWS CloudWatch or a third-party service like Grafana to monitor the server
- AWS RDS to host the database if it is SQL (like we used in this example) - otherwise DynamoDB could be a good noSQL candidate. That should be a different stack with its own deployment pipeline. It could be used as an npm package by the server

## Depedencies

No dependencies.

## Tests

In order to make them work, you should set up the system as explain in `## Quick start`. Then, run in the root directory:

```bash
npm run test:i tegration
```

---

## Notes

### Websockets vs REST

When I first read the instructions, I wasn't sure why websockets were needed vs a simple REST API server. This may be due to the fact that I hadn't dealt with websockets before. But searching why websockets were good for, I realised that while the charger was basically sending data to the server, it was then the server that was pushing data to the device. While a callback endpoint coupled with a server deployed on the device could do the trick, it seemed more evident at that point that a websocket was more suited for that particular scenario.

### Decisions

The main decision I took was to decide which library to use on the server to help with the mixture of event-based, async, and synchronous tasks. I decided to go with Highland because it provides exactly that e.g. a way to jungle between different types easily. It also provides a nice functional-programming interface.

### Testing websockets

I came accross an annoying bug when building the test setup. I added on the server side some async validation of the request before allowing messages coming in. This made the test suite block as messages would be sent immediately after the connection to the server was made, but before the async validation could be done - thus loosing the message in limbo :'-( Adding a simple sleep function helped resolved the issue. This could be improved with some kind of manual ping/pong to test if a connection was accepted.

### Typo

Inside of README.md / Devices, devices receive messages with the following format (it is `chargingStatus` instead of `StateOfCharge`):

```javascript
{
    event: "chargingStatus",
    data: {
        status: "charging",
    }
}
```

## Improvements

- add a real logger (Winston-based for ex)
- add more verification steps to the incoming messages (see comments in server/index.js)
- use OO patterns for the server logic as per charger and widget code
- set up some API endpoints on the server to register / unregister chargers and widgets
- move the different charging states inside of either the DB or the config file locally
- create / seed the DB during integration testing at the beginning
- add heartbeat mechanism to detect and close broken connections
- many additional tests (in addition to unit/component ones); also there could be improved by using spies to make sure the expected actions happened on the server