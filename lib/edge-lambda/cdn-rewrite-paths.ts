 import {
  CloudFrontRequestEvent,
  CloudFrontRequestCallback,
  Context,
} from "aws-lambda";

exports.handler = (
  event: CloudFrontRequestEvent,
  context: Context,
  callback: CloudFrontRequestCallback
) => {
  const request = event.Records[0].cf.request;

  request.uri = request.uri.replace(/^\/iframely\/(.*)/, "/$1");

  return callback(null, request);
};
