# Notes

## Websockets vs REST

When I first read the instructions, I wasn't sure why websockets were needed vs a simple REST API server. This may be due to the fact that I hadn't dealt with websockets before. But searching why websockets were good for, I realised that while the charger was basically sending data to the server, it was then the server that was pushing data to the device. While a callback endpoint coupled with a server deployed on the device could do the trick, it seemed more evident at that point that a websocket was more suited for that particular scenario.

## Typo

Inside of README.md / Devices, devices receive messages with the following format (it is `chargingStatus` instead of `StateOfCharge`):

```javascript
{
    event: "chargingStatus",
    data: {
        status: "charging",
    }
}
```

## Deployment to the cloud

TODO

## Improvements

- add a real logger (Winston-based for ex)