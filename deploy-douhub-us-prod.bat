SET AWS_PROFILE=douhub
CALL ..\..\..\sync.bat
CALL serverless deploy --stage prod --accountId 110064165845 --apiName s3-video-create --pipelineId 1592849462133-w3c50q --presetId 1554835977851-ikp3br --apiDomain douhub.cloud --clientName douhub --region us-east-1 --roleName douhub-lambda-super -v
