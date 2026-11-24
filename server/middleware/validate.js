/**
 * Zod validation middleware factory.
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Request property to validate
 *
 * Validated data is placed on req.validated (body), req.validatedQuery (query),
 * or req.validatedParams (params).
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body
      : source === 'query' ? req.query
      : req.params;

    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    if (source === 'body') req.validated = result.data;
    else if (source === 'query') req.validatedQuery = result.data;
    else req.validatedParams = result.data;

    next();
  };
}
