/**
 * Shared Remote contract for the prompt-optimizer Plugin.
 *
 * HOST-ONLY MODULE. The browser half cannot import sibling files (the Client
 * module table resolves platform seed words and registered packages, not
 * relative paths), so `client.js` carries its own literal copy of these
 * descriptors. Keep the two in sync: package name, namespace, method names,
 * parameter `wire` names, and their order.
 */

/** Package identity; must equal package.json `name`. */
export const PACKAGE = '@qwh15622336051/dsh-prompt-optimizer';

/** Wire namespace; also the Cordis Service key of the Remote service. */
export const NAMESPACE = 'promptOptimizer';

/**
 * A schema stand-in for one codec.
 *
 * The Typert Gateway only requires `codec.mode === 'strict'`; `create()` is
 * reached lazily through the generated `input()` helper, which this package
 * never calls. Returning a self-consistent stub keeps the contract
 * dependency-free (no `zod` in the browser), while the Host still performs
 * explicit validation inside each method.
 * @returns {object} a chainable, permissive schema stand-in.
 */
function stubSchema() {
  const schema = {
    optional: () => schema,
    nonoptional: () => schema,
    parse: (value) => value,
    safeParse: (value) => ({ success: true, data: value }),
    jsonSchema: { type: 'object', additionalProperties: true },
  };
  return schema;
}

/**
 * Build one strict codec descriptor.
 * @param {string} typeSymbol - wire type name used by generated tooling.
 * @returns {object} the codec descriptor.
 */
function codec(typeSymbol) {
  return { mode: 'strict', typeSymbol, create: stubSchema };
}

/**
 * Build one positional parameter descriptor.
 * @param {string} name - parameter name and wire name.
 * @param {string} description - human-readable meaning for generated schemas.
 * @returns {object} the parameter descriptor.
 */
function parameter(name, description) {
  return { name, wire: name, source: 'json', description, codec: codec(name) };
}

/** Method descriptors mounted by both halves. */
export const DESCRIPTORS = [
  {
    id: `${PACKAGE}#${NAMESPACE}/optimize`,
    namespace: NAMESPACE,
    service: NAMESPACE,
    method: 'optimize',
    invocation: { kind: 'direct' },
    parameters: [
      parameter('sessionId', 'Session whose Agent supplies the model route and working directory.'),
      parameter('text', 'Current composer draft, with reference chips expanded to their clipboard text.'),
      parameter('references', 'Structured reference chips from the draft, in document order.'),
    ],
    result: codec('PromptOptimizeResult'),
  },
  {
    id: `${PACKAGE}#${NAMESPACE}/getSettings`,
    namespace: NAMESPACE,
    service: NAMESPACE,
    method: 'getSettings',
    invocation: { kind: 'direct' },
    parameters: [],
    result: codec('PromptOptimizerSettings'),
  },
  {
    id: `${PACKAGE}#${NAMESPACE}/setSettings`,
    namespace: NAMESPACE,
    service: NAMESPACE,
    method: 'setSettings',
    invocation: { kind: 'direct' },
    parameters: [
      parameter('patch', 'Changed configuration fields; omitted fields keep their stored value.'),
      parameter('revision', 'Revision returned by getSettings, used as a compare-and-set guard.'),
    ],
    result: codec('PromptOptimizerSettings'),
  },
];
