var request = require('request');
var assert = require('assert');
var Promise = require('bluebird');
var expectRejection = require('./../helpers').expectRejection;

describe("Good guy HTTP", function() {
  var app = require('./../test-app/test-app')();

  var gghttp = require('../../')({
    maxRetries: 0,
    collapseSimilarRequests: true,
    cache: false
  });

  before(function(done) {
    app.startListening().then(done).catch(done);
  });
  after(function(done) {
    app.stopListening().then(done).catch(done);
  });

  it("should return the body on success", function(done) {
    gghttp(app.url("/return-body/hello")).then(function(result) {
      assert.equal(result, "hello");
      done();
    }).catch(done);
  });

  it("should reject the promise on 4xx HTTP status", function(done) {
    expectRejection(gghttp(app.url("/return-status/404"))).then(function(err) {
      assert.equal(err.code, "EHTTP");
      assert.equal(err.message, "HTTP error: status code 404");
      assert.equal(err.status, 404);
      done();
    }).catch(done);
  });

  it("should reject the promise on 5xx HTTP status", function(done) {
    expectRejection(gghttp(app.url("/return-status/500"))).then(function(err) {
      assert.equal(err.code, "EHTTP");
      assert.equal(err.message, "HTTP error: status code 500");
      assert.equal(err.status, 500);
      done();
    }).catch(done);
  });

  it("should reject when the request times out", function(done) {
    expectRejection(gghttp({
      url: app.url("/delay-for-ms/2000"),
      timeout: 10
    })).then(function(err) {
      assert.equal(err.code, "ETIMEDOUT");
      done();
    }).catch(done);
  });

  it("should reject when connection fails", function(done) {
    expectRejection(gghttp(app.url("http://127.0.0.1:1"))).then(function(err) {
      assert.equal(err.code, "ECONNREFUSED");
      done();
    }).catch(done);
  });
});
