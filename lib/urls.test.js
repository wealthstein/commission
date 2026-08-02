const test = require("node:test");
const assert = require("node:assert/strict");

const { urls } = require("./urls.js");

test("comparison URL is nested under /comparisons", () => {
  assert.equal(urls.comparison("google-ads"), "/comparisons/google-ads");
});

test("industry URL is nested under /industries", () => {
  assert.equal(urls.industry("real-estate"), "/industries/real-estate");
});

test("program URL is nested under /programs", () => {
  assert.equal(urls.program("gtbank-affiliate-program"), "/programs/gtbank-affiliate-program");
});

test("audienceHome builds a query param, with or without an anchor", () => {
  assert.equal(urls.audienceHome("business"), "/?for=business");
  assert.equal(urls.audienceHome("business", "pricing"), "/?for=business#pricing");
});

test("corporate pages nest under /corporate", () => {
  assert.equal(urls.about(), "/corporate/about");
  assert.equal(urls.terms(), "/corporate/terms");
});

test("product URL takes both a business and product slug", () => {
  assert.equal(urls.product("acme-co", "widget"), "/products/acme-co/widget");
});
