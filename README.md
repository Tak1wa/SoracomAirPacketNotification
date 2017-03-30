# SoracomAirPacketNotification

I created this script for use with Azure Functions.  
Acquires SORACOM AIR SIM communication fee and notifies to Slack channel.  
In accordance with Timer Trigger of Azure Functions, we will inform you of the communication fee for the most recent one hour of execution time.  

## Requires
- The SORACOM AIR account is required separately.
- Slack Channel WebHook.
- Azure Functions Account.
- npm init & install.
```bash
npm init
npm install --save-dev request
npm install --save-dev async
```

## Usage
Please change the following value of index.js to your value.
```node
var operatorId = "<your OperatorId>";
var userName = "<your SAM UserId>";
var password = "<your Password>";
var slackWebhookUrl = '<your Slack WebHook URL>';
var postChannel = "<your Slack Post #Channel>";
```
