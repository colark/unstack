const isImplicitService = require("./isImplicitService");

describe("#isImplicitService", () => {
  it("returns true when implicit", () => {
    const implicitServiceDefinition = {
      type: "context"
    };
    const result = isImplicitService("", implicitServiceDefinition);

    expect(result).toEqual(true);
  });

  it("returns true when implicit", () => {
    const implicitServiceDefinition = {};
    const result = isImplicitService("self", implicitServiceDefinition);

    expect(result).toEqual(true);
  });

  it("returns false when not implicit", () => {
    const implicitServiceDefinition = {
      anything: "hello"
    };
    const result = isImplicitService("", implicitServiceDefinition);

    expect(result).toEqual(false);
  });
});
