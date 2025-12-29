import { Request, Response, NextFunction } from "express";
import { z, ZodTypeAny, ZodObject } from "zod";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";

// Allow body/query/params to be optional
export type RequestSchema = ZodObject<{
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}>;

export const validate =
  (schema: RequestSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    // Provide defaults so routes don't need to define empty schemas
    const finalSchema = schema.extend({
      body: schema.shape.body ?? z.object({}),
      query: schema.shape.query ?? z.object({}),
      params: schema.shape.params ?? z.object({}),
    });

    const result = await finalSchema.safeParseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues,
      });
    }

    // Cast to satisfy Express types
    req.body = result.data.body;
    req.query = result.data.query as ParsedQs;
    req.params = result.data.params as ParamsDictionary;

    next();
  };