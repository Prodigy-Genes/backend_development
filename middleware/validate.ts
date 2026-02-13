import type { Request, Response, NextFunction, RequestHandler } from "express";
import * as z from "zod";

export const validate =
  (schema: z.ZodTypeAny): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          errors: e.issues.map((err) => ({
            field: err.path[1] || err.path[0],
            message: err.message,
          })),
        });
      }

      next(e);
    }
  };
