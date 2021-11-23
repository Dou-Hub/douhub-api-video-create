//  COPYRIGHT:       DouHub Inc. (C) 2021 All Right Reserved
//  COMPANY URL:     https://www.douhub.com/
//  CONTACT:         developer@douhub.com
// 
//  This source is subject to the DouHub License Agreements. 
// 
//  Our EULAs define the terms of use and license for each DouHub product. 
//  Whenever you install a DouHub product or research DouHub source code file, you will be prompted to review and accept the terms of our EULA. 
//  If you decline the terms of the EULA, the installation should be aborted and you should remove any and all copies of our products and source code from your computer. 
//  If you accept the terms of our EULA, you must abide by all its terms as long as our technologies are being employed within your organization and within your applications.
// 
//  THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY
//  OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT
//  LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
//  FITNESS FOR A PARTICULAR PURPOSE.
// 
//  ALL OTHER RIGHTS RESERVED

'use strict';

import _ from "../../../libs/helper";
import AWS from 'aws-sdk';
const elastictranscoder = new AWS.ElasticTranscoder();

export const processVideo = async (event, context, callback) => {

    if (_.callFromAWSEvents(event)) return;
    if (_.track) console.log(JSON.stringify(event));

    const result = await _.processSNSRecords(event.Records, async (record) => {
        try {
            for (var i = 0; i < record.Records.length; i++) {
                await processInternal(record.Records[i]);
            }
        }
        catch (ex) {
            console.error(ex);
        }
    });

    if (_.track) console.log({ result });
}

const processInternal = async (record) => {

    const fileFullName = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    const fileFullNameInfo = fileFullName.split('/'); //array that has folders and fileName
    const fileName = fileFullNameInfo.splice(-1)[0]; // something.mp4
    const fileNameBase = fileName.substring(0, fileName.indexOf('.mp4'));  //fila name without mp4 extension, something
    const fileFolder = fileFullNameInfo.length == 0 ? '' : fileFullNameInfo.join('/');

    if (!_.isNonEmptyString(fileFolder)) new Error('The file has to be in a folder.');
    if (!_.isNonEmptyString(process.env.PRESETID)) new Error('Preset ID was not provided.');
    if (!_.isNonEmptyString(process.env.PIPELINEID)) new Error('Pipeline ID was not provided.');

    if (_.track) console.log({ fileFullName, fileFolder, fileName, fileNameBase });

    var params = {
        Input: { Key: fileFullName },
        PipelineId: process.env.PIPELINEID, //Your Elastic Transcoder Pipeline Id
        Outputs: [{
            Key: fileFolder.length == 0 ? fileNameBase : `${fileFolder}/${fileNameBase}`,
            PresetId: process.env.PRESETID,
            ThumbnailPattern: fileFolder.length == 0 ? `${fileNameBase}-{count}` : `${fileFolder}/${fileNameBase}-{count}`,
            SegmentDuration: '10',
        }],

        Playlists: [{
            Format: 'HLSv3',
            Name: fileFolder.length == 0 ? `index` : `${fileFolder}/index`,
            OutputKeys: [fileFolder.length == 0 ? fileNameBase : `${fileFolder}/${fileNameBase}`]
        }]

    };

    if (_.track) console.log(JSON.stringify(params));

    const data = await (() => {
        return new Promise((resolve, reject) => {
            elastictranscoder.createJob(params, function (err, data) {
                if (err) reject(err); // an error occurred
                else resolve(data); // successful response
            });
        })
    })();

    console.log({data});

}
