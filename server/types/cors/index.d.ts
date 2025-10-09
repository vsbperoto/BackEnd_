declare module "cors" {
  type CorsOptions = Record<string, unknown>;
  function cors(options?: CorsOptions): unknown;
  export default cors;
}
