module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    var request = require('request');
    var async = require('async');
    var util = require('util');

    var operatorId = "<your OperatorId>";
    var userName = "<your SAM UserId>";
    var password = "<your Password>";
    var slackWebhookUrl = '<your Slack WebHook URL>';
    var postChannel = "<your Slack Post #Channel>";

    async.waterfall(
        [
            //==================================
            //Authentication Soracom Api.
            //==================================
            function(callback){
                var option = {
                    url: 'https://api.soracom.io/v1/auth',
                    body: {
                        "operatorId" : operatorId,
                        "password" : password,
                        "userName" : userName
                    },
                    json: true
                };
                request.post(option, function(err, res, body){
                    callback(null, {
                        "apiKey": body.apiKey, 
                        "token": body.token
                    });
                });
            },
            //==================================
            //Get Groups.
            //==================================
            function(auth, callback){
                var option = {
                    url: 'https://api.soracom.io/v1/groups?tag_value_match_mode=exact',
                    headers: {
                        'X-Soracom-API-Key': auth.apiKey,
                        'X-Soracom-Token': auth.token
                    }
                };
                request.get(option, function(err, res, body){
                    var groups = JSON.parse(body);
                    callback(null, auth, groups);
                });
            },
            //==================================
            //Get Subscribers each Group.
            //==================================
            function(auth, groups, callback){
                var groupSubscribers = [];
                async.each(groups, function(group, callback){
                    var targetGroup = {
                        "GroupId" : group.groupId,
                        "GroupName" : group.tags["name"]
                    };
                    groupSubscribers[groupSubscribers.length] = targetGroup;
                    var option = {
                        url: util.format('https://api.soracom.io/v1/groups/%s/subscribers', group.groupId),
                        headers: {
                            'X-Soracom-API-Key': auth.apiKey,
                            'X-Soracom-Token': auth.token
                        }
                    };
                    request.get(option, function(err, res, body){
                        var sims = [];
                        JSON.parse(body).forEach(function(sim){
                            sims[sims.length] = {
                                "Imsi" : sim.imsi,
                                "Name" : sim.tags["name"],
                                "Status" : sim.status,
                                "IsOnline" : sim.sessionStatus.online
                            }
                        });
                        targetGroup["Sims"] = sims;
                        callback();
                    });
                }, function(err){
                    callback(null, auth, groupSubscribers);
                });
            },
            //==================================
            //Get Packet Information.
            //==================================
            function(auth, groupSubscribers, callback){
                // term 1 hour.
                var unixSecondTo = Math.floor(new Date().getTime() / 1000);
                var unixSecondFrom = unixSecondTo - 3600;
                async.each(groupSubscribers, function(group, callback){
                    async.each(group["Sims"], function(sim, callback){
                        var option = {
                            url: util.format(
                                'https://api.soracom.io/v1/stats/air/subscribers/%s?from=%s&to=%s&period=minutes', 
                                sim.Imsi,
                                unixSecondFrom,
                                unixSecondTo),
                            headers: {
                                'X-Soracom-API-Key': auth.apiKey,
                                'X-Soracom-Token': auth.token
                            }
                        };
                        request.get(option, function(err, res, body){
                            sim.UploadByte = 0;
                            sim.DownloadByte = 0;
                            JSON.parse(body).forEach(function(data){
                                sim.UploadByte += data["dataTrafficStatsMap"]["s1.standard"]["uploadByteSizeTotal"];
                                sim.DownloadByte += data["dataTrafficStatsMap"]["s1.standard"]["downloadByteSizeTotal"];
                            });
                            callback();
                        });
                    }, function(err){
                        callback();
                    });
                }, function(err){
                    //todo:not implement build message from json.
                    callback(null, JSON.stringify(groupSubscribers));
                });
            },
            //==================================
            //Post to Slack.
            //==================================
            function(message, callback){
                var option = {
                    url: slackWebhookUrl,
                    form: JSON.stringify({
                        "text":message, 
                        "username":"SORACOM AIR",
                        "icon_emoji":":signal_strength",
                        "channel":postChannel
                    }),
                    json: true
                };
                request.post(option, function(err, res, body){
                    callback(null);
                });
            }
        ], function(err){
            process.exit(0);
        }
        
    );

    context.done();
};