import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Use a positive decimal string without exponent notation");

const conditionId = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Use letters, numbers, hyphens or underscores");

export const conditionInputSchema = z
  .object({
    condition_id: conditionId,
    description: z.string().trim().min(1).max(1000),
    metric: z.string().trim().min(1).max(120),
    operator: z.enum(["LT", "LTE", "EQ", "GTE", "GT", "BOOLEAN", "CUSTOM"]),
    threshold: decimalString,
    unit: z.string().trim().min(1).max(32),
    evaluation_window: z
      .object({
        value: z.number().int().positive().max(10000),
        unit: z.enum(["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"]),
      })
      .strict(),
    severity: z.enum(["CRITICAL", "HIGH", "NORMAL"]),
  })
  .strict();

export const thesisInputSchema = z
  .object({
    asset: z
      .object({
        chain: z.literal("near"),
        asset_id: z.string().trim().min(1).max(200),
        symbol: z.string().trim().max(32).nullish(),
      })
      .strict(),
    action: z.enum([
      "BUY",
      "SELL",
      "SUPPLY",
      "BORROW",
      "STAKE",
      "ADD_LIQUIDITY",
      "REMOVE_LIQUIDITY",
      "OTHER",
    ]),
    direction: z.enum(["LONG", "SHORT", "NEUTRAL"]).nullish(),
    rationale: z.string().trim().min(20).max(4000),
    position: z
      .object({
        amount: decimalString,
        unit: z.string().trim().min(1).max(32),
        notional_usd: decimalString.nullish(),
      })
      .strict(),
    time_horizon: z
      .object({
        value: z.number().int().positive().max(10000),
        unit: z.enum(["MINUTE", "HOUR", "DAY", "WEEK", "MONTH"]),
      })
      .strict(),
    execution_venue: z.string().trim().max(120).nullish(),
  })
  .strict();

export const prepareAuditSchema = z
  .object({
    thesis: thesisInputSchema,
    conditions: z.array(conditionInputSchema).min(1).max(50),
  })
  .strict()
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.conditions.forEach((condition, index) => {
      if (seen.has(condition.condition_id)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate condition_id: ${condition.condition_id}`,
          path: ["conditions", index, "condition_id"],
        });
      }
      seen.add(condition.condition_id);
    });
  });

export type PrepareAuditInput = z.infer<typeof prepareAuditSchema>;
export type ThesisInput = z.infer<typeof thesisInputSchema>;
export type ConditionInput = z.infer<typeof conditionInputSchema>;
