# Node.js technical test

## Context

Wallbox is thinking of diversifying its business, and for this, it is going to launch a new mobile recharge service for various events: music festivals and the like. We at Wallbox are very optimistic about the pandemic :D

The charging process will be as follows:

A customer approaches the Wallbox booth, hands over his mobile phone and in return receives a device that will indicate the status of the charging process. This device has a led that changes color depending on the state of the charge:

     - red: charging
     - yellow: charge level at least 80%
     - green: fully charged

When the led turns green, the customer can return to the booth, pay for the service and exchange the device for their charged mobile phone.

## Your mission (if you decide to accept it)

Develop a server to which both chargers and devices will connect via websockets.

During the charging process, the charger periodically sends the charge level to the server.

The server processes these messages and sends a charging status to the device associated with that charger.

Each charger has a unique device associated with it (for example, the charger _c1234_ is associated with the device _wABCD_)

### Chargers

Chargers connect to the server like this:

```javascript
const connection = new WebSocket('ws://localhost:3100/chargers/c1234');
```

where _c1234_ is the charger id.

The messages that the chargers send us indicating their charge level (_State of Charge_) are as follows:

```javascript
connection.send(
	JSON.stringify({
		event: 'StateOfCharge',
		data: {
			soc: 70,
		},
	})
);
```

### Devices

Devices connect to the server like this:

```javascript
const connection = new WebSocket('ws://localhost:3200/widgets/wABCD');
```

where _wABCD_ is the device id.

The devices receive messages from the server indicating the charging status (`charging`,` charging80`, and `charged`):

```javascript
{
    event: "StateOfCharge",
    data: {
        status: "charging",
    }
}
```

The possible state of charge are:

- `charging`
- `charging80`: charge level at 80% or higher
- `charged`: fully charged

## Support tools

To make your life easier, we have created some mocks of the charger (_charger_) and the device (_widget_). You should launch each one in a different terminal.

### Charger mock

```bash
npm run start:charger
```

It connects to your server and allows you to send charge level messages.

### Device mock

```bash
npm run start:widget
```

It connects to your server and displays the status it receives on the screen.

## Aspects to consider:

- It should take you about 4/5 hours to get it done. Your code should be simple, understandable, and conform to the statement. Do not do more than what is asked of you to do. We prefer you to deliver a functional server, to one with many design patterns, but that does not even start. Write down all the improvements that you would like to have added, and tell us about them in the interview.

- (Node> = 12) && (JavaScript || TypeScript)

- You may use any framework / library that you deem helpful in the development. The only requirement is that you use the _ws_ library (https://github.com/websockets/ws/) for the Websockets. The test could actually be done using just this library.

- You don't need to use any database (SQL / NoSQL). The association between chargers and devices can be stored in memory, but make sure that the interface you use is similar to how you would use a database (especially make it asynchronous and try to minimize the number of requests). For this test, the _c1234_ charger will need to be associated with the _wABCD_ device.

- We want you to include some E2E tests (charger -> server -> device), like: _When I receive a certain message from a charger, I should send this other message to the associated device_. You don't have to run a comprehensive test suite. We just want to see how you would do automatic testing with Websockets communications. Mocha or Jest, up to you.

- Add instructions on how to run your code and launch the test suites. You may use Docker, although it is not necessary.

- It would be very interesting if you added notes explaining the most important decisions you made.

- [OPTIONAL] How would you deploy an application like this on AWS?

- If you have any questions, ask away!

- The purpose of this test is for us to be able to assess your technical level and serve as a basis for conversation during the interview. We know that it is not possible to perform miracles in such a short time.
