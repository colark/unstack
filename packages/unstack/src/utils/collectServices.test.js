const collectServices = require("./collectServices");

describe("when a self handler is present", () => {
  it("returns the proper services collection", () => {
    const selfServiceDefinition = {
      commands: {
        test: "cat package.json"
      }
    };

    const serviceManifest = {
      api: {
        handler: {
          name: "cool"
        }
      },
      platforms: {
        chat: selfServiceDefinition
      }
    };
    const collectedServices = collectServices(serviceManifest);

    expect(collectedServices).toContainEqual({
      location: "platforms/chat",
      definition: selfServiceDefinition
    });
  });
});
