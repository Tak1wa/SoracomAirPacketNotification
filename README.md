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
