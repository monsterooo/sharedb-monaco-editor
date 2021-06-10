module.exports = {
  extends: "airbnb-base",
  env: {
    mocha: true,
  },
  rules: {
    quotes: ["error", "double", { avoidEscape: true }],
    "comma-dangle": [
      "error",
      {
        arrays: "ignore",
        objects: "ignore",
        imports: "ignore",
        exports: "ignore",
        functions: "ignore",
      },
    ],
  },
};
