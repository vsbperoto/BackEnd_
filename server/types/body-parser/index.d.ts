declare module "body-parser" {
  type JsonOptions = Record<string, unknown>;
  interface BodyParserModule {
    json(options?: JsonOptions): unknown;
  }
  const bodyParser: BodyParserModule;
  export default bodyParser;
}
